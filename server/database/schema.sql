-- =====================================================================================
-- ROGUE WORLD RECORDS — COMPLETE DATABASE SCHEMA (Supabase / PostgreSQL)
-- =====================================================================================
-- Run this ONCE in a brand-new Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
-- It is safe to re-run (everything is IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- It replaces supabase_schema.sql + add_ranking_tables.sql + disable_rls.sql, which were
-- out of date with the code (e.g. users.username/country/phone were missing).
--
-- Security model: the Node server talks to the database with the SERVICE ROLE key, which
-- bypasses Row Level Security. RLS is ENABLED on every table with NO policies, so the public
-- anon key (and anyone who finds it) can read or write nothing.
-- =====================================================================================

-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase runs 15+), no extension needed.

-- -------------------------------------------------------------------------------------
-- USERS
-- -------------------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password text not null,                      -- bcrypt hash, never returned by the API
  is_admin boolean not null default false,
  role text not null default 'athlete',         -- athlete | moderator | judge | system_admin
  membership_type text not null default 'free_athlete',
  account_status text not null default 'active',-- active | suspended | banned | pending | trial | inactive
  suspended_until timestamptz,
  suspension_reason text,
  ban_reason text,
  last_login_at timestamptz,
  profile_image text default '',
  username text,
  phone text default '',
  gender text default '',
  dob date,
  weight text,
  weight_unit text default 'kg',
  height text,                                  -- free text: signup sends values like 5'10"
  height_unit text default 'cm',
  country text default '',
  city text default '',
  street_address text default '',
  apartment text,
  state text default '',
  zip_code text default '',
  ethnicity text default '',
  member_number text unique,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_key on users (lower(email));
create unique index if not exists users_username_lower_key on users (lower(username)) where username is not null and username <> '';
create index if not exists idx_users_created_at on users (created_at desc);

-- -------------------------------------------------------------------------------------
-- CATEGORIES & AGE GROUPS
-- -------------------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text default '',
  parent uuid references categories(id) on delete set null,
  order_num integer default 0,
  active boolean default true,
  is_default boolean default false,
  rules text default '',
  submission_requirements text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_parent on categories (parent);

create table if not exists age_groups (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  min_age integer not null,
  max_age integer,
  description text default '',
  active boolean default true,
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- RECORDS (submissions, challenges, world records)
-- The FK on user_id is created with the default name records_user_id_fkey, which the API
-- uses as an embed hint (records also has assigned_judge_id → users).
-- -------------------------------------------------------------------------------------
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,   -- nullable: admin-created challenges
  athlete_id text,
  slug text unique,
  title text not null,
  category text not null default '',
  category_id uuid references categories(id) on delete set null,
  description text not null default '',
  value text not null default '0',
  unit text not null default '',
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verification_status text,                     -- under_review | pending_review | needs_info | approved | denied | priority
  record_type text not null default 'standard' check (record_type in ('standard', 'challenge', 'world_record')),
  evidence_url text not null default '',
  thumbnail_url text,
  video_url text,
  video_type text check (video_type in ('upload', 'youtube') or video_type is null),
  venue_name text,
  city text,
  state text,
  country text,
  witnesses jsonb not null default '[]',
  is_featured boolean not null default false,
  homepage_section text check (homepage_section in ('featured', 'newly_verified', 'recent_uploads', 'top_ranked') or homepage_section is null),
  homepage_order integer not null default 0,
  show_on_homepage boolean default true,
  show_in_new_records boolean default true,
  published boolean default true,
  approved_at timestamptz,
  admin_notes text,
  -- judge workflow
  assigned_judge_id uuid references users(id) on delete set null,
  judge_decision text check (judge_decision in ('verified', 'rejected', 'pending') or judge_decision is null),
  judge_notes text,
  judge_assigned_at timestamptz,
  judge_decided_at timestamptz,
  -- social counters (maintained by triggers below)
  views integer not null default 0,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  date_set timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_records_user_id on records (user_id);
create index if not exists idx_records_status_created on records (status, created_at desc);
create index if not exists idx_records_category on records (category);
create index if not exists idx_records_category_id on records (category_id);
create index if not exists idx_records_homepage_section on records (homepage_section);
create index if not exists idx_records_assigned_judge on records (assigned_judge_id);
create index if not exists idx_records_is_featured on records (is_featured) where is_featured;

create table if not exists record_meta (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null unique references records(id) on delete cascade,
  tracking_number text,
  submission_fee numeric(10, 2) default 0,
  payment_status text not null default 'pending_payment', -- pending_payment | pending | paid | failed | refunded
  coupon_code text,
  admin_notes text,
  history jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_verification_scans (
  id uuid primary key default gen_random_uuid(),
  record_id uuid unique references records(id) on delete cascade,
  confidence_score numeric(5, 2) not null default 0,
  face_check text default 'passed' check (face_check in ('passed', 'flagged', 'failed')),
  deepfake_check text default 'passed' check (deepfake_check in ('passed', 'flagged', 'failed')),
  video_tamper_check text default 'passed' check (video_tamper_check in ('passed', 'flagged', 'failed')),
  audio_tamper_check text default 'passed' check (audio_tamper_check in ('passed', 'flagged', 'failed')),
  status text default 'passed' check (status in ('passed', 'suspicious', 'failed')),
  override_status text default 'none' check (override_status in ('approved', 'rejected', 'none')),
  override_reason text,
  suspicious_flagged boolean default false,
  scan_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_scans_status on ai_verification_scans (status);

create table if not exists record_archives (
  id uuid primary key default gen_random_uuid(),
  original_record_id uuid,
  user_id uuid references users(id) on delete set null,
  category text,
  title text,
  snapshot jsonb not null,
  archived_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- SOCIAL: likes, comments, views (previously a JSON file wiped on every deploy)
-- -------------------------------------------------------------------------------------
create table if not exists record_likes (
  record_id uuid not null references records(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (record_id, user_id)
);

create table if not exists record_comments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references records(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists idx_record_comments_record on record_comments (record_id, created_at);

create or replace function sync_record_likes_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update records set likes_count = likes_count + 1 where id = new.record_id;
  elsif tg_op = 'DELETE' then
    update records set likes_count = greatest(likes_count - 1, 0) where id = old.record_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_record_likes_count on record_likes;
create trigger trg_record_likes_count after insert or delete on record_likes
  for each row execute function sync_record_likes_count();

create or replace function sync_record_comments_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update records set comments_count = comments_count + 1 where id = new.record_id;
  elsif tg_op = 'DELETE' then
    update records set comments_count = greatest(comments_count - 1, 0) where id = old.record_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_record_comments_count on record_comments;
create trigger trg_record_comments_count after insert or delete on record_comments
  for each row execute function sync_record_comments_count();

-- Atomic view counter, called by POST /api/social/:id/view
create or replace function increment_record_view(p_record_id uuid) returns integer language sql as $$
  update records set views = views + 1 where id = p_record_id returning views;
$$;

-- -------------------------------------------------------------------------------------
-- RANKINGS & POINTS
-- -------------------------------------------------------------------------------------
create table if not exists user_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  global_rank integer,
  country_rank integer,
  state_rank integer,
  city_rank integer,
  category_id uuid references categories(id) on delete set null,
  category_rank integer,
  total_points integer not null default 0,
  verified_records_count integer not null default 0,
  world_records_count integer not null default 0,
  top_10_placements integer default 0,
  first_place_categories integer default 0,
  featured_records_count integer default 0,
  live_event_wins integer default 0,
  challenge_participations integer default 0,
  appeal_wins integer default 0,
  medals_earned integer default 0,
  certificates_earned integer default 0,
  tier_badge text not null default 'Challenger',  -- Challenger | Pro Competitor | Elite Master | Grand Champion
  last_updated_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_rankings_total_points on user_rankings (total_points desc);
create index if not exists idx_user_rankings_global_rank on user_rankings (global_rank);

create table if not exists user_points_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  points_awarded integer not null default 0,
  source text not null,                         -- record_verified | admin_adjustment | ...
  reference_id text,
  reference_type text,
  reason text,
  admin_notes text,
  admin_id uuid references users(id) on delete set null,
  is_manual boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_points_history_user on user_points_history (user_id, created_at desc);

create table if not exists ranking_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  rank_type text not null,
  rank_value integer,
  previous_rank integer,
  points_at_time integer,
  recorded_at timestamptz not null default now()
);

create table if not exists points_rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null unique,
  points_value integer not null,
  description text,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recompute global_rank for everyone in one statement (POST /api/rankings/recalculate)
create or replace function recalculate_global_ranks() returns integer language plpgsql as $$
declare n integer;
begin
  with ranked as (
    select id, rank() over (order by total_points desc, verified_records_count desc) as r from user_rankings
  )
  update user_rankings u set global_rank = ranked.r, last_updated_at = now()
  from ranked where ranked.id = u.id;
  get diagnostics n = row_count;
  return n;
end $$;

-- -------------------------------------------------------------------------------------
-- EVENTS, TICKETS, STREAMS
-- -------------------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  date timestamptz not null,
  location text not null default '',
  image_url text,
  video_url text,
  stream_url text,
  ticket_link text,
  sponsors text,
  rules text,
  competitors text,
  judges text,
  is_live boolean not null default false,
  is_paid boolean not null default false,
  ticket_price numeric(10, 2) not null default 0,
  is_featured boolean not null default false,
  status text not null default 'upcoming',      -- upcoming | live | completed | cancelled | past
  category text default 'WORLD RECORD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_events_date on events (date);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  access_code text unique not null,
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'pending')),
  ticket_type text default 'spectator',          -- spectator | vip | free
  expires_at timestamptz,
  scan_count integer not null default 0,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tickets_user on tickets (user_id);
create index if not exists idx_tickets_event on tickets (event_id);

-- -------------------------------------------------------------------------------------
-- MEMBERSHIPS
-- -------------------------------------------------------------------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tier text not null check (tier in ('free', 'bronze', 'silver', 'gold')),
  start_date timestamptz default now(),
  end_date timestamptz,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  auto_renew boolean default false,
  submission_limit integer default 3,
  submission_count integer default 0,
  features jsonb not null default '[]',
  price numeric(10, 2) default 0,
  renewal_price numeric(10, 2) default 0,
  payment_history jsonb not null default '[]',
  cancellation_date timestamptz,
  cancellation_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_memberships_user on memberships (user_id);
-- at most one ACTIVE membership per user
create unique index if not exists memberships_one_active_per_user on memberships (user_id) where status = 'active';

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  plan_tier text check (plan_tier in ('free', 'bronze', 'silver', 'gold')),
  status text check (status in ('active', 'past_due', 'canceled')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists vip_competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  is_verified boolean default false,
  vip_status text check (vip_status in ('none', 'elite', 'legend')),
  granted_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- SHOP: products, orders, coupons
-- -------------------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  image_url text,
  image_urls jsonb not null default '[]',
  image_path text,
  category text,
  stock_count integer not null default 0,
  sizes jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  shipping_address text,
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) default 0,
  discount_amount numeric(10, 2) default 0,
  coupon_code text,
  total numeric(10, 2) not null default 0,
  shipping_status text not null default 'pending' check (shipping_status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_user on orders (user_id);
create index if not exists idx_orders_email on orders (customer_email);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  size text,
  color text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_items_order on order_items (order_id);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null,
  active boolean not null default true,
  expiration_date timestamptz,
  applies_to text not null default 'all' check (applies_to in ('all', 'product', 'category', 'membership', 'ticket')),
  target_id text,
  min_purchase numeric(10, 2) default 0,
  max_redemptions integer,
  redemptions_count integer not null default 0,
  restricted_membership_tier text,
  restricted_country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Atomic coupon redemption: only increments while under max_redemptions. Returns true if counted.
create or replace function redeem_coupon(p_code text) returns boolean language plpgsql as $$
declare n integer;
begin
  update coupons
     set redemptions_count = redemptions_count + 1, updated_at = now()
   where code = upper(p_code)
     and active
     and (max_redemptions is null or redemptions_count < max_redemptions);
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- -------------------------------------------------------------------------------------
-- VIDEOS & EVIDENCE
-- (old CHECK "record_id or attempt_id required" removed: featured/newest videos stand alone)
-- -------------------------------------------------------------------------------------
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id) on delete cascade,
  attempt_id uuid,
  user_id uuid references users(id) on delete set null,
  video_type text not null check (video_type in ('record', 'attempt', 'featured', 'newest_record', 'attempt_history')),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  source text not null default 'uploaded' check (source in ('uploaded', 'youtube', 'external_url')),
  youtube_video_id text,
  duration integer,
  category text,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  is_newly_uploaded boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_videos_type_pub_created on videos (video_type, is_published, created_at desc);
create index if not exists idx_videos_record on videos (record_id);

create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references records(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  evidence_type text not null check (evidence_type in ('photo', 'screenshot', 'document', 'certificate')),
  title text not null,
  description text,
  file_url text not null,
  file_name text,
  file_size bigint,
  mime_type text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by uuid references users(id) on delete set null,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_evidence_record on evidence (record_id);

-- -------------------------------------------------------------------------------------
-- CONTACT, CONTENT, SETTINGS
-- -------------------------------------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists system_settings (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists page_content (
  slug text primary key,
  title text not null,
  body text not null,
  last_edited_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  order_index integer default 0,
  is_published boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists homepage_settings (
  section text primary key,
  config jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists countries (
  code text primary key,
  name text not null,
  flag text,
  competitors integer not null default 0,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------------------
-- ADMIN: appeals, moderation, messaging, media, revenue, sponsors, audit
-- -------------------------------------------------------------------------------------
create table if not exists appeals (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  appeal_reason text not null,
  evidence_files jsonb not null default '[]',
  status text not null default 'Pending' check (status in ('Pending', 'Under Review', 'Awaiting Evidence', 'Approved', 'Denied', 'Closed', 'Escalated')),
  admin_notes text,
  resolution_history jsonb not null default '[]',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolved_at timestamptz
);
create index if not exists idx_appeals_status on appeals (status);
create index if not exists idx_appeals_user on appeals (user_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete set null,
  receiver_id uuid references users(id) on delete cascade,
  subject text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('push', 'alert', 'maintenance', 'emergency', 'event')),
  title text not null,
  message text not null,
  audience text check (audience in ('all', 'competitors', 'judges', 'vips', 'specific_user')),
  target_user_id uuid references users(id) on delete cascade,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id) on delete set null,
  reported_item_type text check (reported_item_type in ('user', 'record', 'comment', 'livestream')),
  reported_item_id uuid,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create table if not exists bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  admin_id uuid references users(id) on delete set null,
  reason text not null,
  ban_type text check (ban_type in ('temporary', 'permanent', 'chat_only', 'ip_ban')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid references users(id) on delete set null,
  file_url text not null,
  asset_type text check (asset_type in ('photo', 'video', 'graphic', 'banner', 'social', 'certificate')),
  title text,
  created_at timestamptz not null default now()
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  certificate_url text not null default '',
  is_framed boolean default false,
  order_status text check (order_status in ('pending', 'processing', 'shipped', 'delivered')),
  created_at timestamptz not null default now()
);

create table if not exists manual_revenues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  amount numeric(10, 2) not null,
  status text not null default 'paid' check (status in ('paid', 'pending', 'failed', 'refunded')),
  date_received timestamptz default now(),
  payment_method text not null,
  customer_name text not null,
  member_number text,
  customer_email text not null,
  transaction_id text,
  order_number text,
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo_url text,
  banner_url text,
  placement text check (placement in ('homepage', 'livestream', 'shop', 'footer', 'homepage_top_banner', 'homepage_sidebar', 'live_event', 'featured', 'footer_sponsor', 'video_overlay')),
  link_url text,
  package_type text default 'standard',
  start_date timestamptz,
  end_date timestamptz,
  description text,
  notes text,
  views_count integer not null default 0,
  clicks_count integer not null default 0,
  active_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  service_name text not null unique,
  key_value text not null,
  is_active boolean default true,
  last_used_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id) on delete set null,
  action_type text not null,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_created on audit_logs (created_at desc);

-- -------------------------------------------------------------------------------------
-- ROW LEVEL SECURITY: on for every table, no policies.
-- The server (service-role key) bypasses RLS; the public anon key gets nothing.
-- -------------------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- -------------------------------------------------------------------------------------
-- STORAGE: one public bucket for uploads (videos/, thumbnails/, evidence/, images/, avatars/)
-- file_size_limit 50 MB = Supabase free-plan maximum. Raise it after upgrading the plan.
-- Uploads are authorised by signed upload URLs created by the server, so no storage
-- policies for anon are needed (and none should be added).
-- -------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads', 'uploads', true, 52428800,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg', 'video/x-msvideo',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- -------------------------------------------------------------------------------------
-- SEED DATA
-- -------------------------------------------------------------------------------------
insert into system_settings (key, value) values
  ('msg_shop', 'Thank you! Your order has been processed securely. Your items will be processed and shipped shortly.'),
  ('msg_spectator', 'Thank you! Your order has been processed securely. Your spectator passes will be activated shortly.'),
  ('msg_combined', 'Thank you! Your order has been processed securely. Your items will be shipped shortly and your spectator passes will be activated shortly.'),
  ('msg_record', 'Thank you! Your order has been processed securely. Our adjudication team will get back to you with the results using the email you provided.'),
  ('msg_challenge', 'Thank you! Your challenge registration fee has been securely processed. Prepare to compete and claim your record!'),
  ('ai_min_confidence_threshold', '80.00'),
  ('ai_deepfake_check_enabled', 'true'),
  ('ai_video_tampering_check_enabled', 'true'),
  ('ai_audio_tampering_check_enabled', 'true')
on conflict (key) do nothing;

insert into points_rules (rule_name, points_value, description) values
  ('verified_record', 100, 'Verified Record Approved'),
  ('world_record', 250, 'New World Record Holder'),
  ('top_10_placement', 150, 'Top 10 Leaderboard Placement'),
  ('first_place_category', 300, 'First Place in Category'),
  ('featured_record', 200, 'Featured Record'),
  ('live_event_winner', 500, 'Live Event Winner'),
  ('challenge_participation', 25, 'Challenge Participation'),
  ('appeal_win', 100, 'Appeal Win / Record Reinstated'),
  ('medal_earned', 150, 'Medal Earned'),
  ('certificate_earned', 75, 'Certificate Earned')
on conflict (rule_name) do nothing;

insert into categories (name, slug, order_num, is_default) values
  ('Strength', 'strength', 1, true),
  ('Speed', 'speed', 2, true),
  ('Endurance', 'endurance', 3, true),
  ('Balance', 'balance', 4, true),
  ('Flexibility', 'flexibility', 5, true),
  ('Fitness', 'fitness', 6, true),
  ('Sports', 'sports', 7, true),
  ('Gaming', 'gaming', 8, true),
  ('Entertainment', 'entertainment', 9, true),
  ('Creative Skills', 'creative-skills', 10, true),
  ('Stunts', 'stunts', 11, true),
  ('Food Challenges', 'food-challenges', 12, true),
  ('Animal Records', 'animal-records', 13, true),
  ('Team Records', 'team-records', 14, true),
  ('Kids / Youth Records', 'kids--youth-records', 15, true),
  ('Senior Records', 'senior-records', 16, true),
  ('Extreme Challenges', 'extreme-challenges', 17, true),
  ('Precision Skills', 'precision-skills', 18, true),
  ('Technology / Innovation', 'technology--innovation', 19, true),
  ('Miscellaneous', 'miscellaneous', 20, true)
on conflict (name) do nothing;

insert into age_groups (name, min_age, max_age, description, is_default) values
  ('Junior Champions', 5, 12, 'Ages 5–12', true),
  ('Teen Legends', 13, 17, 'Ages 13–17', true),
  ('Adult Division', 18, 49, 'Ages 18–49', true),
  ('Masters Division', 50, 200, 'Ages 50+', true)
on conflict (name) do nothing;

insert into countries (code, name, flag) values
  ('USA', 'United States', '🇺🇸'),
  ('CAN', 'Canada', '🇨🇦'),
  ('GBR', 'United Kingdom', '🇬🇧'),
  ('AUS', 'Australia', '🇦🇺'),
  ('GER', 'Germany', '🇩🇪')
on conflict (code) do nothing;

-- =====================================================================================
-- AFTER RUNNING: create your admin account
--   1. Sign up on the website with your email.
--   2. Run (replace the email):
--      update users set is_admin = true, role = 'system_admin' where lower(email) = lower('you@example.com');
-- =====================================================================================

-- After this file, run the migrations in database/migrations/ in date order
-- (2026-11-09_client_corrections.sql adds plans, coupons limits, certificates, weight classes, belt approvals).
