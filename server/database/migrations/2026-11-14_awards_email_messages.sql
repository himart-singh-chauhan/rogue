-- AMPEX: achievement awards, member email (history + marketing opt-out), member-to-member messages (Nov 2026).
-- Safe to run more than once.

-- ---------------------------------------------------------------------------------
-- 1. Achievement awards (separate from World Record certificates)
-- ---------------------------------------------------------------------------------
create table if not exists achievement_awards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default '🏆',                 -- emoji shown on the award when there is no image
  image_url text,                                   -- optional badge / artwork image
  background_url text,                              -- optional uploaded award design (full page)
  orientation text not null default 'landscape' check (orientation in ('landscape', 'portrait')),
  color text not null default '#FF6A00',
  signer1_name text default 'Curtis Freeman',
  signer1_title text default 'President / CEO',
  signer1_signature_url text default '/certificates/signature-curtis-freeman.png',
  signer2_name text default 'Stephen Pelham',
  signer2_title text default 'Verified By',
  signer2_signature_url text default '/certificates/signature-stephen-pelham.png',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists member_awards (
  id uuid primary key default gen_random_uuid(),
  award_id uuid not null references achievement_awards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  award_number text not null unique,
  recipient_name text,                              -- name printed on the award (defaults to the member's name)
  award_date date not null default current_date,
  title_override text,
  description_override text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists member_awards_user_idx on member_awards (user_id, created_at desc);
create index if not exists member_awards_award_idx on member_awards (award_id);

alter table achievement_awards enable row level security;
alter table member_awards enable row level security;

-- ---------------------------------------------------------------------------------
-- 2. Email to members: sending history and marketing opt-out
-- ---------------------------------------------------------------------------------
alter table users add column if not exists marketing_opt_out boolean not null default false;
alter table users add column if not exists marketing_opt_out_at timestamptz;

create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  image_url text,
  button_text text,
  button_url text,
  kind text not null default 'account' check (kind in ('account', 'marketing')),
  audience jsonb not null default '{}'::jsonb,       -- { type: 'member' | 'selected' | 'group' | 'all', ... }
  audience_label text,
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  skipped_count integer not null default 0,         -- members who opted out of marketing email
  status text not null default 'sending' check (status in ('sending', 'sent', 'partial', 'failed')),
  request_key text unique,                          -- stops the same send being created twice (double click)
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists email_campaigns_created_idx on email_campaigns (created_at desc);

create table if not exists email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references email_campaigns(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  email text not null,
  name text,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  error text,
  claimed_at timestamptz,                           -- when a send request picked it up
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_deliveries_campaign_idx on email_deliveries (campaign_id, status);
create index if not exists email_deliveries_user_idx on email_deliveries (user_id, created_at desc);

alter table email_campaigns enable row level security;
alter table email_deliveries enable row level security;

-- ---------------------------------------------------------------------------------
-- 3. Members can message each other (challenge call-outs): sent box + optional record link
-- ---------------------------------------------------------------------------------
alter table messages add column if not exists record_id uuid references records(id) on delete set null;
alter table messages add column if not exists is_member_message boolean not null default false;
create index if not exists messages_sender_idx on messages (sender_id, created_at desc);
create index if not exists messages_receiver_idx on messages (receiver_id, created_at desc);
