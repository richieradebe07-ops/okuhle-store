/**
 * Review logic. Run with:
 *
 *   node --test --experimental-strip-types lib/reviews.test.mjs
 *
 * Covers the parts that decide what the public sees: how averages are worked
 * out, and who is allowed to moderate. Anything that talks to the database is
 * covered by the constraint checks in migration 0003 instead.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { summariseRatings, isOwnerEmail } from "./reviews-shared.ts";

const row = (product_id, rating, verified_purchase = false) => ({
  product_id,
  rating,
  verified_purchase,
});

/* ----------------------------- averages ----------------------------- */

test("a single review is its own average", () => {
  const s = summariseRatings([row("hoodie", 5)]);
  assert.deepEqual(s.hoodie, { average: 5, count: 1, verified: 0 });
});

test("averages keep one decimal place rather than rounding to a whole star", () => {
  // 4 + 5 + 4 + 5 + 4 = 22 / 5 = 4.4 — must not present as 4.
  const s = summariseRatings([
    row("hoodie", 4),
    row("hoodie", 5),
    row("hoodie", 4),
    row("hoodie", 5),
    row("hoodie", 4),
  ]);
  assert.equal(s.hoodie.average, 4.4);
  assert.equal(s.hoodie.count, 5);
});

test("a recurring decimal is rounded, not left long", () => {
  // 5 + 4 + 4 = 13 / 3 = 4.333…
  const s = summariseRatings([row("tee", 5), row("tee", 4), row("tee", 4)]);
  assert.equal(s.tee.average, 4.3);
});

test("products are kept apart", () => {
  const s = summariseRatings([row("hoodie", 5), row("tee", 1)]);
  assert.equal(s.hoodie.average, 5);
  assert.equal(s.tee.average, 1);
});

test("verified buyers are counted separately from the total", () => {
  const s = summariseRatings([row("hoodie", 5, true), row("hoodie", 3, false)]);
  assert.equal(s.hoodie.count, 2);
  assert.equal(s.hoodie.verified, 1);
  assert.equal(s.hoodie.average, 4);
});

test("an unrated comment does not drag an average down", () => {
  // The null must be skipped, not treated as a zero.
  const s = summariseRatings([row("hoodie", 5), row("hoodie", null)]);
  assert.equal(s.hoodie.average, 5);
  assert.equal(s.hoodie.count, 1);
});

test("brand comments carry no product and are ignored entirely", () => {
  const s = summariseRatings([row(null, 5), row(null, null)]);
  assert.deepEqual(s, {});
});

test("no reviews means no summary, not a zero score", () => {
  // A product with no reviews must be absent, so the UI can say "no reviews
  // yet" rather than displaying 0 stars.
  assert.deepEqual(summariseRatings([]), {});
});

/* ---------------------------- moderation ---------------------------- */

test("the owner is recognised regardless of case or stray whitespace", () => {
  process.env.OWNER_EMAIL = "  OHY.Okuhle@gmail.com ";
  assert.equal(isOwnerEmail("ohy.okuhle@gmail.com"), true);
  assert.equal(isOwnerEmail("  OHY.OKUHLE@GMAIL.COM  "), true);
});

test("nobody else is the owner", () => {
  process.env.OWNER_EMAIL = "ohy.okuhle@gmail.com";
  assert.equal(isOwnerEmail("someone.else@example.com"), false);
  assert.equal(isOwnerEmail(null), false);
  assert.equal(isOwnerEmail(undefined), false);
  assert.equal(isOwnerEmail(""), false);
});

test("with no OWNER_EMAIL configured, nobody is the owner", () => {
  // Fails closed: an unset env var must not make everyone a moderator.
  delete process.env.OWNER_EMAIL;
  assert.equal(isOwnerEmail("ohy.okuhle@gmail.com"), false);
  assert.equal(isOwnerEmail("anyone@example.com"), false);
});

test("an empty OWNER_EMAIL does not match an empty submitted email", () => {
  process.env.OWNER_EMAIL = "   ";
  assert.equal(isOwnerEmail(""), false);
  assert.equal(isOwnerEmail("   "), false);
});
