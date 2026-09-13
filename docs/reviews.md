# Reviews and comments

Customers can review a piece they bought, or leave a general comment about the
brand. Migration `0003_reviews.sql` is **applied and verified**.

| | |
|---|---|
| Product reviews | `/shop/<id>#reviews` — read them, and leave one |
| Brand comments | `/reviews` |
| All published reviews | `/reviews` |
| Your moderation queue | `/account/reviews` |

---

## The one thing you must do

Set **`OWNER_EMAIL`** in Netlify's environment variables to the address you
sign in with. That is what makes `/account/reviews` visible to you and nobody
else — it is already the address that receives order alerts.

Without it, **no one** can moderate, so nothing will ever be published. The
check fails closed on purpose: an unset variable must not make every visitor a
moderator.

---

## Nothing publishes itself

Every review lands as `pending`. You get an email the moment one arrives, with
the full text in the body so you can judge it from your phone without clicking
through. Then **Approve reviews** in your account menu → **Publish** or
**Reject**.

**Rejecting keeps the row.** It never becomes public, but it stays on record,
so if anyone ever claims their review was made to disappear there is proof of
what was written and what you decided.

A word on the temptation: publish the critical ones too. A page of nothing but
five stars is the least believable thing on a shop, and a three-star review
that says "runs a size small" sells more than ten perfect ones.

---

## The "verified buyer" badge

Awarded only when the review can be matched to a **paid order** in our own
database. Two ways that happens:

- the reviewer is **signed in** and has a paid order for that piece, or
- they give the **order number and the email on that order** — the same pair
  `/track` asks for, and for the same reason: an order number is printed on
  packaging and pasted into WhatsApp, so it is not a secret on its own.

**The badge is never taken from the request.** It is worked out server-side; a
client-supplied flag would make it worthless. The submit route reads exactly
six fields from the request body — `productId`, `rating`, `body`,
`displayName`, `email`, `orderId` — and nothing else, so `verifiedPurchase`
and `status` cannot be set by anyone posting to the API.

**Failing verification does not refuse the review.** Plenty of genuine
customers buy over WhatsApp, and telling them their words do not count would
be both rude and wrong. They simply do not get the badge.

One review per order per piece, enforced by a unique index rather than by
application code — so a single purchase cannot be used to stack up praise.

---

## What the public never sees

Email addresses and IP addresses. Both are stored — the email to match orders
and to reply, the IP for abuse — and neither is ever rendered.

That is enforced by *not* having a public read policy on the table. Row Level
Security is row-level, not column-level: a policy letting anonymous visitors
read published reviews would also let them select the `email` and `ip_address`
columns off those same rows. Reviews are therefore read server-side with an
explicit column list. See the note at the top of migration 0003.

The reviewer chooses the name that appears, and the form says so above the
field rather than leaving them to find out afterwards.

---

## Ratings

One to five stars, required on a review of a piece and optional on a general
comment. Averages are shown to one decimal place — rounding to whole stars
would turn 4.4 into 4 — and **always next to the count**. "4.8 stars" from two
people is not the same claim as 4.8 from two hundred, and hiding the
denominator is the oldest trick in retail.

A piece with no reviews shows no stars at all, rather than an empty grey row
that reads as "nobody bought this".

---

## Freshness

Product pages, the shop grid and `/reviews` are prerendered with
`revalidate = 300`. Without it a review you approved today would not appear
until the next deploy. Five minutes keeps the pages fast and indexable while
still picking up newly published reviews on their own.

---

## Rate limiting

Three submissions per IP per hour. Reviews are a once-in-a-while act for a real
person and a firehose for a spam script. Same honest caveat as everywhere
else: `lib/rateLimit.ts` counts per server process, so on serverless a burst
spread across instances gets more than that. It is a speed bump, and
moderation is the actual wall.

---

## What was verified

Against the live database, via the constraint checks in migration 0003:

| Attempt | Result |
|---|---|
| Product review with no rating | ✅ blocked |
| Body under 10 characters | ✅ blocked |
| One-letter display name | ✅ blocked |
| Rating of 6 | ✅ blocked |
| General comment with no rating | ✅ accepted |
| Valid product review | ✅ accepted, as `pending`, `verified_purchase = false` |

Over HTTP, against the running app: each validation message above, plus a
non-owner getting **404** from the moderation endpoint (not 403 — a 403 would
confirm the endpoint exists and that someone is the owner).

`npm test` covers the averaging and the owner check — 12 tests, including that
an unrated comment does not drag an average down and that an unset
`OWNER_EMAIL` makes nobody the owner.

---

## Not built

- **No reply-to-review.** The owner cannot post a public response yet. Worth
  adding — a good reply to a bad review is the most persuasive thing on a
  shop page.
- **No "how was it?" email** after delivery, which is when review requests
  actually work. It needs a scheduler, same as the membership renewal
  reminder.
- **No photo uploads** with reviews.
- **No editing** by the reviewer. Changes go through WhatsApp for now.
