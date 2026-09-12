# Accounts and auth

Signup, login, password reset and the `/account` area, on Supabase Auth.

| | |
|---|---|
| Provider | Supabase Auth (GoTrue), over REST — no `@supabase/supabase-js` dependency |
| Session | Two `httpOnly` cookies, refreshed by `middleware.ts` |
| Email | **Resend**, using the templates in `lib/emails.ts` — not Supabase's mailer |
| Migration | `supabase/migrations/0002_auth_and_consent.sql` — **applied and verified** |

---

## What the owner still has to do

Three dashboard settings. Signup will fail with a confusing error until the
redirect URLs are allowed, so do that one first.

### 1. Allow the redirect URLs

Supabase → Authentication → URL Configuration:

- **Site URL**: `https://ohyokuhle.co.za` (or the Netlify URL until DNS points at it)
- **Redirect URLs** — add all of these:
  ```
  http://localhost:3000/login
  http://localhost:3000/reset-password
  https://<your-site>/login
  https://<your-site>/reset-password
  ```

Supabase refuses to redirect anywhere not on that list. That is a feature: it
stops someone crafting a confirmation link that hands the new session to their
own server.

### 2. Leave "Confirm email" ON

Authentication → Sign In / Providers → Email → **Confirm email: on**.

With it off, anyone could sign up as anyone — including as you — and the
address would never be checked. The confirmation email goes out through
Resend, so Supabase's own 2-emails-per-hour default sender is not in the path.

### 3. Set `SUPABASE_SERVICE_ROLE_KEY`

Already required for orders; auth needs it too. Signup and password reset use
the admin API, so without it both return 503 with an honest message pointing
people at WhatsApp. Login, refresh and the account pages work on the anon key
alone.

---

## Why the admin API instead of the normal signup endpoint

Supabase's public `/auth/v1/signup` and `/auth/v1/recover` endpoints send their
own email. On the default shared sender that is capped at a couple of messages
an hour — enough to break signups on the first busy day, and not obviously.

`admin/generate_link` creates the user (or the recovery token) and returns the
link **without sending anything**. The email then goes out through Resend, so:

- one sender, one verified domain, one set of copy
- one place to look when something doesn't arrive
- the 100/day Resend cap is the only cap, and it is monitored (`lib/email.ts`)
- `sendPasswordReset` and `sendEmailVerification` live with every other email

The cost is that signup and reset need the service-role key.

---

## The session

Two cookies, both `httpOnly`, `secure` in production, `sameSite=lax`:

| Cookie | Holds | Lifetime |
|---|---|---|
| `okuhle_at` | access token | 1 hour (Supabase's default) |
| `okuhle_rt` | refresh token | 30 days |
| `okuhle_signedin` | nothing | 30 days |

`okuhle_signedin` is readable by JavaScript and **grants nothing**. It exists
so a first-time visitor on a static marketing page doesn't trigger a pointless
`/api/me` round trip to be told they aren't logged in. `/api/me` reads the real
`httpOnly` cookie, so forging the hint gets an anonymous answer.

**Refresh tokens rotate.** Every exchange invalidates the old one, so storing
the new token is not optional — miss it and every session dies exactly an hour
after it starts. `middleware.ts` writes the new pair onto both the response
(so the browser keeps it) and the incoming request (so the page rendering right
now sees the fresh token). That is the bug that file exists to not have.

Server components can read cookies but cannot set them, which is why the
refresh happens in middleware rather than in `currentSession()`.

### Who the user is

`currentSession()` asks Supabase (`GET /auth/v1/user`) rather than decoding the
JWT locally. Decoding tells you what a token *claims*; it does not tell you
whether the token is genuine, unexpired or un-revoked. React's `cache()`
collapses the repeat calls within a single request. `accessTokenExpiry()` does
decode without verifying — but only ever to decide *whether to refresh*, never
to decide who someone is.

---

## POPIA: consent at signup

The signup form has **two separate checkboxes, both unticked**:

| Box | Required? | Recorded as |
|---|---|---|
| Terms & Privacy Policy | Yes — gates the account | two rows: `terms` and `privacy`, each with its document version |
| Marketing email | **No** — the account is created either way | one `marketing` row, `granted` true **or false** |

Three things are deliberate:

1. **The marketing box is not wired to the submit guard at all.** The check
   looks only at `acceptedTerms`. There is no code path where leaving marketing
   alone blocks an account.
2. **A declined marketing consent is still written**, with `granted = false`.
   A row saying "no" is what proves the box wasn't pre-ticked; an absent row
   proves nothing.
3. **`ConsentCheckbox` does not accept a `defaultChecked` prop.** The cheapest
   way to stop someone pre-ticking one by accident in six months' time.

Every row carries the document version, the source (`signup`,
`account_settings`, `account_deletion`, `newsletter_form`) and the IP address.

Withdrawal appends a new row rather than editing the old one, so the history
reads forwards: granted on this date, withdrawn on that one.

---

## Data subject rights, and where each one lives

POPIA Chapter 3 gives people specific rights. Burying any of them behind
"email us" is how they become theoretical.

| Right | Where | How |
|---|---|---|
| Access (s23) | `/account/settings` → Download my data | `GET /api/account/export` — JSON, immediate, no request form |
| Correction (s24) | `/account/settings` | WhatsApp or the Information Officer, and it says why: a name on an order that already shipped needs a person |
| Deletion (s24) | `/account/settings` → Delete my account | Password + typed `DELETE`, consequences stated **before** the button |
| Stop direct marketing (s69(3)(b)) | `/account/settings` → Email | One checkbox, off as easily as on, effective immediately |

### What deletion actually does — verified, not assumed

Run against the live database, a real user with a real order, membership,
points ledger entry and consent row, then deleted:

| | Result |
|---|---|
| Paid order record | ✅ **kept**, `user_id` nulled |
| Consent audit trail | ✅ **kept**, `user_id` nulled |
| Membership record | ✅ gone |
| Points ledger | ✅ gone |
| Login itself | ✅ gone |

The orders stay because South African tax law requires records of sales for
five years — deleting them is not something we may lawfully do. The consent
trail stays because if someone later asks whether this address agreed to
marketing, the answer has to be a record rather than a shrug. Both are said
plainly on the settings page before the customer confirms, and again in the
email afterwards.

`consent_records.user_id` was originally `on delete cascade`, which
contradicted the table's own rule that rows are never deleted. Migration 0002
changes it to `on delete set null`.

---

## Enumeration and abuse

**The signup and reset endpoints answer identically whether or not an address
has an account.** Whether someone shops here is not a stranger's business, and
a "no such account" message is a free customer list for anyone with a
wordlist. That includes the rate-limited case — a limit message that only
appears for real addresses would leak exactly what the generic response
protects.

The cost is a legitimate user who forgot they had an account getting "check
your email" and no email. That is why the duplicate-signup notice exists: the
real owner of the address is told they already have an account and offered a
reset, which leaks nothing to the person who typed it.

**Order lookup** (`/track`) needs the order number **and** the matching email.
An order number is printed on packaging and pasted into WhatsApp, so on its own
it is a weak secret. It returns status, item and dates — never the delivery
address, phone number, buyer name or PayFast reference. The email comparison
hashes both sides and uses `timingSafeEqual`, so response time doesn't hint at
how close a guess was, and there is exactly one failure message.

### The rate limits

| Endpoint | Limit |
|---|---|
| Signup | 5 per IP per hour |
| Login | 10 per IP and 8 per email, per 15 min |
| Forgot password | 5 per IP and 3 per email, per hour |
| Order lookup | 8 per IP per 10 min |
| Data export | 5 per account per hour |

**These are honest speed bumps, not walls.** `lib/rateLimit.ts` counts per
server process, so on serverless hosting a burst spread across N warm
instances gets roughly N times the allowance, and a cold start resets the
window. Good enough to stop a script walking order numbers from one laptop;
not good enough to stop a distributed attack. The fix when that matters is a
shared store — Upstash Redis, or a Postgres table — behind the same
`rateLimit()` signature.

### Passwords

Minimum 10 characters, maximum 72 (beyond that the hash ignores the rest, and
silently truncating a password is worse than refusing it). No composition
rules, because "must contain a symbol" mostly produces `Password1!`. Rejected:
all digits, and anything containing the email's local part.

Changing a password requires the current one even with a live session — a
borrowed phone should not be enough to lock the owner out of their own account.

---

## What auth turned on

- **`/account`, `/account/orders`, `/account/rewards`, `/account/settings`**
- **Points that actually accrue.** `awardPointsForOrder` runs when the PayFast
  ITN confirms payment — never at checkout, where an abandoned cart would mint
  them. Guest orders have no `user_id` and earn nothing, which the loyalty page
  now says instead of promising accounts "soon".
- **Orders attached to people.** `/api/checkout` reads the session and sets
  `user_id`, so an order shows up under the customer's account and the ITN has
  somewhere to put the points. `/api/checkout` is in the middleware matcher for
  exactly this reason: an expired token there would silently drop a signed-in
  customer to guest checkout and cost them their points.
- **The top three rungs of the commitment ladder.** `account`, `customer` and
  `repeat` in `lib/ladder.ts` were written but unreachable. `resolveState()`
  now resolves them from real paid-order counts.

## Still to build

- **Membership purchase.** `/okuhle-plus` still sends people to WhatsApp. The
  R299 payment needs a checkout path that isn't a garment SKU, then a
  `memberships` row and a member number on ITN confirmation.
- **Points redemption at checkout.** `redeemPoints()` exists and is tested; no
  UI spends them yet. Today a customer mentions their balance when ordering.
- **Renewal reminders** 14 days before expiry (needs a scheduler;
  `memberships_expiry_idx` supports the query).
- **Admin order and member view.**
- **Delivery cost in the total before the PayFast handoff** — ECTA wants the
  full landed cost shown before payment. `orders.delivery_cents` is ready and
  is always 0 today.

---

## Verifying it for real

This code was written in a sandbox that cannot reach `*.supabase.co`, so the
HTTP layer was never exercised there. Two things close that gap.

**Unit tests** — the password policy, JWT expiry reading, the rate limiter's
windows, and the ladder's ordering. These import the real modules rather than
re-implementing them, so a change to a rule breaks the test instead of quietly
drifting from it:

```bash
npm test        # 41 tests, all passing
```

**The live check** — run locally once the env vars are set:

```bash
node scripts/verify-auth.mjs
```

Twenty checks against the real project: it creates a throwaway account,
proves a duplicate signup is refused, signs in, rejects a wrong password,
rotates a refresh token and proves the spent one can't be replayed, seeds an
order for this account **and one for a different account**, then proves RLS
hides the other customer's order *with no filter in the query at all*. Then
points, the once-per-order unique index, recovery links, consent rows
including the declined one, deletion, and what survived it. It cleans up after
itself.

If a check fails, the bug is real — don't work around the script.
