-- AMPEX: shop color choices and extra submission packs (Curtis's requests, Nov 17 2026). Safe to run more than once.

-- ---------------------------------------------------------------------------------
-- 1. Product colors: [{ "name": "Pink", "hex": "#ec4899", "image_url": "https://…", "enabled": true }, …]
--    (order_items.color already exists and stores the color the buyer chose)
-- ---------------------------------------------------------------------------------
alter table products add column if not exists colors jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------------
-- 2. Extra submission packs: credits a member bought, used once their plan's monthly submissions run out
-- ---------------------------------------------------------------------------------
alter table users add column if not exists extra_submissions integer not null default 0;
alter table users drop constraint if exists users_extra_submissions_check;
alter table users add constraint users_extra_submissions_check check (extra_submissions >= 0);

-- every change to a member's credits (bought, used, given back, set by an admin)
create table if not exists submission_credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  change integer not null,
  reason text not null check (reason in ('purchase', 'used', 'refund', 'admin')),
  reference_id text,                 -- payment id or record id
  note text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists submission_credit_events_user_idx on submission_credit_events (user_id, created_at desc);
-- a payment adds its credits only once
create unique index if not exists submission_credit_events_purchase_once on submission_credit_events (reference_id) where reason = 'purchase';
alter table submission_credit_events enable row level security;

-- packs are paid through Stripe like everything else: allow the 'pack' payment kind
alter table payments drop constraint if exists payments_kind_check;
alter table payments add constraint payments_kind_check check (kind in ('shop', 'membership', 'submission', 'pack'));

-- add or take credits in one step, never below zero; returns the new balance (null = not enough credits)
create or replace function change_extra_submissions(p_user uuid, p_change integer) returns integer language plpgsql as $$
declare v integer;
begin
  update users set extra_submissions = extra_submissions + p_change
   where id = p_user and extra_submissions + p_change >= 0
  returning extra_submissions into v;
  return v;
end $$;
