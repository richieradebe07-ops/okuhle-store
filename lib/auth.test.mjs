/**
 * Auth unit tests. Run with:
 *
 *   node --test --experimental-strip-types lib/auth.test.mjs
 *
 * These import the REAL modules rather than re-implementing them, so a change
 * to the rules breaks the test instead of quietly drifting from it.
 *
 * What they cover: the password policy, JWT expiry reading, the rate limiter's
 * window behaviour, and the ladder's ordering. What they cannot cover from
 * here: anything that talks to Supabase — that is what scripts/verify-auth.mjs
 * is for, run locally against the real project.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_PASSWORD_LENGTH,
  isEmail,
  normaliseEmail,
  passwordProblem,
} from "./auth-rules.ts";
import { accessTokenExpiry, needsRefresh } from "./auth-tokens.ts";
import { rateLimit } from "./rateLimit.ts";
import { resolveState } from "./ladder.ts";

/* ---------------------------- password rules ---------------------------- */

test("a password shorter than the minimum is rejected", () => {
  const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
  assert.match(passwordProblem(short) ?? "", /at least 10 characters/i);
});

test("a long passphrase is accepted", () => {
  assert.equal(passwordProblem("beautifully bold streetwear"), null);
});

test("the email's local part cannot be reused as the password", () => {
  assert.match(
    passwordProblem("thabomokoena123", "thabomokoena@example.com") ?? "",
    /email address in your password/i
  );
});

test("a short local part does not trigger a false positive", () => {
  // "abc" is too short to be a meaningful signal; flagging it would reject
  // perfectly good passwords.
  assert.equal(passwordProblem("abcdefghijkl", "abc@example.com"), null);
});

test("an all-digit password is rejected however long", () => {
  assert.match(passwordProblem("19820419820419") ?? "", /all digits/i);
});

test("a password beyond the hash limit is rejected rather than silently truncated", () => {
  assert.match(passwordProblem("x".repeat(73)) ?? "", /72 characters/i);
});

/* ------------------------------- email ---------------------------------- */

test("emails are normalised to lower case and trimmed", () => {
  assert.equal(normaliseEmail("  Thabo@Example.COM "), "thabo@example.com");
});

test("email validation accepts real addresses and rejects junk", () => {
  assert.ok(isEmail("ohy.okuhle@gmail.com"));
  assert.ok(!isEmail("not an email"));
  assert.ok(!isEmail("missing@domain"));
  assert.ok(!isEmail(""));
  assert.ok(!isEmail(undefined));
});

/* ------------------------------- tokens --------------------------------- */

function fakeJwt(exp) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64({ exp, sub: "abc" })}.signature`;
}

test("the expiry is read out of a JWT payload", () => {
  assert.equal(accessTokenExpiry(fakeJwt(1893456000)), 1893456000);
});

test("a malformed token reads as no expiry", () => {
  assert.equal(accessTokenExpiry("not.a.jwt"), null);
  assert.equal(accessTokenExpiry("onlyonepart"), null);
});

test("a missing token needs a refresh", () => {
  assert.equal(needsRefresh(undefined), true);
});

test("an unreadable token needs a refresh rather than being trusted", () => {
  assert.equal(needsRefresh("garbage"), true);
});

test("a token expiring inside the skew window needs a refresh", () => {
  const inOneMinute = Math.floor(Date.now() / 1000) + 60;
  assert.equal(needsRefresh(fakeJwt(inOneMinute), 120), true);
});

test("a token with plenty of life left is left alone", () => {
  const inAnHour = Math.floor(Date.now() / 1000) + 3600;
  assert.equal(needsRefresh(fakeJwt(inAnHour), 120), false);
});

test("an already expired token needs a refresh", () => {
  const anHourAgo = Math.floor(Date.now() / 1000) - 3600;
  assert.equal(needsRefresh(fakeJwt(anHourAgo)), true);
});

/* ----------------------------- rate limiting ---------------------------- */

test("requests are allowed up to the limit and blocked after it", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 3; i++) {
    assert.equal(rateLimit(key, 3, 60).allowed, true, `request ${i + 1} should pass`);
  }
  const blocked = rateLimit(key, 3, 60);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter > 0, "a blocked caller is told when to come back");
});

test("separate keys have separate budgets", () => {
  const a = `test-a-${Math.random()}`;
  const b = `test-b-${Math.random()}`;
  rateLimit(a, 1, 60);
  assert.equal(rateLimit(a, 1, 60).allowed, false);
  assert.equal(rateLimit(b, 1, 60).allowed, true);
});

test("the window resets once it has elapsed", async () => {
  const key = `test-window-${Math.random()}`;
  assert.equal(rateLimit(key, 1, 1).allowed, true);
  assert.equal(rateLimit(key, 1, 1).allowed, false);
  await new Promise((r) => setTimeout(r, 1100));
  assert.equal(rateLimit(key, 1, 1).allowed, true, "a new window starts clean");
});

/* ------------------------------- the ladder ----------------------------- */

test("a stranger is anonymous", () => {
  assert.equal(resolveState({ signedIn: false, subscribed: false, paidOrders: 0 }), "anonymous");
});

test("an account with no orders sits above the mailing list", () => {
  assert.equal(resolveState({ signedIn: true, subscribed: false, paidOrders: 0 }), "account");
});

test("one paid order makes a customer, two make a repeat customer", () => {
  assert.equal(resolveState({ signedIn: true, subscribed: true, paidOrders: 1 }), "customer");
  assert.equal(resolveState({ signedIn: true, subscribed: true, paidOrders: 2 }), "repeat");
});

test("paid orders outrank simply having an account", () => {
  // A guest who later signed in still gets credit for what they bought.
  assert.equal(resolveState({ signedIn: true, subscribed: false, paidOrders: 5 }), "repeat");
});
