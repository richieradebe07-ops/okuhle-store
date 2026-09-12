/**
 * Verifies the live Supabase wiring end to end.
 *
 * Run this locally (not in CI) once the env vars are set:
 *
 *   node scripts/verify-supabase.mjs
 *
 * It creates a throwaway order, reads it back, marks it paid, checks the
 * idempotency guard, proves the anon key cannot read or write it, then deletes
 * it. Nothing is left behind.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
 * SUPABASE_SERVICE_ROLE_KEY in the environment (or a .env.local this shell has
 * sourced).
 */
import { readFileSync, existsSync } from "node:fs";

// Load .env.local if present, so this works the same way the app does.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const ID = `OK-VERIFY-${Date.now().toString(36).toUpperCase()}`;
let failures = 0;

function check(name, passed, detail = "") {
  console.log(`${passed ? "  ok  " : " FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures++;
}

async function q(key, path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, body: json };
}

console.log(`\nVerifying ${URL_}\n`);

// 1. Service role can create an order
const created = await q(SERVICE, "orders", {
  method: "POST",
  prefer: "return=representation",
  body: {
    id: ID,
    amount_cents: 40000,
    product_id: "hoodie",
    product_name: "Hoodie",
    colour: "Black",
    size: "L",
    buyer_email: "verify@example.com",
  },
});
check("service role can create an order", created.ok, `HTTP ${created.status}`);

// 2. Service role reads it back with the right amount
const read = await q(SERVICE, `orders?id=eq.${ID}&limit=1`);
check(
  "order reads back at 40000 cents (R400.00)",
  read.ok && read.body?.[0]?.amount_cents === 40000,
  `got ${read.body?.[0]?.amount_cents}`
);

// 3. The anon key — what a browser holds — cannot read it
const anonRead = ANON ? await q(ANON, `orders?id=eq.${ID}`) : null;
check(
  "anon key CANNOT read the order (RLS)",
  !ANON || (anonRead.ok && Array.isArray(anonRead.body) && anonRead.body.length === 0),
  ANON ? `saw ${anonRead.body?.length} rows` : "no anon key set, skipped"
);

// 4. The anon key cannot insert its own cheap order
const anonInsert = ANON
  ? await q(ANON, "orders", {
      method: "POST",
      body: {
        id: `${ID}-EVIL`,
        amount_cents: 1,
        product_id: "hoodie",
        product_name: "Hoodie",
        colour: "Black",
        size: "L",
      },
    })
  : null;
check(
  "anon key CANNOT insert an order",
  !ANON || !anonInsert.ok,
  ANON ? `HTTP ${anonInsert.status}` : "skipped"
);

// 5. The anon key cannot mark the order paid
const anonPaid = ANON
  ? await q(ANON, `orders?id=eq.${ID}`, { method: "PATCH", body: { status: "paid" } })
  : null;
const stillPending = await q(SERVICE, `orders?id=eq.${ID}&select=status`);
check(
  "anon key CANNOT mark an order paid",
  stillPending.body?.[0]?.status === "pending",
  `status is ${stillPending.body?.[0]?.status}`
);

// 6. Service role marks it paid, scoped to pending
const paid = await q(SERVICE, `orders?id=eq.${ID}&status=eq.pending`, {
  method: "PATCH",
  prefer: "return=representation",
  body: { status: "paid", pf_payment_id: "VERIFY-1", paid_at: new Date().toISOString() },
});
check("service role marks it paid", paid.ok && paid.body?.length === 1, `HTTP ${paid.status}`);

// 7. A repeat ITN is a no-op — the pending filter matches nothing the second time
const repeat = await q(SERVICE, `orders?id=eq.${ID}&status=eq.pending`, {
  method: "PATCH",
  prefer: "return=representation",
  body: { status: "paid", pf_payment_id: "VERIFY-2" },
});
check(
  "a duplicate ITN updates 0 rows (idempotent)",
  repeat.ok && repeat.body?.length === 0,
  `${repeat.body?.length} rows touched`
);

// 8. Two orders cannot share one PayFast payment id
const dup = await q(SERVICE, "orders", {
  method: "POST",
  body: {
    id: `${ID}-DUP`,
    amount_cents: 40000,
    product_id: "hoodie",
    product_name: "Hoodie",
    colour: "Black",
    size: "L",
    pf_payment_id: "VERIFY-1",
  },
});
check("pf_payment_id is unique across orders", !dup.ok, `HTTP ${dup.status}`);

// Clean up
await q(SERVICE, `orders?id=like.${ID}*`, { method: "DELETE" });
const left = await q(SERVICE, `orders?id=like.${ID}*&select=id`);
check("test rows cleaned up", Array.isArray(left.body) && left.body.length === 0);

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
process.exit(failures === 0 ? 0 : 1);
