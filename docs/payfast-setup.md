# PayFast setup

PayFast rather than Stripe, because Stripe does not pay out to South African bank
accounts. PayFast settles in ZAR and supports card, Instant EFT, SnapScan and Zapper.

**One-time payments only.** There is no recurring billing — the subscription was removed
deliberately (see the rewards work), so no recurring API is used.

---

## What is built

| Piece | File |
|---|---|
| Signature, encoding, URLs, field order | `lib/payfast.ts` |
| Signature tests | `lib/payfast.test.mjs` |
| Checkout initiation | `app/api/checkout/route.ts` |
| ITN webhook (4-step validation) | `app/api/webhooks/payfast/route.ts` |
| Buy Now button | `components/BuyNow.tsx` |
| Return / cancel pages | `app/order-confirmed`, `app/order-cancelled` |
| Order store (dev only — see blocker) | `lib/orders.ts` |

Run the signature tests with:

```bash
node --test lib/payfast.test.mjs
```

---

## ⚠️ One blocker before this can take real money

**There is no durable order store.** `lib/orders.ts` keeps orders in memory, which does
not survive between serverless invocations — so an order created at checkout would be
gone by the time PayFast's ITN arrives, and the amount check would have nothing to
compare against.

Rather than let that fail silently, `app/api/checkout/route.ts` **refuses to start a
checkout in production** while `hasDurableOrderStore()` returns false. You will get:

> Checkout is not available right now. Please order on WhatsApp.

To finish: implement `OrderStore` against Supabase (the interface is already defined),
and flip `hasDurableOrderStore()` to true. That is the only thing standing between this
and live payments.

---

## Setup steps

1. **Create a PayFast merchant account** at payfast.co.za.
2. **Set a passphrase** in the PayFast dashboard (Settings → Integration). Copy it
   exactly — every signature depends on it matching.
3. **Fill in `.env.local`** from `.env.example`: merchant ID, merchant key, passphrase,
   and `NEXT_PUBLIC_SITE_URL` (must be the real public URL — PayFast calls back to it).
4. **Leave `PAYFAST_SANDBOX=true`** and test first.
5. **Sandbox test**: place an order, pay with PayFast's sandbox card, confirm the ITN
   arrives and the server log shows `order … paid`.
6. **Go live**: set `PAYFAST_SANDBOX=false`, then make **one real small purchase** and
   refund it. Do not skip this — sandbox and live behave differently.

Until step 3 is done, the Buy Now button does not render at all and the site falls back
to WhatsApp ordering. A checkout button that cannot work is worse than none.

---

## How the ITN is secured

An ITN is an unauthenticated public POST. Anyone can send one. All four of PayFast's
required checks run, and **any** failure means the order is not marked paid:

1. **Signature** — recomputed over the fields *in the order they arrived* (order matters,
   and differs from the outgoing checkout order), compared in constant time.
2. **Source** — PayFast's hostnames are resolved at request time and the caller's IP must
   be one of them. Resolved rather than hardcoded, because the IPs change.
3. **Amount** — compared against the amount **we** recorded for that order, never the
   amount in the request.
4. **Postback** — the raw body is sent back to PayFast, which must reply `VALID`.

The handler always returns 200. PayFast retries non-200 responses, and retrying a
rejected forgery achieves nothing.

**Fail-closed:** if PayFast cannot be reached for step 4, the ITN is rejected rather than
accepted. An order is never marked paid on a guess.

### Price tampering is not possible

The checkout API takes a product id, colour and size — **never an amount**. The price is
looked up from `lib/products.ts` server-side. A client POSTing `{"amount": 1}` for a
hoodie is still charged R400.00. This is tested.

---

## What was verified locally

Against PayFast's public sandbox credentials, driving the real endpoints:

| Test | Result |
|---|---|
| Valid checkout returns signed fields, correct sandbox URL, R400.00 | ✅ |
| Client-supplied `amount: 1` ignored, charged R400.00 | ✅ |
| Invalid colour / size / product rejected | ✅ |
| ITN with forged signature | ✅ rejected |
| ITN from a non-PayFast IP | ✅ rejected |
| ITN with valid signature but R1 instead of R400 | ✅ rejected |
| ITN valid but PayFast unreachable for postback | ✅ rejected (fail-closed) |
| Production checkout without a durable order store | ✅ refused |

**Not verifiable here:** the positive path — a genuine PayFast-originated ITN being
accepted and marking an order paid. That requires a real sandbox transaction from
PayFast's servers to a publicly reachable URL. It is step 5 above, and it is the one
test that actually proves the integration works end to end.

---

## Still to build on top of this

- Durable order store (the blocker above)
- Customer confirmation email and owner notification on successful payment — the hook is
  marked `TODO` in the ITN handler
- Awarding loyalty points on payment confirmation
- Delivery cost added to the total before the PayFast handoff (currently the item price
  only; ECTA requires the full landed cost be shown before payment)
- Admin view of orders
