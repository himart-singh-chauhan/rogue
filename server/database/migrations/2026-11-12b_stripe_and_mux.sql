-- Stripe payments + Mux live streams. Safe to run more than once.

-- Every Stripe Checkout (shop order, membership, submission/challenge fee, subscription renewal)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('shop', 'membership', 'submission')),
  reference_id text not null,                 -- order id / membership id / record id
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_invoice_id text,
  amount numeric(10, 2) not null default 0,
  amount_refunded numeric(10, 2) not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded')),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists payments_session_uidx on public.payments (stripe_session_id) where stripe_session_id is not null;
create unique index if not exists payments_invoice_uidx on public.payments (stripe_invoice_id) where stripe_invoice_id is not null;
create index if not exists payments_intent_idx on public.payments (stripe_payment_intent_id);
create index if not exists payments_reference_idx on public.payments (kind, reference_id);
create index if not exists payments_user_idx on public.payments (user_id);
alter table public.payments enable row level security;

-- Stripe webhook events already handled (Stripe can send the same event more than once)
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

alter table public.users add column if not exists stripe_customer_id text;

alter table public.memberships add column if not exists stripe_subscription_id text;
alter table public.memberships add column if not exists stripe_customer_id text;
create index if not exists memberships_stripe_sub_idx on public.memberships (stripe_subscription_id);

-- Tickets bought in the shop: which event a line is for, and which order a ticket came from
alter table public.order_items add column if not exists event_id uuid references public.events(id) on delete set null;
alter table public.tickets add column if not exists order_id uuid references public.orders(id) on delete set null;
create index if not exists tickets_order_idx on public.tickets (order_id);

-- Mux live stream per event (the stream key is only ever shown to admins)
alter table public.events add column if not exists mux_live_stream_id text;
alter table public.events add column if not exists mux_playback_id text;
alter table public.events add column if not exists mux_stream_key text;
alter table public.events add column if not exists mux_status text;
alter table public.events add column if not exists mux_recording_playback_id text;
create index if not exists events_mux_stream_idx on public.events (mux_live_stream_id);
