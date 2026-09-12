# POPIA / ECTA compliance audit

Jurisdiction: **South Africa**. The applicable laws are POPIA, ECTA and the CPA — not GDPR.

Audited: 2026-09-12, against the codebase at that date.

---

## 1. Cookie audit — finding: no consent banner is required

A banner was **not** built, because there is nothing here that needs consent.

What the site actually does:

| Checked | Result |
|---|---|
| `document.cookie` writes | **None.** The site sets no cookies at all. |
| Analytics | **None installed.** No Plausible, no GA4. |
| Advertising pixels | **None.** No Meta, TikTok or Google pixel. |
| Third-party embeds | **None.** Social links are plain `<a>` tags, nothing embedded. |
| `localStorage` | 3 keys, all functional (below). |

The three `localStorage` keys — theme preference, wishlist, and a "joined the list"
flag — are strictly necessary/functional, stay on the visitor's device, and are never
transmitted to us. Under POPIA these do not require opt-in consent.

**Deliberate decision:** no banner. POPIA requires consent for non-essential tracking;
adding a banner where there is no tracking trains people to dismiss consent UI without
reading it, and is not itself compliance.

### What would change this answer

Add a banner **before** shipping any of these:

- A Meta, TikTok or Google advertising pixel (this is the usual trigger)
- Analytics that identifies individuals (Plausible is cookieless — likely still no banner)
- Embedded third-party content that sets cookies (YouTube embeds, some map embeds)

If that day comes, the required shape is: Accept / Reject / Manage at **equal** visual
weight, nothing pre-ticked, non-essential scripts blocked until consent, a consent
record stored (timestamp, choices, policy version, consent ID), and a persistent
footer link to withdraw as easily as it was given.

### One honest caveat

Fonts load from Google Fonts, so a visitor's browser makes a request to Google and
Google sees their IP. **No cookie is set**, so this does not trigger consent — but it
is a third-party request and is disclosed in the cookie policy. Self-hosting the two
font families would remove it entirely. Recommended, not urgent.

---

## 2. What was built

| Item | Status |
|---|---|
| Cookie audit | Done — see above |
| Privacy Policy rewritten to POPIA content requirements | Done |
| Terms rewritten to ECTA s43 disclosure requirements | Done |
| Cookie Policy rewritten (states what is stored and why no banner) | Done |
| Assistant widget — Layer 1 (scripted + navigation) | Done |
| Cookie consent banner | **Not needed** — see audit |
| Signup consent unbundling | **Blocked** — there is no signup; accounts aren't built |
| Consent records (terms/privacy/marketing versions per user) | **Blocked** — needs accounts |
| Data subject rights in `/account/settings` | **Blocked** — needs accounts |
| Assistant Layer 2 (grounded LLM) | **Not built** — see below |
| Assistant Layer 3 (WhatsApp escalation) | Done — always visible in the widget |

### Assistant: why Layer 1 only

Layer 1 answers the top questions from the site's own product and shipping data, so it
cannot invent a price or a delivery date — the two failure modes that actually carry
legal risk under ECTA. Every figure it quotes is read from `lib/products.ts` and
`lib/loyalty.ts`, the same source the shop renders from, so it cannot drift out of sync.

Layer 2 (grounded LLM fallback) is deliberately **not** built yet. It needs:

- An API key and a hard monthly spend cap with an owner alert
- A retrieval index over the FAQ/shipping/product/about pages
- The guardrail system prompt (never state an unretrieved price, never promise a date,
  never offer a refund or discount, never state stock, escalate when unsure)
- **A POPIA disclosure**, because sending chat content to a US-hosted model API is a
  cross-border transfer of personal information under section 72

Until then the widget escalates to WhatsApp, which is the brand's actual strength.

Note: the current widget stores **nothing**. Visitors tap pre-written buttons; no free
text is captured, so no chat transcripts exist yet. The privacy policy's 12-month
transcript retention line applies from the moment Layer 2 ships.

---

## 3. Outstanding — owner action required

These are rendered on the live legal pages as visible `[outstanding]` markers, so a
missing statutory disclosure cannot ship unnoticed. Fill them in `lib/legal.ts`.

**Required before the legal pages are fit to publish:**

1. **Registered name, entity type and CIPC registration number** — ECTA s43 requires
   these. Also VAT number, or confirmation that the business is not VAT registered.
2. **Information Officer name and contact details** — POPIA. By default this is the
   head of the business automatically, whether or not registered.
3. **Register the Information Officer with the Information Regulator**, via their
   eServices portal. This is mandatory and cannot be done in code. The Regulator has
   publicly flagged officers "appointed on paper only" as a common failure.
4. **Lay-by default terms** — what happens if a customer stops paying partway, and
   whether payments already made are refundable, within what period. Currently marked
   outstanding on the terms page.

**Requires a South African attorney, not a developer:**

5. **The cooling-off position.** ECTA s44 gives a 7-day right to cancel; s42(2)(f)
   excludes goods "made to the consumer's specifications". Okuhle is made to order in a
   customer-chosen colour and size, so the exclusion *may* apply — but whether picking
   from a standard range counts as "made to specifications" is genuinely arguable, and
   getting it wrong means unlawfully refusing refunds. The terms currently say the
   exclusion may apply and that the position is unconfirmed, which is honest but is not
   a long-term answer.

   Independent of that: the CPA implied warranty of quality **cannot be contracted out
   of**. The terms are already scoped so that no "all sales final" wording touches
   defects.

6. **The free size exchange** is a commercial promise, not a legal obligation. It is now
   published in the terms — so it must be honoured. Say the word if you can't and I'll
   pull it.

---

## 4. Consent posture today

There is no signup, so there is no bundled consent to unbundle. The only consent
collected is the newsletter, which is already correct in shape: a standalone opt-in,
nothing pre-ticked, not a condition of anything, with its purpose stated at the point
of capture ("We'll only ever email you about OKUHLE drops. Unsubscribe anytime.").

When accounts are built, the required shape is two separate unticked boxes — terms and
privacy (required) and marketing (optional, must not block account creation) — with
`terms_version`, `privacy_version`, `marketing_consent_at` and consent source recorded
per user.
