/**
 * Verifies the live auth wiring end to end.
 *
 * Run this LOCALLY, not in CI, once the env vars are set:
 *
 *   node scripts/verify-auth.mjs
 *
 * It creates a throwaway account, signs in, proves RLS scopes reads to that
 * account, exercises the refresh and recovery flows, then deletes the user and
 * confirms what survived. Nothing is left behind except the consent row, which
 * is the point of the retention design and is cleaned up at the end too.
 *
 * WHY THIS SCRIPT EXISTS: the sandbox this code was written in cannot reach
 * *.supabase.co, so the HTTP layer was never exercised there. These are the
 * checks that close that gap. If one fails, the bug is real.
 */
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !ANON || !SERVICE) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const stamp = Date.now().toString(36);
const EMAIL = `verify-auth-${stamp}@example.invalid`;
const OTHER_EMAIL = `verify-other-${stamp}@example.invalid`;
const PASSWORD = `verify-passphrase-${stamp}`;
const ORDER_ID = `OK-AUTHVERIFY-${stamp.toUpperCase()}`;

let failures = 0;
const created = [];

function check(name, passed, detail = "") {
  console.log(`${passed ? "  ok  " : " FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!passed) failures++;
}

async function call(path, { method = "GET", body, key = ANON, token, base = "auth/v1" } = {}) {
  const res = await fetch(`${URL_}/${base}/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      "Content-Type": "application/json",
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

const rest = (path, opts = {}) => call(path, { ...opts, base: "rest/v1" });

console.log(`\nVerifying auth against ${URL_}\n`);

/* 1. generate_link creates the user and hands back a link without emailing */
const signup = await call("admin/generate_link", {
  method: "POST",
  key: SERVICE,
  body: {
    type: "signup",
    email: EMAIL,
    password: PASSWORD,
    redirect_to: "http://localhost:3000/login?confirmed=1",
    data: { first_name: "Verify" },
  },
});
const userId = signup.body?.id ?? signup.body?.user?.id;
if (userId) created.push(userId);
check(
  "admin/generate_link creates the account and returns a confirmation link",
  signup.ok && Boolean(userId) && Boolean(signup.body?.action_link),
  `HTTP ${signup.status}`
);

/* 2. the same address cannot be registered twice */
const duplicate = await call("admin/generate_link", {
  method: "POST",
  key: SERVICE,
  body: { type: "signup", email: EMAIL, password: PASSWORD },
});
check(
  "a second signup for the same address is refused (the API route answers generically)",
  !duplicate.ok,
  `HTTP ${duplicate.status}`
);

/* 3. confirm the address so sign-in is possible, the way the emailed link does */
if (userId) {
  await call(`admin/users/${userId}`, {
    method: "PUT",
    key: SERVICE,
    body: { email_confirm: true },
  });
}

/* 4. sign in with the password */
const signin = await call("token?grant_type=password", {
  method: "POST",
  body: { email: EMAIL, password: PASSWORD },
});
const access = signin.body?.access_token;
const refresh = signin.body?.refresh_token;
check("sign-in with the password returns a session", signin.ok && Boolean(access), `HTTP ${signin.status}`);

/* 5. the wrong password does not */
const wrong = await call("token?grant_type=password", {
  method: "POST",
  body: { email: EMAIL, password: "definitely-not-the-password" },
});
check("the wrong password is refused", !wrong.ok, `HTTP ${wrong.status}`);

/* 6. the access token identifies the right person */
const me = access ? await call("user", { token: access }) : null;
check(
  "the access token resolves to this account",
  Boolean(me?.ok) && me.body?.email === EMAIL,
  me ? `got ${me.body?.email}` : "no token"
);

/* 7. refresh rotates the tokens */
const refreshed = refresh
  ? await call("token?grant_type=refresh_token", { method: "POST", body: { refresh_token: refresh } })
  : null;
check(
  "a refresh returns a NEW refresh token (rotation — storing the old one kills the session)",
  Boolean(refreshed?.ok) && refreshed.body?.refresh_token && refreshed.body.refresh_token !== refresh,
  refreshed ? `HTTP ${refreshed.status}` : "no refresh token"
);

/* 8. the spent refresh token cannot be reused */
const replay = refresh
  ? await call("token?grant_type=refresh_token", { method: "POST", body: { refresh_token: refresh } })
  : null;
check("a spent refresh token is rejected on reuse", Boolean(replay) && !replay.ok, replay ? `HTTP ${replay.status}` : "skipped");

/* ---- RLS: the reason the account pages use the user's token, not the key ---- */

/* 9. seed an order for this user, and one for somebody else */
const otherSignup = await call("admin/generate_link", {
  method: "POST",
  key: SERVICE,
  body: { type: "signup", email: OTHER_EMAIL, password: `${PASSWORD}-other` },
});
const otherId = otherSignup.body?.id ?? otherSignup.body?.user?.id;
if (otherId) created.push(otherId);

const mineOrder = {
  id: ORDER_ID,
  amount_cents: 40000,
  product_id: "hoodie",
  product_name: "Hoodie",
  colour: "Black",
  size: "L",
  user_id: userId,
  buyer_email: EMAIL,
  status: "paid",
  paid_at: new Date().toISOString(),
};
const theirOrder = { ...mineOrder, id: `${ORDER_ID}-OTHER`, user_id: otherId, buyer_email: OTHER_EMAIL };

await rest("orders", { method: "POST", key: SERVICE, body: [mineOrder, theirOrder] });

/* 10. the customer sees their own order */
const ownRead = access
  ? await rest(`orders?select=id&order=id.asc`, { token: access })
  : null;
const ownIds = Array.isArray(ownRead?.body) ? ownRead.body.map((r) => r.id) : [];
check(
  "the customer's token reads their OWN order",
  ownIds.includes(ORDER_ID),
  `saw ${ownIds.length} row(s)`
);

/* 11. and nobody else's — with no user_id filter in the query at all */
check(
  "RLS hides the other customer's order even with no filter in the query",
  !ownIds.includes(`${ORDER_ID}-OTHER`),
  ownIds.join(", ") || "none"
);

/* 12. points land on the ledger and the balance view derives from it */
await rest("reward_events", {
  method: "POST",
  key: SERVICE,
  body: { user_id: userId, points: 4, reason: `Order ${ORDER_ID}`, order_id: ORDER_ID },
});
const duplicatePoints = await rest("reward_events", {
  method: "POST",
  key: SERVICE,
  body: { user_id: userId, points: 4, reason: "duplicate ITN", order_id: ORDER_ID },
});
check(
  "the same order cannot be awarded points twice (unique index, not app logic)",
  !duplicatePoints.ok,
  `HTTP ${duplicatePoints.status}`
);

const balance = access ? await rest(`reward_balances?select=balance`, { token: access }) : null;
check(
  "the balance view returns 4 points for this customer and only this customer",
  Array.isArray(balance?.body) && balance.body.length === 1 && balance.body[0].balance === 4,
  `got ${JSON.stringify(balance?.body)}`
);

/* 13. recovery link generation works for a real address */
const recovery = await call("admin/generate_link", {
  method: "POST",
  key: SERVICE,
  body: { type: "recovery", email: EMAIL, redirect_to: "http://localhost:3000/reset-password" },
});
check(
  "a recovery link is generated without sending an email",
  recovery.ok && Boolean(recovery.body?.action_link),
  `HTTP ${recovery.status}`
);

/* 14. and fails for an address with no account — which the route answers generically */
const noSuchUser = await call("admin/generate_link", {
  method: "POST",
  key: SERVICE,
  body: { type: "recovery", email: `nobody-${stamp}@example.invalid` },
});
check(
  "recovery for an unknown address fails upstream (the route still answers generically)",
  !noSuchUser.ok,
  `HTTP ${noSuchUser.status}`
);

/* 15. consent rows are written and readable by their owner only */
await rest("consent_records", {
  method: "POST",
  key: SERVICE,
  body: [
    { user_id: userId, email: EMAIL, kind: "terms", granted: true, document_version: "test", source: "verify" },
    { user_id: userId, email: EMAIL, kind: "marketing", granted: false, document_version: "test", source: "verify" },
  ],
});
const consentRead = access ? await rest("consent_records?select=kind,granted", { token: access }) : null;
check(
  "both consent rows are stored, including the DECLINED marketing one",
  Array.isArray(consentRead?.body) &&
    consentRead.body.length === 2 &&
    consentRead.body.some((r) => r.kind === "marketing" && r.granted === false),
  `got ${JSON.stringify(consentRead?.body)}`
);

/* ---- deletion: what goes and what stays ---- */

if (userId) {
  const deleted = await call(`admin/users/${userId}`, { method: "DELETE", key: SERVICE });
  check("the account is deleted", deleted.ok, `HTTP ${deleted.status}`);
}

const orderAfter = await rest(`orders?id=eq.${ORDER_ID}&select=id,user_id`, { key: SERVICE });
check(
  "the paid order SURVIVES deletion, with the account link removed (5-year tax retention)",
  orderAfter.body?.[0]?.id === ORDER_ID && orderAfter.body?.[0]?.user_id === null,
  JSON.stringify(orderAfter.body?.[0])
);

const consentAfter = await rest(
  `consent_records?email=eq.${encodeURIComponent(EMAIL)}&select=kind,user_id`,
  { key: SERVICE }
);
check(
  "the consent audit trail SURVIVES deletion, with the account link removed",
  Array.isArray(consentAfter.body) &&
    consentAfter.body.length === 2 &&
    consentAfter.body.every((r) => r.user_id === null),
  `${consentAfter.body?.length} row(s)`
);

const rewardsAfter = await rest(`reward_events?order_id=eq.${ORDER_ID}&select=id`, { key: SERVICE });
check(
  "the points ledger is GONE with the account",
  Array.isArray(rewardsAfter.body) && rewardsAfter.body.length === 0,
  `${rewardsAfter.body?.length} row(s) left`
);

const staleToken = access ? await call("user", { token: access }) : null;
check(
  "the deleted account's access token no longer resolves",
  Boolean(staleToken) && !staleToken.ok,
  staleToken ? `HTTP ${staleToken.status}` : "skipped"
);

/* ---- clean up ---- */

for (const id of created) {
  await call(`admin/users/${id}`, { method: "DELETE", key: SERVICE });
}
await rest(`consent_records?email=like.verify-*`, { method: "DELETE", key: SERVICE });
await rest(`orders?id=like.${ORDER_ID}*`, { method: "DELETE", key: SERVICE });

const leftoverOrders = await rest(`orders?id=like.OK-AUTHVERIFY-*&select=id`, { key: SERVICE });
const leftoverConsents = await rest(
  `consent_records?email=like.verify-*&select=id`,
  { key: SERVICE }
);
check(
  "every test row is cleaned up",
  leftoverOrders.body?.length === 0 && leftoverConsents.body?.length === 0,
  `${leftoverOrders.body?.length} orders, ${leftoverConsents.body?.length} consents`
);

console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
process.exit(failures === 0 ? 0 : 1);
