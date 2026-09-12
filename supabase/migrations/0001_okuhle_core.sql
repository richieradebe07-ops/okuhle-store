-- OKUHLE core schema: orders, memberships, rewards, consent records.
--
-- Design notes:
--  * Money is stored in CENTS as integers. Never floats — 0.1 + 0.2 problems
--    with real money are unacceptable, and the PayFast ITN compares amounts.
--  * Row Level Security is ON for every table with a default-deny posture. The
--    site's server routes use the service-role key and bypass RLS deliberately;
--    the anon key can only ever read a customer's OWN rows.
--  * Order and membership writes are server-only. A browser must never be able
--    to insert an order or mark one paid.

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create type order_status as enum ('pending', 'paid', 'failed', 'cancelled');

create table orders (
  id            text primary key,          -- our own reference, e.g. OK-XXXX-YYYY
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  status        order_status not null default 'pending',

  -- What we expect PayFast to charge. The ITN is verified against this.
  amount_cents  integer not null check (amount_cents > 0),

  product_id    text not null,
  product_name  text not null,
  colour        text not null,
  size          text not null,

  -- Null for guest checkout; set when the buyer has an account.
  user_id       uuid references auth.users (id) on delete set null,
  buyer_email   text,
  buyer_name    text,
  buyer_phone   text,
  delivery_address text,

  -- Delivery charged on this order, so the full landed cost is recorded.
  delivery_cents integer not null default 0 check (delivery_cents >= 0),

  -- PayFast's own reference, recorded when the ITN confirms payment.
  pf_payment_id text,
  paid_at       timestamptz,

  -- Points awarded for this order. Set once, on payment confirmation.
  points_awarded integer not null default 0 check (points_awarded >= 0)
);

create index orders_user_idx on orders (user_id);
create index orders_status_idx on orders (status);
create index orders_created_idx on orders (created_at desc);
-- One order per PayFast payment: makes duplicate ITN delivery harmless.
create unique index orders_pf_payment_idx on orders (pf_payment_id)
  where pf_payment_id is not null;

-- ---------------------------------------------------------------------------
-- Memberships — Okuhle+, R299 for the year. Not a subscription.
-- ---------------------------------------------------------------------------

create type membership_status as enum ('active', 'expired');

-- Member numbers are sequential, permanent and NEVER reused, including after
-- expiry. A sequence guarantees that even under concurrent signups.
create sequence member_number_seq start 1;

create table memberships (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  member_number  integer not null default nextval('member_number_seq') unique,
  status         membership_status not null default 'active',

  purchased_at   timestamptz not null default now(),
  expires_at     timestamptz not null,
  price_paid_cents integer not null check (price_paid_cents > 0),
  -- Renewing members keep the price they joined at when the price rises.
  price_locked   boolean not null default true,

  -- Welcome pack ships WITH their first order, not separately.
  welcome_pack_sent boolean not null default false,
  renewal_reminder_sent_at timestamptz,

  -- The order that paid for this membership.
  order_id       text references orders (id) on delete set null,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint expires_after_purchase check (expires_at > purchased_at)
);

-- A user may renew repeatedly, but can only hold ONE active membership.
create unique index memberships_one_active_per_user
  on memberships (user_id) where status = 'active';
create index memberships_expiry_idx on memberships (expires_at)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Rewards — free loyalty, 1 point per R100, 10 points = R100 off
-- ---------------------------------------------------------------------------

create table reward_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- Positive when earned, negative when redeemed.
  points      integer not null check (points <> 0),
  reason      text not null,
  order_id    text references orders (id) on delete set null
);

create index reward_events_user_idx on reward_events (user_id, created_at desc);
-- Points are only ever awarded once per order.
create unique index reward_events_order_earn_idx on reward_events (order_id)
  where order_id is not null and points > 0;

-- Balance is derived from the event log rather than stored, so it can never
-- drift out of step with the transactions that produced it.
create view reward_balances with (security_invoker = on) as
  select user_id, coalesce(sum(points), 0)::integer as balance
  from reward_events
  group by user_id;

-- ---------------------------------------------------------------------------
-- Consent records — POPIA. Proof of consent is the point.
-- ---------------------------------------------------------------------------

create table consent_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete cascade,
  email        text not null,
  created_at   timestamptz not null default now(),

  -- What they agreed to, and which version of the text.
  kind         text not null check (kind in ('terms', 'privacy', 'marketing')),
  granted      boolean not null,
  document_version text,
  -- Where the consent came from: 'signup', 'newsletter_form', 'whatsapp', etc.
  source       text not null,
  ip_address   inet
);

create index consent_records_email_idx on consent_records (email, kind, created_at desc);
create index consent_records_user_idx on consent_records (user_id);

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger memberships_updated_at before update on memberships
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — default deny, then allow only own-row reads
-- ---------------------------------------------------------------------------

alter table orders enable row level security;
alter table memberships enable row level security;
alter table reward_events enable row level security;
alter table consent_records enable row level security;

-- Customers may read their own records. Nothing more: no inserts, no updates.
-- All writes go through server routes holding the service-role key, which
-- bypasses RLS. This is what stops a browser marking its own order as paid.

create policy "own orders are readable"
  on orders for select
  using (auth.uid() is not null and user_id = auth.uid());

create policy "own membership is readable"
  on memberships for select
  using (auth.uid() is not null and user_id = auth.uid());

create policy "own reward events are readable"
  on reward_events for select
  using (auth.uid() is not null and user_id = auth.uid());

create policy "own consent records are readable"
  on consent_records for select
  using (auth.uid() is not null and user_id = auth.uid());

-- The reward_balances view is declared security_invoker above, so it runs with
-- the querying role's privileges and inherits reward_events' RLS — a customer
-- sees only their own balance.

comment on table orders is 'Customer orders. Written server-side only; the ITN verifies amount_cents.';
comment on table memberships is 'Okuhle+ annual memberships. member_number is permanent and never reused.';
comment on table reward_events is 'Append-only points ledger. Balance is derived, never stored.';
comment on table consent_records is 'POPIA consent audit trail. Never delete rows from this table.';
