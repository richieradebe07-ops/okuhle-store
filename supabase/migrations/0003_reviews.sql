-- Reviews and comments.
--
-- Two kinds of entry share one table, distinguished by product_id:
--   * product_id set  → a review OF a piece, and it must carry a rating
--   * product_id null → a comment about the brand, rating optional
--
-- Three decisions worth knowing:
--
--  1. NOTHING PUBLISHES ITSELF. Every row lands as 'pending' and a person
--     approves it. A storefront is not the place to discover what a stranger
--     typed. The site says so plainly rather than implying reviews appear
--     instantly.
--
--  2. verified_purchase IS DERIVED, NEVER SUBMITTED. It is set server-side
--     only after matching a PAID order, so it cannot be claimed by anyone
--     posting whatever they like to the API.
--
--  3. THERE IS NO PUBLIC READ POLICY, on purpose. Row Level Security is
--     row-level, not column-level: a policy allowing anon to read published
--     reviews would also let anon select the email and ip_address columns off
--     those same rows. Reviews are therefore read server-side with an explicit
--     column list. The only policy here lets an author see their own review,
--     including while it is still pending.

create type review_status as enum ('pending', 'published', 'rejected');

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  status        review_status not null default 'pending',

  -- Null means a comment about the brand rather than about one piece.
  product_id    text,

  rating        integer check (rating between 1 and 5),
  body          text not null check (length(btrim(body)) >= 10),

  -- What the public sees. The email is for verification and replying, and is
  -- never rendered on the site.
  display_name  text not null check (length(btrim(display_name)) between 2 and 60),
  email         text,
  user_id       uuid references auth.users (id) on delete set null,

  -- Proof of purchase, when there is any.
  order_id      text references orders (id) on delete set null,
  verified_purchase boolean not null default false,

  published_at  timestamptz,
  -- Why it was rejected, for the owner's own reference. Never shown publicly.
  moderator_note text,
  ip_address    inet,

  -- A review of a piece has to rate it; a general comment need not.
  constraint product_reviews_are_rated check (product_id is null or rating is not null)
);

create index reviews_product_idx on reviews (product_id, created_at desc)
  where status = 'published';
create index reviews_status_idx on reviews (status, created_at desc);
create index reviews_user_idx on reviews (user_id);

-- One review per order per piece, so a single purchase cannot be used to
-- stack up repeat praise.
create unique index reviews_one_per_order_product on reviews (order_id, product_id)
  where order_id is not null;

create trigger reviews_updated_at before update on reviews
  for each row execute function set_updated_at();

alter table reviews enable row level security;

-- Authors may read their own, pending ones included, so "thanks, it's with us"
-- can show them what they actually wrote. Everything else — public listings,
-- moderation, writes — goes through the server with the service-role key.
create policy "own reviews are readable"
  on reviews for select
  using (auth.uid() is not null and user_id = auth.uid());

comment on table reviews is 'Reviews and comments. Nothing is public until a person approves it; verified_purchase is derived server-side from a paid order and is never accepted from the client.';
comment on column reviews.verified_purchase is 'Set server-side only, after matching a paid order. Never trust a client-supplied value.';
comment on column reviews.email is 'For verification and replies. Never rendered publicly — see the note about column-level exposure in this migration.';
