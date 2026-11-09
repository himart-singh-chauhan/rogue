-- =====================================================================================
-- 2026-11-09 — Client corrections batch (AMPEX handoff)
-- Safe to re-run: every statement is IF NOT EXISTS / ON CONFLICT / guarded by a flag.
-- =====================================================================================

-- ---------- Records: real verification date ----------
alter table records add column if not exists verified_at timestamptz;
update records set verified_at = coalesce(approved_at, updated_at)
 where status = 'verified' and verified_at is null;

-- ---------- Shop: products that need admin approval (championship belts) ----------
alter table products add column if not exists requires_authorization boolean not null default false;

create table if not exists product_authorizations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'fulfilled', 'revoked')),
  request_note text,
  admin_note text,
  decided_by uuid references users(id) on delete set null,
  decided_at timestamptz,
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ---------- Coupons: per-account limit + redemption log ----------
alter table coupons add column if not exists max_per_user integer not null default 1;

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  customer_email text,
  context text,                      -- shop | membership | submission | ticket
  reference_id text,                 -- order / record / membership id
  discount_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_coupon_redemptions_coupon_user on coupon_redemptions (coupon_id, user_id);
create index if not exists idx_coupon_redemptions_coupon_email on coupon_redemptions (coupon_id, lower(customer_email));

-- Atomic redemption: enforces total and per-account limits in one transaction.
-- Returns 'ok' | 'not_found' | 'inactive' | 'limit_total' | 'limit_user'
create or replace function redeem_coupon_v2(p_code text, p_user uuid, p_email text, p_context text, p_reference text, p_discount numeric)
returns text language plpgsql as $$
declare c coupons%rowtype; used integer;
begin
  select * into c from coupons where code = upper(p_code) for update;
  if not found then return 'not_found'; end if;
  if not c.active then return 'inactive'; end if;
  if c.max_redemptions is not null and c.redemptions_count >= c.max_redemptions then return 'limit_total'; end if;
  if c.max_per_user is not null and c.max_per_user > 0 then
    select count(*) into used from coupon_redemptions r
     where r.coupon_id = c.id
       and ((p_user is not null and r.user_id = p_user) or (p_email is not null and lower(r.customer_email) = lower(p_email)));
    if used >= c.max_per_user then return 'limit_user'; end if;
  end if;
  update coupons set redemptions_count = redemptions_count + 1, updated_at = now() where id = c.id;
  insert into coupon_redemptions (coupon_id, user_id, customer_email, context, reference_id, discount_amount)
  values (c.id, p_user, p_email, p_context, p_reference, coalesce(p_discount, 0));
  return 'ok';
end $$;

-- ---------- Membership plans: one editable source of truth ----------
create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year', 'one_time')),
  submission_limit integer,          -- null = unlimited
  features jsonb not null default '[]',
  priority_review boolean not null default false,
  vip_profile boolean not null default false,
  color text default '#FF6A00',
  sort_order integer not null default 0,
  active boolean not null default true,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into membership_plans (slug, name, description, price, billing_interval, submission_limit, features, priority_review, vip_profile, color, sort_order) values
  ('free', 'Free', 'New users exploring the platform and casual competitors.', 0, 'month', 3, '["Create an official account","Browse all world records","View public leaderboards","3 standard record submissions monthly","Digital participation badges","Basic profile customization","Follow competitors and categories"]', false, false, '#94A3B8', 0),
  ('bronze', 'Bronze', 'Competitors beginning their journey and wanting more platform access.', 10.99, 'month', 10, '["Everything in Free","10 monthly record submissions","Bronze Member verification badge","Faster support response times","Access to member-only challenges","Eligibility for select prize events","Basic analytics & stats tracking"]', false, false, '#CD7F32', 1),
  ('silver', 'Silver', 'Serious competitors aiming to grow their rankings and recognition.', 20, 'month', 15, '["Everything in Bronze","15 monthly record submissions","Priority submission review","Silver verified profile badge","Advanced statistics dashboard","Access to premium competitions","Featured competitor opportunities"]', true, false, '#C0C0C0', 2),
  ('gold', 'Gold', 'Elite competitors, professionals, influencers and top-ranked challengers.', 50, 'month', null, '["Everything in Silver","Unlimited record submissions","Priority verification","Gold verified elite member badge","Entry into elite championships","Front-page profile promotion"]', true, false, '#FFD700', 3),
  ('diamond', 'Diamond', 'Top competitors who want priority review and a VIP profile.', 200, 'month', null, '["Everything in Gold","Unlimited record submissions","Priority review on every submission","VIP competitor profile and badge","VIP support access"]', true, true, '#7DD3FC', 4),
  ('vip_package', 'VIP Package', 'Pay once: Diamond-level benefits for life.', 250, 'one_time', null, '["One payment, lifetime access","Everything in Diamond","Unlimited record submissions","Priority review on every submission","VIP competitor profile and badge"]', true, true, '#00FA9A', 5)
on conflict (slug) do nothing;

-- memberships.tier may now be any plan slug (validated in the API against membership_plans)
alter table memberships drop constraint if exists memberships_tier_check;
-- upgrade requests wait as 'pending' until payment is confirmed
alter table memberships drop constraint if exists memberships_status_check;
alter table memberships add constraint memberships_status_check
  check (status in ('active', 'cancelled', 'expired', 'pending'));
alter table subscriptions drop constraint if exists subscriptions_plan_tier_check;

-- ---------- Weight classes (Division Management) ----------
create table if not exists weight_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  min_weight numeric(7, 2),          -- null = no lower limit
  max_weight numeric(7, 2),          -- null = no upper limit
  unit text not null default 'lbs' check (unit in ('lbs', 'kg')),
  category_id uuid references categories(id) on delete set null,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into weight_classes (name, code, min_weight, max_weight, unit, sort_order)
select * from (values
  ('Lightweight', 'LW', null::numeric, 155::numeric, 'lbs', 0),
  ('Middleweight', 'MW', 156, 185, 'lbs', 1),
  ('Heavyweight', 'HW', 186, null, 'lbs', 2)
) v(name, code, min_weight, max_weight, unit, sort_order)
where not exists (select 1 from weight_classes);

-- ---------- Media library ----------
alter table media_assets add column if not exists file_name text;
alter table media_assets add column if not exists mime_type text;
alter table media_assets add column if not exists file_size bigint;
alter table media_assets drop constraint if exists media_assets_asset_type_check;
alter table media_assets add constraint media_assets_asset_type_check
  check (asset_type in ('photo', 'video', 'graphic', 'banner', 'social', 'certificate', 'document', 'other'));

-- ---------- Certificates & awards ----------
create table if not exists certificate_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'certificate' check (kind in ('certificate', 'award')),
  image_url text not null,
  orientation text not null default 'landscape' check (orientation in ('landscape', 'portrait')),
  layout jsonb not null default '{}',   -- field positions (fractions of width/height)
  achievement text not null default 'any', -- any | world_record | challenge | custom label
  is_default boolean not null default false,
  active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists certificate_issuances (
  id uuid primary key default gen_random_uuid(),
  certificate_number text unique not null,
  record_id uuid references records(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  template_id uuid references certificate_templates(id) on delete set null,
  status text not null default 'issued' check (status in ('issued', 'revoked')),
  recipient_name text not null,
  record_title text,
  record_value text,
  date_achieved date,
  date_verified date,
  issued_by uuid references users(id) on delete set null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists certificate_issuances_one_per_record
  on certificate_issuances (record_id) where status = 'issued';

insert into certificate_templates (name, kind, image_url, orientation, layout, achievement, is_default)
select * from (values
  ('AMPEX Official World Record — Landscape', 'certificate', '/certificates/ampex-certificate-landscape.jpg', 'landscape',
   '{"preset":"ampex-landscape"}'::jsonb, 'any', true),
  ('AMPEX Official World Record — Portrait', 'certificate', '/certificates/ampex-certificate-portrait.jpg', 'portrait',
   '{"preset":"ampex-portrait"}'::jsonb, 'any', false)
) v(name, kind, image_url, orientation, layout, achievement, is_default)
where not exists (select 1 from certificate_templates where image_url like '/certificates/ampex-%');

-- ---------- Sponsors: image fit controls ----------
alter table sponsors add column if not exists image_fit text not null default 'contain';
alter table sponsors add column if not exists image_position text not null default 'center';
alter table sponsors drop constraint if exists sponsors_image_fit_check;
alter table sponsors add constraint sponsors_image_fit_check check (image_fit in ('contain', 'cover'));

-- ---------- Leaderboard points: awards go from 100 to 10 points (one-time rescale) ----------
do $$
begin
  if not exists (select 1 from system_settings where key = 'points_scaled_to_10') then
    update points_rules set points_value = greatest(1, round(points_value / 10.0)), updated_at = now();
    update user_points_history set points_awarded = round(points_awarded / 10.0);
    update user_rankings set total_points = round(total_points / 10.0), updated_at = now();
    insert into system_settings (key, value) values ('points_scaled_to_10', now()::text);
  end if;
end $$;

-- Every verified record is an official world record (as the certificate states): W.R. = verified count
update user_rankings set world_records_count = verified_records_count where world_records_count < verified_records_count;

-- ---------- Categories: "Talent" with "Funny Talent" underneath ----------
insert into categories (name, slug, description, order_num, active, is_default)
values ('Talent', 'talent', 'Unique and entertaining talents.', 5, true, false)
on conflict (name) do nothing;
update categories c set parent = t.id, name = 'Funny Talent', slug = 'funny-talent', updated_at = now()
  from categories t
 where t.slug = 'talent' and c.name in ('Funny Talents', 'Funny Talent') and c.id <> t.id;
insert into categories (name, slug, description, parent, order_num, active, is_default)
select 'Funny Talent', 'funny-talent', 'Comedic and funny talents.', t.id, 0, true, false
  from categories t where t.slug = 'talent'
   and not exists (select 1 from categories where slug = 'funny-talent');

-- ---------- Global SEO ----------
insert into system_settings (key, value) values
  ('seo_title', 'AMPEX World Records Elite Athlete Database'),
  ('seo_description', 'AMPEX World Records — the elite athlete database for verified world records, rankings and live events.')
on conflict (key) do nothing;

-- New tables: RLS on, no policies (server uses the service-role key)
alter table product_authorizations enable row level security;
alter table coupon_redemptions enable row level security;
alter table membership_plans enable row level security;
alter table weight_classes enable row level security;
alter table certificate_templates enable row level security;
alter table certificate_issuances enable row level security;

-- Shop: belts and chains get their own sections; belts can only be bought after admin approval
update products set category = 'Championship Belts', requires_authorization = true
  where name ilike '%belt%' and category is distinct from 'Championship Belts';
update products set requires_authorization = true
  where category = 'Championship Belts' and requires_authorization = false;
update products set category = 'Chains'
  where name ilike '%chain%' and category is distinct from 'Championship Belts' and category is distinct from 'Chains';

-- Ranks were never computed for existing athletes; fill them now.
select recalculate_global_ranks();
