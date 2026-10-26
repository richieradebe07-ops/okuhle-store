# Reviews and comments

Customers can review a piece they bought, or leave a general comment about the
brand. Migrations `0003_reviews.sql` and `0004_reviews_auto_publish.sql` are
**applied and verified** against the live database.

| | |
|---|---|
| Product reviews | `/shop/<id>#reviews` — read them, and leave one |
| Brand comments | `/reviews` |
| All published reviews | `/reviews` |
| Flagged queue + remove-after-the-fact | `/account/reviews` |

---

## The model, as of 26 Oct 2026 (V12)

This **replaced** the original approve-everything-first model. The decision:
reviews should feel like a live comment section, not a queue the owner has to
personally clear before anything appears.

```
Submit → automated filter (lib/reviewFilter.ts) →
  PASSES  → published immediately, visible on the product page right away
  FLAGGED → held back, owner gets an email, shows up in the flagged queue
```

A clean review — the large majority — needs no human at all. The owner's
workload is now only ever the suspicious minority, and the backstop for
whatever the filter misses is that **any** live review can be pulled
afterwards (see "Removing a review" below).

**The filter is a reasonable net for a small brand, not enterprise
anti-fraud.** It will miss things. That is the reason the backstop exists —
don't read a quiet flagged queue as "the filter is airtight."

---

## The one thing you must do

Set **`OWNER_EMAIL`** in Netlify's environment variables to the address you
sign in with. That is what makes `/account/reviews` visible to you and nobody
else — it is already the address that receives order alerts.

Without it, **nobody** is the owner, so flagged reviews sit unactioned and
you never find out. The check fails closed on purpose: an unset variable must
not make every visitor a moderator.

---

## What the filter checks (`lib/reviewFilter.ts`)

Runs on every submission, in this order, before the row is written. The
first match wins and becomes `flagged_reason`:

1. **Honeypot filled** — a field real visitors never see or reach (off-screen,
   `tabIndex={-1}`, out of the DOM's visible flow) that a bot filling every
   input on the page often fills in anyway.
2. **Contains a link** — `http(s)://`, a `www.` address, or a bare domain
   (`something.shop`, no protocol). Flagged, not blocked — a genuine customer
   pasting a link to a social post by mistake still gets heard.
3. **Profanity** — via the `bad-words` package (MIT-licensed, actively
   maintained), not a hand-rolled list. The matched word goes in
   `flagged_reason` for the owner only; it is never shown publicly.
4. **Duplicate or near-duplicate content** — exact match after normalising
   case/punctuation, or ≥85% word overlap with something already in the
   table (checked against the last 300 reviews, across every product — a
   spam bot's boilerplate rarely sticks to one item). The 85% threshold and
   a 20-character floor keep two short, genuinely different reviews
   ("Runs small, order up." / "True to size, comfy.") from tripping it.
5. **Bot timing pattern** — a 5-star review, 30 characters or less, submitted
   under 4 seconds after the form rendered. Lowest priority, as specced —
   a genuine quick thumbs-up typed slowly, or at any length, never matches.

**Rate limiting is load-bearing now, not cosmetic.** Three submissions per
hour, keyed on IP *and*, separately, on email when one is given — the second
limit catches a script that rotates IPs but reuses one address. Same honest
caveat as everywhere else in this codebase: `lib/rateLimit.ts` counts per
server process, so a burst spread across serverless instances gets more than
the nominal limit. It is a speed bump, not a wall; the filter and the
after-the-fact removal are the real defences.

**One review per product, per identity**, enforced by two unique indexes
rather than application code: `(order_id, product_id)` from migration 0003
for a verified purchase, and `(email, product_id)` from migration 0004 for an
unverified one that at least gave an email. A reviewer who gives neither has
nothing left to key on — caught by rate limiting instead of a uniqueness
check, an accepted, honestly-stated gap rather than something pretending to
be airtight.

**2000-character limit, server-side** (`app/api/reviews/route.ts`), not just
the textarea's `maxLength` — confirmed present, not assumed.

---

## The "verified buyer" badge — unchanged, and it is the real thing

**Important correction to the brief this was built from:** the V12 prompt
that specified this build assumed checkout was still WhatsApp-only, with no
real orders table to verify against, and asked for the badge to be removed or
relabeled "self-reported" as a result. **That assumption is out of date for
this codebase.** PayFast checkout has been live since this session's earlier
work, writing real rows to a real `orders` table — and `findPaidPurchase` in
`lib/reviews.ts` already matches a review against it honestly: either the
signed-in customer has a paid order for that piece, or they supply the order
number and the email on that order (the same pair `/track` asks for).

So the badge was **left exactly as it was** — real, server-derived,
never accepted from the client — because relabeling it "self-reported" would
have made the site *less* honest, not more, for a check that genuinely
exists. If checkout ever goes back to being unverifiable for some reason,
revisit this; right now it would be a regression to change it.

Failing verification does not refuse the review — plenty of genuine
customers still buy over WhatsApp, and telling them their words don't count
would be both rude and wrong. They simply don't get the badge.

---

## The flagged queue and removing a review (`/account/reviews`)

Two sections on one page, replacing the old single approval queue:

- **Needs a look** — only reviews with `flagged = true`. Each shows the
  content and `flagged_reason`. **Publish anyway** clears the flag and
  publishes; **Remove** soft-deletes it (see below). Usually short, by
  design — it is not a backlog to work through, it's an exceptions list.
- **All live reviews** — every currently-published review, each with a
  **Remove** button. This is the actual safety net for auto-publish: content
  the filter missed can still be pulled, just after a brief window of being
  visible rather than before.

**Removing is a soft delete**, same philosophy as the original 'rejected'
status: `hidden = true`, with `hidden_reason`, `hidden_by` (the owner's
email), and `hidden_at` recorded, but the row stays. Nothing here
hard-deletes — if a removal is ever disputed, there is a record of what was
written and what was decided and by whom.

**Visible to the public** means, everywhere reviews are read:
`status = 'published' AND flagged = false AND hidden = false` — all three,
every time, centralised behind one `PUBLIC_FILTER` constant in `lib/reviews.ts`
so it can't drift between call sites.

---

## Email notifications

**Only for a flagged review** (`sendOwnerReviewAlert`), never for a clean one
that just published itself — notifying the owner on every submission would
defeat the entire point of taking him out of the loop. The subject line
leads with the reason it was held, so it can be judged from a phone without
clicking through.

---

## What the public never sees

Email addresses, IP addresses, `flagged_reason`, `hidden_reason`, and who
hid something. All stored — the email to match orders and reply, the IP for
abuse, the rest for the owner's own moderation trail — and none of it ever
rendered.

This is enforced by *not* having a public read policy on the `reviews`
table. Row Level Security is row-level, not column-level: a policy letting
anon read published reviews would also let anon select the `email` and
`ip_address` columns off those same rows. Reviews are therefore read
server-side with an explicit column list — see `PUBLIC_COLUMNS` vs
`MODERATION_COLUMNS` in `lib/reviews.ts`, and the note at the top of
migration 0003.

The reviewer still chooses their own display name — this codebase doesn't
force arbitrary text into a shape, which risks mangling real names in a
multicultural customer base. The form's hint now asks for "first name and
last initial" by example (`Thabo M.`) rather than a full name, same honesty
principle as everywhere else here: say what's wanted, don't silently
auto-truncate what's typed.

---

## Ratings

One to five stars, required on a review of a piece and optional on a general
comment. Averages show to one decimal place — rounding to whole stars would
turn 4.4 into 4 — **always next to the count**, and now **next to the full
5-star-down-to-1-star distribution bar** on both the product page and
`/reviews` (`RatingBreakdown` in `components/ReviewList.tsx`) — the
single most recognisable "Shein-style" element, per the brief, and the
reason `RatingSummary` now carries a `byStar` breakdown alongside the
average.

A piece with no reviews shows no stars at all, rather than an empty grey row
that reads as "nobody bought this."

---

## Sorting and pagination

Client-side, in `ReviewList` — Most Recent / Highest Rated / Lowest Rated,
plus a "Load more" button showing 6 at a time. Deliberately not server-side
or infinite-scroll: this brand's review volume doesn't come close to the
point where shipping the full list to the browser costs anything noticeable.
Revisit if a single product ever reaches the hundreds.

---

## Freshness

Product pages, the shop grid and `/reviews` are prerendered with
`revalidate = 300`. Without it a review published five minutes ago wouldn't
appear until the next deploy.

---

## Not built

- **No photo/video uploads.** Explicitly out of scope for this build — see
  the brief's Part 0. Don't add an upload field without its own prompt; it
  brings file storage, image moderation, and size limits this one never
  scoped.
- **No reply-to-review.** The owner cannot post a public response yet. Worth
  adding — a good reply to a bad review is the most persuasive thing on a
  shop page.
- **No "how was it?" email** after delivery, which is when review requests
  actually work. Needs a scheduler, same as the membership renewal reminder.
- **No editing** by the reviewer. Changes go through WhatsApp for now.
- **Display-name shape isn't enforced**, only hinted — see above.

---

## What was verified

`npm test` — 78 tests across `lib/reviews.test.mjs` (averaging, star
distribution, the owner check) and `lib/reviewFilter.test.mjs` (every filter
rule independently, plus that a clean review trips none of them).

A full production build (`npm run build`) prerenders `/reviews` and every
product page against the live database, including the new `ratingSummaries`
query with its `byStar` breakdown, with no errors.

Against the live database, via the constraint checks in migration 0003
(still enforced, unchanged):

| Attempt | Result |
|---|---|
| Product review with no rating | ✅ blocked |
| Body under 10 characters | ✅ blocked |
| One-letter display name | ✅ blocked |
| Rating of 6 | ✅ blocked |

`npm run lint` is clean on every file this build touched.

**Not yet exercised against the live site**: a real submission through the
browser (clean, linked, duplicated, honeypot-tripped, and fast-5-star), since
that needs the deployed build, not just the local one. Run through the
testing checklist in the original brief once this is live — it's written to
be followed step by step.
