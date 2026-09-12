/**
 * Money and eligibility logic. Run: node --test lib/membership.test.mjs
 *
 * These are the rules that cost real money if they're wrong, so they're pinned:
 * the 12% discount, the R500 delivery threshold boundary, and the rule that an
 * expired member gets nothing even if their status field still says "active".
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const DISCOUNT = 12;
const THRESHOLD = 500;
const TERM_MONTHS = 12;
const PRICE = 299;

const memberPrice = (list) => Math.round(list * (1 - DISCOUNT / 100));
const isActive = (m, now) => !!m && m.status === "active" && new Date(m.expiresAt) > now;
const qualifiesForFreeDelivery = (total, m, now) => isActive(m, now) && total >= THRESHOLD;

const active = { status: "active", expiresAt: "2027-01-01T00:00:00Z" };
const lapsed = { status: "active", expiresAt: "2026-01-01T00:00:00Z" }; // stale status
const cancelled = { status: "expired", expiresAt: "2027-01-01T00:00:00Z" };
const NOW = new Date("2026-09-12T00:00:00Z");

test("member price is 12% off, rounded to whole rand", () => {
  assert.equal(memberPrice(210), 185); // 184.8
  assert.equal(memberPrice(270), 238); // 237.6
  assert.equal(memberPrice(360), 317); // 316.8
  assert.equal(memberPrice(400), 352); // exact
});

test("non-members pay list price", () => {
  const priceFor = (list, m) => (isActive(m, NOW) ? memberPrice(list) : list);
  assert.equal(priceFor(400, null), 400);
  assert.equal(priceFor(400, active), 352);
});

test("an expired membership gets nothing, even if status still says active", () => {
  assert.equal(isActive(lapsed, NOW), false);
  assert.equal(qualifiesForFreeDelivery(900, lapsed, NOW), false);
});

test("an explicitly expired membership gets nothing despite a future expiry", () => {
  assert.equal(isActive(cancelled, NOW), false);
});

test("free delivery triggers AT R500, not below", () => {
  assert.equal(qualifiesForFreeDelivery(499.99, active, NOW), false);
  assert.equal(qualifiesForFreeDelivery(500, active, NOW), true);
  assert.equal(qualifiesForFreeDelivery(500.01, active, NOW), true);
});

test("free delivery never applies to non-members, however large the order", () => {
  assert.equal(qualifiesForFreeDelivery(5000, null, NOW), false);
});

test("expiry is one year after purchase", () => {
  const purchased = new Date("2026-11-27T10:00:00Z");
  const expiry = new Date(purchased);
  expiry.setMonth(expiry.getMonth() + TERM_MONTHS);
  assert.equal(expiry.toISOString().slice(0, 10), "2027-11-27");
});

test("monthly equivalent of R299 is R25", () => {
  assert.equal(Math.round(PRICE / TERM_MONTHS), 25);
});

test("discount break-even is about R2,500 of spend", () => {
  const breakEven = Math.round(PRICE / (DISCOUNT / 100));
  assert.equal(breakEven, 2492);
  // Sanity: that is well above a few items a year, which is why the offer
  // leads with access rather than the discount.
  assert.ok(breakEven > 400 * 4);
});

test("renewal reminder fires inside 14 days, not before", () => {
  const needs = (expiresAt, now) => {
    const days = (new Date(expiresAt) - now) / 86_400_000;
    return days > 0 && days <= 14;
  };
  assert.equal(needs("2026-09-20T00:00:00Z", NOW), true); // 8 days out
  assert.equal(needs("2026-10-20T00:00:00Z", NOW), false); // 38 days out
  assert.equal(needs("2026-09-01T00:00:00Z", NOW), false); // already expired
});
