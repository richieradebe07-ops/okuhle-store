# Step 1 — Current Site Inventory (OKUHLE / ohy-okuhle.netlify.app)

Source: a screen-recording of the live site (`ohy-okuhle.netlify.app`), reviewed frame-by-frame,
since this sandbox environment cannot reach the public internet directly and the site has no
connected git repo (it was deployed to Netlify via direct upload, `deploy_source: "api"`).

This is a best-effort transcription from video frames, not a byte-for-byte source dump. Anything
below marked **⚠️ CONFIRM** is uncertain (blurry, cut off, or not shown in the recording) and needs
your correction before Phase 2 (rebuild code) starts, per the master prompt's own instruction not
to guess at exact copy or prices.

## Brand identity

- Name: **OKUHLE** (brand tag/label shown on some product images as "OHY / THE LABEL" — full
  business name appears to be **OHY Okuhle**)
- Header wordmark: "OKUHLE" with sub-label "EST. 2026 · RSA"
- Logo mark: circular emblem containing a stylized shield/sail crest, "OKUHLE" text inside the ring
- Tagline / hero headline: **"Wear Something Okuhle."** ("Okuhle" rendered in the gold accent color)
- Footer tagline: "Beautifully bold streetwear out of Pietermaritzburg, South Africa. Est. 2026."
- "Okuhle means something beautiful" — messaging referenced in prior prompts; not seen verbatim
  on-screen in this recording. **⚠️ CONFIRM** exact placement/wording if it exists on the live site.

## Design tokens (best-effort, no CSS access)

- Light mode background: warm cream/parchment (~`#F2E8D6`-ish)
- Dark mode background: near-black (~`#0B0B0B`)
- Accent: warm gold/bronze buttons and headline highlight (visually closer to a muted
  "old gold"/bronze than a bright gold — **⚠️ CONFIRM exact hex**, no design file available)
- Dark/light toggle: sun/moon icon in the header, next to a heart (wishlist) icon and a hamburger
  menu icon — confirmed working, user toggles it mid-recording

## Navigation (confirmed, full-screen menu overlay captured)

In order: **HOME, ABOUT, SHOP, GALLERY, FAQ, ORDER**

## Footer (confirmed, captured in full)

- Logo mark + tagline (see above)
- Row of 4 circular social icons (glyphs not legible in-frame — prior prompts name TikTok
  `@ohy_okuhle1`, Instagram `@ohy_okuhle`, Facebook "OHY Okuhle", YouTube `@OHY_Okuhle`; use those
  unless you say otherwise)
- **EXPLORE**: Our Story, Shop, Gallery, FAQ, Shipping, Wishlist
- **CONTACT**: `076 198 1607` · an email ending `@gmail.com` (**⚠️ CONFIRM exact spelling** — read
  as something like "ngoonairzie@gmail.com" from video compression, likely wrong) · Pietermaritzburg, KZN
- **LEGAL**: Privacy Policy, Terms & Conditions, Cookie Policy, Cookie Preferences
- Bottom line: "© 2026 OKUHLE. All rights reserved." / "Beautifully Bold — Est 2026"
- A persistent gold "ORDER VIA WHATSAPP" sticky bar is fixed at the bottom of **every** page
  (already implemented on the live site — the "no sticky CTA" gap noted in earlier prompts appears
  to already be solved)

## Home page sections (confirmed)

1. **Hero** — headline "Wear Something Okuhle.", product hero image (Signature Tee, cream), sticky
   "ORDER VIA WHATSAPP" CTA
2. **Email signup** — microcopy: *"We'll only ever email you about OKUHLE drops. Unsubscribe
   anytime."* next to an email capture field (exact field/button labels not fully visible —
   **⚠️ CONFIRM**). This means an email capture already exists on the live site.
3. **Our Story** (About teaser) — eyebrow "— OUR STORY", heading **"Born in Pietermaritzburg. Made
   to mean something."**, body:
   > "OKUHLE started in 2026 out of Mvundlweni, Pietermaritzburg — built on one idea: clothing
   > should carry meaning as well as style. Every hoodie, tee and sweater carries the OKUHLE
   > emblem, a mark of quality and identity worn by a growing community across KwaZulu-Natal."

   Bullets:
   - High-quality golf tees, tees, baggy fits, sweaters and hoodies
   - Black, white and gold — a palette built to last, not to trend
   - Lay-by available over 2–3 months, and bulk pricing on every line

   CTAs: "EXPLORE THE RANGE" (button), "READ OUR FULL STORY" (link)
4. **Shop grid** — product cards (see Product Catalog below)
5. **Gallery/UGC** — caption *"Follow along and see OKUHLE in the wild — tag us and get featured."*
   2×2+ grid of customer photos (person wearing tee, close-up of embroidered emblem on a cap, logo
   on shorts, logo on a cap)
6. **Footer** (see above)

## Shop page (`/shop`, confirmed partially)

- Eyebrow: "— THE COLLECTION"
- Heading: **"Shop OKUHLE"**
- Subtext: obscured by nav overlay in the frame captured, approx. "Tap any [item] ... we'll confirm
  sizing and availability [over] WhatsApp" — **⚠️ CONFIRM exact wording**
- Filter tabs: `ALL` (default active), two tabs obscured, then `SWEATERS`, `HOODIES` visible —
  **⚠️ CONFIRM full tab list and order** (likely also `GOLF TEES`, `T-SHIRTS`, `BAGGY TEES`)

## FAQ page (`/faq`, confirmed partially)

- Back link: "< Back to OKUHLE"
- Eyebrow: "HELP"
- Heading: **"Frequently Asked Questions"**
- Subtext: *"Everything you need to know before you order. Can't find your answer? Message us
  directly on WhatsApp."*
- Accordion questions seen (answers not visible — collapsed): "What is OKUHLE?", "What does
  'Okuhle' mean?", "Where are you based, and can I visit?"
- **⚠️ CONFIRM**: full list of FAQ questions + their answers (recording cuts off after 3 questions)

## Pages referenced in nav/footer but NOT captured in this recording — need your input

- **Order** page (dedicated page vs. just the sticky WhatsApp CTA — **⚠️ CONFIRM**)
- **Shipping** page — timelines, costs, courier info, lay-by explanation (linked from footer,
  not shown)
- **Wishlist** page — behavior (heart icon exists in header; page content not shown)
- **Privacy Policy / Terms & Conditions / Cookie Policy** — full legal text not shown
- Exact WhatsApp number used for orders (may or may not be the `076 198 1607` contact number —
  **⚠️ CONFIRM**)

## Product catalog (confirmed from product cards — structured version in `data/products.json`)

> **SUPERSEDED.** The owner has since supplied product listings and photography. Confirmed values:
>
> | Product | Price | Was | Colourways supplied |
> |---|---|---|---|
> | Golf T-shirts | R270 | R300 | White, Grey, Sand, Pink, Royal Blue, Orange (6) |
> | T-shirts | R210 | **R240** | Black, Navy, Olive, Purple, Red, Cream (6) |
> | Baggy T-shirts | R270 | R280 | White, Grey, Sand, Yellow, Mustard, Orange, Red, Green, Sky, Royal Blue (10) |
> | Sweaters | R360 | R390 | White, Slate, Royal Blue, Green, Yellow, Mustard, Coral, Red, Pink (9) |
> | Hoodies | R400 | R450 | White, Grey, Royal Blue, Green, Mustard, Orange, Red, Pink (8) |
>
> - The "SAVE R30 vs R230→R210" discrepancy is resolved: the real was-price is **R240**, so the
>   badge was right and the R230 read from the video was wrong.
> - The old site listed both a "T-Shirt" and a "Signature Tee" at R210. The supplied photography
>   shows one tee product, so they are **merged into a single "T-Shirt"** — flag if that's wrong.
> - Photography now lives in `public/products/<product>/<colour>.jpg`; the real emblem was
>   extracted to `public/brand/emblem.png`.
> - **All five products are now photographed** — 39 colourways in total. Nothing in the catalogue
>   is a placeholder any more.
> - The owner's listings write "sweater's" / "Sweater's"; corrected to plain plurals in site copy.

| Product | Price | Was | Description (verbatim from card) | Colours seen | Sizes |
|---|---|---|---|---|---|
| Golf T-Shirt | R270 | R300 | "High quality golf t-shirt. Buy 3 golf t-shirts and more at a special price and save." | White, Grey, Tan/Gold, Pink, Blue, Sky Blue, Orange/Red | S, M, L, XL, XXL |
| T-Shirt | R210 | R230 | "Medium quality clothing. Buy 3 t-shirts and more at a special price and save." | Black, Blue, Navy, Red, Gold/Brown, Yellow | S, M, L, XL, XXL |
| Signature Tee | R210 | — | "Our flagship tee, printed with the full-size Okuhle emblem front and centre. Price matches our classic tee — confirm colour and size on order." | Cream, Olive, Purple/Navy, Red | S, M, L, XL, XXL |
| Baggy T-Shirt | R270 | — | "High quality baggy tee — 'Wear & own your beauty.' Buy 3 baggy tees and more to save." | Grey (others not shown) | S, M, L, XL, XXL |
| Sweater | R360 | — | "High quality sweater. Buy 2 sweaters and more, and save." | White, Blue, Red, Yellow, Slate/Grey, Pink, Green | S, M, L, XL, XXL |
| Hoodie | R400 | — | "High quality hoodie. Buy 2 hoodies and more at a special price." | White, Blue, Red, Grey, Orange, Pink, Green | S, M, L, XL, XXL |

**⚠️ CONFIRM**:
- Baggy T-Shirt, Signature Tee full colour lists (only some swatches were visible in-frame)
- "SAVE R30" badge shown on the Golf Tee (R300→R270, consistent) but also on a T-Shirt card
  priced R210 with strikethrough R230 (only a R20 difference) — badge/strikethrough mismatch,
  please confirm the real "was" prices
- Whether the R270/R210/etc. prices are the *regular* price or already a "buy 3, save" bulk price
  (the descriptions read like a bulk-discount mechanic separate from any membership tier)
- Any products not shown in this recording (e.g. accessories, caps — a cap appears in the UGC
  gallery photos, unclear if it's purchasable)

## What this confirms about the "gaps" in earlier prompts

A few things the V1–V3 prompts listed as missing already appear to exist on the live site:
- Sticky/floating WhatsApp CTA — **already present** (gold bar, every page)
- Email signup capture — **already present** on the home page (ConvertKit destination unconfirmed)
- Dark/light mode toggle — **already present** and working
- Wishlist heart icon — **present** in header (page contents unconfirmed)

---

**Next step**: please confirm/correct the ⚠️ items above (especially exact prices, full colour
lists, FAQ answers, Shipping/Wishlist/Order/legal page content, and the WhatsApp number). Once
confirmed, Step 2 (tech stack scaffolding) starts from this file and `data/products.json` as the
source of truth — no product will be hardcoded into a page template.
