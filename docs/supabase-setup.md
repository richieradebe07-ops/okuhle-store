# Supabase setup

The database is **already created and migrated**. One env var stands between this and
live checkout.

| | |
|---|---|
| Project | `okuhle-store` |
| Ref | `jxlybljgrbszfrvwlcep` |
| Region | `eu-west-1` |
| URL | `https://jxlybljgrbszfrvwlcep.supabase.co` |
| Cost | R0/month (free tier) |
| Security advisors | 0 findings |

---

## ⚠️ Why a new project

Your existing Supabase project (`xxapsvduuufenrasxoou`) belongs to a different app — it
has an `akc_enquiries` table with a live row and 5 prior migrations. Okuhle's payment and
personal data does not go in there: it keeps the POPIA retention story clean, avoids
interleaved migration histories, and means pausing or deleting one app can't take the
other with it.

**That project was left exactly as found.** An earlier migration attempt against it
reported success but wrote nothing — it ran while the project was still `COMING_UP`.
Verified afterwards: none of Okuhle's tables, types or sequences exist there.

---

## The one thing left to do

Copy the **service role key** from
Supabase → Project Settings → API keys → `service_role`, into:

- `.env.local` for local development
- Netlify → Site settings → Environment variables for production

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**This key bypasses RLS completely.** It is the only thing allowed to write orders. It
must never reach the browser, never be committed, and if it ever lands in a commit it
must be **rotated** in the dashboard — deleting the line is not enough, git keeps history.

Setting it is what flips production checkout on:

```
without it → hasDurableOrderStore() = false → /api/checkout returns 503 in production
with it    → hasDurableOrderStore() = true  → checkout live
```

The URL and anon key are already in `.env.example`. The anon key is **designed** to be
public — it ships in the browser bundle. RLS is what protects the data.

---

## Schema

`supabase/migrations/0001_okuhle_core.sql` — matches what is applied.

| Table | Purpose |
|---|---|
| `orders` | Orders. `amount_cents` is what the PayFast ITN is verified against. |
| `memberships` | Okuhle+ annual memberships, permanent member numbers. |
| `reward_events` | Append-only points ledger. |
| `consent_records` | POPIA consent audit trail. |
| `reward_balances` | View. Balance derived from the ledger, never stored. |

Decisions worth knowing:

- **Money is integer cents.** Floats and money don't mix, and the ITN compares amounts.
- **Balances are derived, not stored** — a stored balance can drift from the transactions
  that produced it.
- **`member_number` comes from a sequence**, so it's sequential, permanent and never
  reused even under concurrent signups.
- **`pf_payment_id` is uniquely indexed**, so a duplicate PayFast payment cannot create a
  second order.
- **One active membership per user**, enforced by a partial unique index rather than
  application code.
- **`consent_records` is append-only by convention.** Never delete from it — the audit
  trail is the point.

---

## Security model, and what was actually verified

Every table has RLS on with exactly one `select` policy: a signed-in customer may read
**their own** rows. There are no insert, update or delete policies at all. All writes go
through server routes holding the service-role key, which bypasses RLS.

Verified against the live database, not assumed:

| Test | Result |
|---|---|
| `service_role` sees an inserted order | ✅ 1 row |
| `anon` reads orders | ✅ 0 rows |
| `anon` reads memberships / consent records | ✅ 0 rows |
| `anon` inserts a R1 "free hoodie" order | ✅ blocked, no row created |
| `anon` marks an existing order `paid` | ✅ blocked, still `pending` |
| Supabase security advisors | ✅ 0 findings |

Test rows were deleted afterwards; the table is empty.

**Not verified from here:** the app's own REST calls. This sandbox's egress policy blocks
`*.supabase.co`, so the SQL layer was tested via the Supabase API while the HTTP layer
was not. Close that gap by running, locally, once the service key is set:

```bash
node scripts/verify-supabase.mjs
```

It creates a throwaway order, reads it back, marks it paid, confirms a duplicate ITN
updates 0 rows, proves the anon key can't read or write it, checks the `pf_payment_id`
uniqueness constraint, then deletes everything. Eight checks, no residue.

---

## What this unblocks

- **Live PayFast checkout** — orders now survive between the checkout request and the ITN
  arriving, which is what the amount check depends on
- Real order records for the owner dashboard
- Member numbering, once accounts exist
- Loyalty points against real orders
- The renewal reminder job

## Built on top since

- **Supabase Auth** — signup, login, password reset, the `/account` area, and the POPIA
  data-subject rights. See `docs/auth-setup.md`.
- **Points on payment confirmation** — awarded from the ITN, once per order, enforced by
  `reward_events_order_earn_idx` rather than application code.
- **Migration 0002** — `consent_records.user_id` is now `on delete set null`, so the consent
  audit trail outlives a deleted account instead of cascading away with it.

## Still to build on top

- Membership creation from a confirmed R299 payment
- Points redemption at checkout (`redeemPoints()` exists; nothing spends them yet)
- Renewal reminder job (needs a scheduler; `memberships_expiry_idx` supports the query)
- Admin order view

## Free tier note

Free Supabase projects **pause after about a week of inactivity** and need restoring from
the dashboard. That is exactly what had happened to the old project. Worth knowing before
Black Friday — if the site goes quiet for a week beforehand, check the project is awake.
