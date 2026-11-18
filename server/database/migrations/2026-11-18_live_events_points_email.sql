-- AMPEX: live event controls and chat, configurable points + spending points in the shop, emails to people
-- outside the community, sponsor commercials (Curtis's Nov 18 list). Safe to run more than once.

-- ---------------------------------------------------------------------------------
-- 1. Live events: admin start / stop, live chat on or off, replays, 24-hour replay for paid events
-- ---------------------------------------------------------------------------------
alter table events add column if not exists chat_enabled boolean not null default true;
alter table events add column if not exists replay_enabled boolean not null default true;
alter table events add column if not exists started_at timestamptz;
alter table events add column if not exists ended_at timestamptz;

create table if not exists event_chat_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  name text not null,
  body text not null check (char_length(body) between 1 and 300),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists event_chat_messages_event_idx on event_chat_messages (event_id, created_at desc);
alter table event_chat_messages enable row level security;

-- ---------------------------------------------------------------------------------
-- 2. Points: new ways to earn (record verified, challenge won) and spending points in the shop
-- ---------------------------------------------------------------------------------
alter table reward_transactions drop constraint if exists reward_transactions_type_check;
alter table reward_transactions add constraint reward_transactions_type_check check (type in (
  'referral', 'referral_reversal', 'purchase', 'purchase_reversal', 'manual', 'promotion', 'fraud_adjustment',
  'submission', 'submission_reversal', 'challenge_win', 'challenge_win_reversal', 'redemption', 'redemption_reversal'));
-- each automatic award once per record / order
drop index if exists reward_transactions_once;
create unique index if not exists reward_transactions_once
  on reward_transactions (user_id, type, reference_id)
  where reference_id is not null and type in ('referral', 'referral_reversal', 'purchase', 'purchase_reversal',
    'submission', 'submission_reversal', 'challenge_win', 'challenge_win_reversal', 'redemption', 'redemption_reversal');

alter table orders add column if not exists points_redeemed integer not null default 0;
alter table orders add column if not exists points_discount numeric(10, 2) not null default 0;

-- ---------------------------------------------------------------------------------
-- 3. Email to people outside the community: their unsubscribes (members use users.marketing_opt_out)
-- ---------------------------------------------------------------------------------
create table if not exists email_suppressions (
  email text primary key,
  reason text not null default 'unsubscribed',
  created_at timestamptz not null default now()
);
alter table email_suppressions enable row level security;

-- ---------------------------------------------------------------------------------
-- 4. Sponsors: what the homepage sponsor spot shows (banner image, or a commercial / sponsor video)
-- ---------------------------------------------------------------------------------
alter table sponsors add column if not exists content_type text not null default 'banner';
alter table sponsors drop constraint if exists sponsors_content_type_check;
alter table sponsors add constraint sponsors_content_type_check check (content_type in ('banner', 'video', 'both'));
update sponsors set content_type = 'both' where content_type = 'banner' and video_url is not null and banner_url is not null;
update sponsors set content_type = 'video' where content_type = 'banner' and video_url is not null and banner_url is null;
