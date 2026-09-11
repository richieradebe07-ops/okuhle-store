# OKUHLE

Rebuild of the OKUHLE storefront (previously a static site at `ohy-okuhle.netlify.app`) as a
Next.js app, so that accounts, real payments and the Okuhle+ membership can be added on top of a
proper backend rather than bolted onto static HTML.

The old site is the inspiration, not the spec — same brand, same intent, better execution.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## What's here

| Route | Purpose |
|---|---|
| `/` | Home — hero, story, featured pieces, Okuhle+ teaser, community, email capture |
| `/shop` | Full collection with category filters |
| `/shop/[id]` | Product detail — fit, material, care, member price, related pieces |
| `/about` | Brand story and how made-to-order works |
| `/gallery` | Community/UGC |
| `/pricing` | Okuhle+ membership — Free vs Okuhle+, real member-price table |
| `/faq` | 25+ questions across 6 sections |
| `/shipping` | Delivery times, courier costs, lay-by |
| `/order` | How ordering and payment works |
| `/wishlist` | Saved pieces (per-device, localStorage) |
| `/signup` | Okuhle+ join (routes to WhatsApp until billing is live) |
| `/privacy`, `/terms`, `/cookies` | Legal |
| `/api/subscribe` | Newsletter signup → ConvertKit |

## Architecture notes

- **Products are data, not markup.** Everything lives in `lib/products.ts`. Adding a piece is a data
  edit — no page template is touched. Savings badges and member prices are *derived* from the
  numbers, so a discount can never disagree with the price shown (a bug the old site had).
- **Theme** is a `data-theme` attribute on `<html>`, set before first paint to avoid a flash, with
  the choice persisted to `localStorage`.
- **Design tokens** live in `app/globals.css` — black/cream/gold, one place to change.

## Still to build

1. Supabase: accounts, memberships, orders, rewards tables + auth
2. PayFast: one-time checkout, recurring Okuhle+ billing, ITN webhook validation
3. Member pricing applied at checkout for signed-in members
4. Owner admin dashboard — sales, active members, MRR
5. ConvertKit automated sequences wired to purchase/membership events
6. Plausible analytics + goals
7. Real product photography and the real brand emblem (current emblem and product tiles are
   placeholders)

## Configuration

Copy `.env.example` to `.env.local` and fill in. Nothing that needs a secret will run without one —
the newsletter route, for example, reports that signups aren't switched on rather than pretending
to have subscribed someone.

## Content provenance

`docs/step-1-site-inventory.md` records what was extracted from the previous site and what still
needs owner confirmation.
