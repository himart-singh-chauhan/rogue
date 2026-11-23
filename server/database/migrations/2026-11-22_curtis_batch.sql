-- AMPEX: Curtis's Nov 22 list. Safe to run more than once.

-- ---------------------------------------------------------------------------------
-- 1. Live events: a finished event is listed in the public Past events only after an admin approves it
-- ---------------------------------------------------------------------------------
alter table events add column if not exists replay_approved boolean not null default false;

-- ---------------------------------------------------------------------------------
-- 2. Sign-up: terms and age confirmation, parent/guardian approval for members under 18, password reset
-- ---------------------------------------------------------------------------------
alter table users add column if not exists terms_accepted_at timestamptz;
alter table users add column if not exists age_confirmed_at timestamptz;
alter table users add column if not exists guardian_name text;
alter table users add column if not exists guardian_relationship text;
alter table users add column if not exists guardian_email text;
alter table users add column if not exists guardian_verified_at timestamptz;
alter table users add column if not exists guardian_email_sent_at timestamptz;
alter table users add column if not exists password_reset_sent_at timestamptz;
alter table users add column if not exists password_changed_at timestamptz;

-- ---------------------------------------------------------------------------------
-- 3. Sponsors: a placement on every main page (Explore Records, each record, Rankings, Challenge, member profiles)
-- ---------------------------------------------------------------------------------
alter table sponsors drop constraint if exists sponsors_placement_check;
alter table sponsors add constraint sponsors_placement_check check (placement in (
  'homepage', 'livestream', 'shop', 'footer', 'homepage_top_banner', 'homepage_sidebar', 'live_event', 'featured',
  'footer_sponsor', 'video_overlay', 'records', 'record_page', 'rankings', 'challenges', 'profiles'));

-- ---------------------------------------------------------------------------------
-- 4. Try These Records: record ideas waiting for their first official holder
-- ---------------------------------------------------------------------------------
create table if not exists open_records (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  category text,
  subcategory text,
  description text,
  rules text,
  measurement text not null default 'other' check (measurement in ('time', 'weight', 'repetitions', 'distance', 'score', 'other')),
  measurement_unit text,
  evidence text,
  divisions text[] not null default '{}',
  eligibility text not null default 'Worldwide',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard', 'extreme')),
  safety text,
  points integer not null default 0 check (points >= 0),
  deadline timestamptz,
  status text not null default 'draft' check (status in ('draft', 'open', 'paused', 'set', 'removed')),
  record_id uuid references records(id) on delete set null,
  set_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists open_records_status_idx on open_records (status, created_at desc);
alter table open_records enable row level security;

-- each submission can be an attempt at an open record
alter table records add column if not exists open_record_id uuid references open_records(id) on delete set null;
create index if not exists records_open_record_idx on records (open_record_id) where open_record_id is not null;
