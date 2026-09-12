-- Auth-related schema corrections.
--
-- Applied after accounts landed, and driven by one question: what should
-- survive a customer deleting their account?

-- ---------------------------------------------------------------------------
-- 1. Consent records must outlive the account
-- ---------------------------------------------------------------------------
-- They were originally `on delete cascade`, which contradicts the table's own
-- rule that rows are never deleted. If someone deletes their account and later
-- complains they were marketed to without permission, the record of what they
-- did or did not agree to is exactly the thing we need to still have.
--
-- The user_id is nulled (it points at a row that no longer exists) while the
-- email, the kind, the document version and the timestamp remain.

alter table consent_records
  drop constraint if exists consent_records_user_id_fkey;

alter table consent_records
  add constraint consent_records_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. Withdrawal is a consent event, not a deletion
-- ---------------------------------------------------------------------------
-- POPIA s69(3)(b) gives a data subject the right to object at any time. The
-- way that is recorded here is a NEW row with granted = false, so the history
-- reads forwards: granted on this date, withdrawn on that one.
comment on column consent_records.granted is
  'True when consent was given, false when it was withdrawn. Withdrawal is a new row, never an update.';

-- ---------------------------------------------------------------------------
-- 3. Names, so emails can be addressed to a person
-- ---------------------------------------------------------------------------
-- Supabase keeps user metadata in auth.users, which the anon key cannot read.
-- Rather than mirror a profiles table for one field, the first name is stored
-- in user_metadata and read through the auth API. Nothing to add here — this
-- comment exists so the absence of a `profiles` table is a decision on the
-- record rather than an oversight.
