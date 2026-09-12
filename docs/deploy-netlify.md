# Putting the site on Netlify

The repo carries `netlify.toml`, so there are **no build settings to type**.
Netlify reads the build command, the publish directory, the Next.js runtime and
the public environment variables from that file.

---

## Import it (about two minutes)

1. Go to **[app.netlify.com](https://app.netlify.com)** → **Add new project** →
   **Import an existing project** → **GitHub**.
2. Pick **`richieradebe07-ops/okuhle-store`**.
   (If it isn't listed, click *Configure the Netlify app on GitHub* and give it
   access to that repo.)
3. **Change the branch to deploy** — this is the one thing that matters:

   ```
   Branch to deploy:  step-1-site-inventory
   ```

   `main` is still the empty starter commit. Deploy that and you get nothing.
4. Leave every build setting alone — `netlify.toml` has already filled them in.
   Click **Deploy**.
5. Once it builds: **Project configuration → General → Project details →
   Change project name** → `okuhle-preview`.

   That gives you **`okuhle-preview.netlify.app`**, and it matches the
   `NEXT_PUBLIC_SITE_URL` already in `netlify.toml`.

Every push to `step-1-site-inventory` redeploys automatically from then on.

---

## What works on the preview, and what doesn't

Everything visual and everything that doesn't need a secret:

| Works | Doesn't, and what it says instead |
|---|---|
| Every page, both themes, phone and desktop | — |
| The shop, all 5 products, 39 colourways | — |
| Wishlist, drops, gallery, FAQ, legal pages | — |
| The assistant widget's scripted answers | — |
| `/signup`, `/login`, `/track` render and validate | Submitting says *"Accounts aren't switched on yet"* |
| Order tracking form | *"Order lookup isn't available yet"* |
| — | **Card checkout** falls back to WhatsApp ordering |
| — | **Emails** are logged to the build output, not sent |

Nothing is broken — each one refuses honestly and points at WhatsApp, which is
the designed behaviour when a key is absent. See `lib/checkout` guards and
`docs/payfast-setup.md`.

---

## Turning the missing pieces on

Add these in **Project configuration → Environment variables**, then
**Deploys → Trigger deploy → Clear cache and deploy site**. Each one is
independent — add only what you want to test.

| Variable | Unlocks | Where it comes from |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | signup, login, the whole `/account` area, order tracking | Supabase → Project Settings → API keys → `service_role` |
| `RESEND_API_KEY` + `FROM_EMAIL` | confirmation and order emails actually sending | Resend dashboard |
| `PAYFAST_MERCHANT_ID` + `PAYFAST_MERCHANT_KEY` + `PAYFAST_PASSPHRASE` | card checkout | PayFast dashboard, or the sandbox credentials in `.env.example` |

**Before signup will work you also need**, in Supabase → Authentication → URL
Configuration → Redirect URLs:

```
https://okuhle-preview.netlify.app/login
https://okuhle-preview.netlify.app/reset-password
```

Supabase refuses to redirect anywhere not on that list — which is a feature, not
an obstacle: it stops someone crafting a confirmation link that hands the new
session to their own server.

---

## ⚠️ What must never go in `netlify.toml`

That file is committed to the repo, so everything in it is public.

The Supabase **URL and anon key are in there deliberately** — the anon key is
public by design, ships inside the browser bundle, and Row Level Security is
what protects the data. That was verified against the live database: anon can
neither read, insert, nor mark an order paid (`docs/supabase-setup.md`).

These four go in the Netlify UI and nowhere else:

- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS entirely
- `RESEND_API_KEY` — sends email as your domain
- `PAYFAST_MERCHANT_KEY` and `PAYFAST_PASSPHRASE` — take money

If any of them ever lands in a commit, **rotate it** in the relevant dashboard.
Deleting the line is not enough; git keeps history.

---

## The preview is hidden from Google on purpose

`app/robots.ts` returns `Disallow: /` for every host that isn't
`okuhle.co.za`. A full copy of the shop on a `netlify.app` subdomain is not
harmless — Google treats it as duplicate content and it can outrank or
cannibalise the real store.

The switch is the host in `NEXT_PUBLIC_SITE_URL`, so it flips by itself when
the real domain is pointed here. Verified both ways: the preview host returns
`Disallow: /`, and `okuhle.co.za` returns `Allow: /` plus the sitemap, with the
account and auth pages excluded.

## If the build fails

Next.js 16 is new and Netlify's Next.js runtime occasionally lags a release.
If the build breaks on the runtime rather than on the code, the fallback is
Vercel — it builds this repo from GitHub with first-party Next.js support, and
needs no settings either. Send me the failing build log and I'll tell you which
it is.
