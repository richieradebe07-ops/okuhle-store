-- Reviews move from "nothing publishes until a person approves it" to
-- "published immediately unless an automated filter catches something."
--
-- The filter FLAGS, it does not reject: a flagged row is written exactly
-- like before — status defaults to 'pending', invisible to the public — but
-- now carries *why* it was held, so the owner's queue shows a reason instead
-- of a pile of undifferentiated submissions.
--
-- `hidden` is the new, separate concept: a soft-delete the owner can apply to
-- ANY review, at any point in its life — a flagged one they decide to pull
-- rather than publish, or a review that was live for weeks before it needed
-- removing. `status` still records whether a row ever reached 'published';
-- `hidden` records whether it is suppressed right now. Keeping both means the
-- history survives a later removal, which is the same reasoning migration
-- 0003 already applied to 'rejected' — nothing here hard-deletes a row.

alter table reviews
  add column flagged boolean not null default false,
  add column flagged_reason text,
  add column hidden boolean not null default false,
  add column hidden_reason text,
  add column hidden_by text,
  add column hidden_at timestamptz;

comment on column reviews.flagged is 'Set by the automated filter in lib/reviewFilter.ts at submission time. True means it is held back from publishing until an owner looks at it in the flagged queue.';
comment on column reviews.flagged_reason is 'Why the filter caught it (contains a link, profanity match, duplicate content, etc). Owner-only — never shown publicly.';
comment on column reviews.hidden is 'Soft delete, settable on any review regardless of status — a flagged one the owner chose to remove rather than publish, or a live one pulled later. Never shown publicly when true. Rows are never hard-deleted so a disputed removal has a record.';
comment on column reviews.hidden_reason is 'Owner''s free-text reason for removing it. Never shown publicly.';
comment on column reviews.hidden_by is 'The owner''s email at the time of removal. Text, not a foreign key — there is one owner, identified by OWNER_EMAIL, not a database role.';
comment on column reviews.hidden_at is 'When it was removed.';

-- The public queries now add "and not flagged and not hidden" to their status
-- filter. This index keeps that combination on the fast path instead of
-- falling back to the (status, created_at) index and filtering the rest in
-- memory.
create index reviews_visible_idx on reviews (product_id, created_at desc)
  where status = 'published' and not flagged and not hidden;

-- "One review per product per email/order-reference" (Part C). Migration
-- 0003 already stops a verified purchase being reviewed twice via the
-- (order_id, product_id) index below, but that index is scoped to
-- order_id is not null — an unverified reviewer, who has no order_id, could
-- previously post the same product five times over. This closes that gap for
-- anyone who gave an email; a reviewer who gives neither an order number nor
-- an email has nothing left to key on, and is caught by rate limiting
-- instead — the same honest limit the rest of this filter accepts.
create unique index reviews_one_per_email_product on reviews (email, product_id)
  where order_id is null and email is not null;
