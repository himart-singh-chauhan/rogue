-- AMPEX: referral & rewards program, order notes, sponsor videos and data fixes (Nov 2026).
-- Safe to run more than once. Run after 2026-11-09_client_corrections.sql.

-- ---------------------------------------------------------------------------
-- 1. Referral codes on member accounts
-- ---------------------------------------------------------------------------
alter table users add column if not exists referral_code text;
alter table users add column if not exists referred_by uuid references users(id) on delete set null;
create unique index if not exists users_referral_code_key on users (referral_code) where referral_code is not null;

-- Give every existing member a code (8 letters/numbers from their id; unique because ids are)
update users set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

-- ---------------------------------------------------------------------------
-- 2. Referrals: one row per referred member (so a person can only ever be referred once)
-- ---------------------------------------------------------------------------
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referred_id uuid not null references users(id) on delete cascade,
  code text not null,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'flagged', 'rejected')),
  points_awarded integer not null default 0,
  signup_ip_hash text,
  note text,
  decided_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint referrals_not_self check (referrer_id <> referred_id)
);
create unique index if not exists referrals_referred_key on referrals (referred_id);
create index if not exists referrals_referrer_idx on referrals (referrer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Reward points ledger (append-only). Separate from competition ranking points.
-- ---------------------------------------------------------------------------
create table if not exists reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  points integer not null,
  type text not null check (type in ('referral', 'referral_reversal', 'purchase', 'purchase_reversal', 'manual', 'promotion', 'fraud_adjustment')),
  reference_type text,
  reference_id text,
  reason text,
  admin_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reward_transactions_user_idx on reward_transactions (user_id, created_at desc);
create index if not exists reward_transactions_ref_idx on reward_transactions (reference_type, reference_id);
-- Exactly-once: an automatic award (or its reversal) can exist only once per member and reference
create unique index if not exists reward_transactions_once
  on reward_transactions (user_id, type, reference_id)
  where reference_id is not null and type in ('referral', 'referral_reversal', 'purchase', 'purchase_reversal');

-- The ledger is append-only: rows can't be edited or deleted (corrections are new rows)
create or replace function reward_transactions_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'reward_transactions is append-only; add a correcting transaction instead';
end $$;
drop trigger if exists reward_transactions_no_update on reward_transactions;
create trigger reward_transactions_no_update before update on reward_transactions
  for each row execute function reward_transactions_append_only();
-- (deletes are allowed only through cascade when a member account is removed)

-- ---------------------------------------------------------------------------
-- 4. Program settings (one row, edited in Admin → Rewards & Referrals)
-- ---------------------------------------------------------------------------
create table if not exists reward_settings (
  id integer primary key default 1 check (id = 1),
  settings jsonb not null,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into reward_settings (id, settings) values (1, '{
  "enabled": true,
  "referralPoints": 10,
  "referralQualifiesOn": "first_verified_record",
  "maxReferralsPerDay": 20,
  "levels": [
    { "name": "Member", "minPoints": 0, "discountPercent": 0 },
    { "name": "Bronze Reward", "minPoints": 100, "discountPercent": 5 },
    { "name": "Silver Reward", "minPoints": 250, "discountPercent": 10 },
    { "name": "Gold Reward", "minPoints": 500, "discountPercent": 20 },
    { "name": "AMPEX Ambassador", "minPoints": 1000, "discountPercent": 40 }
  ],
  "purchase": {
    "pointsPerDollar": 1,
    "categoryRates": {},
    "productPoints": {},
    "excludedCategories": ["Tickets"],
    "excludedProductIds": []
  },
  "discount": {
    "excludedCategories": ["Tickets"],
    "excludedProductIds": []
  },
  "promotion": { "active": false, "multiplier": 2, "startsAt": null, "endsAt": null, "label": "" },
  "allowCouponStacking": false
}'::jsonb)
on conflict (id) do nothing;

alter table referrals enable row level security;
alter table reward_transactions enable row level security;
alter table reward_settings enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Order notes (e.g. the details to print on an ordered certificate)
-- ---------------------------------------------------------------------------
alter table order_items add column if not exists notes text;
alter table orders add column if not exists reward_discount numeric(10, 2) not null default 0;
alter table orders add column if not exists reward_level text;

-- ---------------------------------------------------------------------------
-- 6. Sponsor videos (shown beside / instead of the banner image)
-- ---------------------------------------------------------------------------
alter table sponsors add column if not exists video_url text;

-- ---------------------------------------------------------------------------
-- 7. Data fixes from the client's review
-- ---------------------------------------------------------------------------
-- Records still labelled with the old "Skills" category belong to Talent
update records set category = 'Talent', updated_at = now()
where lower(trim(category)) = 'skills';
update records r set category_id = c.id
from categories c
where c.name = 'Talent' and r.category = 'Talent' and (r.category_id is null or r.category_id <> c.id)
  and not exists (select 1 from categories x where x.id = r.category_id and x.parent = c.id);

-- The admin account's display name still said Rogue
update users set name = 'AMPEX Admin' where name = 'Rogue Admin';

-- Clothing listed under Accessories goes to Apparel
update products set category = 'Apparel', updated_at = now()
where category in ('Accessories', 'accessories', 'Equipment')
  and (name ilike '%hoodie%' or name ilike '%sweat suit%' or name ilike '%sweatsuit%' or name ilike '%sweatshirt%'
       or name ilike '%shirt%' or name ilike '%jacket%' or name ilike '%apparel%');
