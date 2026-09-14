/**
 * Loyalty programme math. Run with:
 *
 *   node --test --experimental-strip-types lib/loyalty.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { pointsFor, pointsToNextReward, layByMonthly } from "./loyalty.ts";

/* ------------------------------ pointsFor ------------------------------ */

test("a point is earned per R100, rounded down", () => {
  assert.equal(pointsFor(0), 0);
  assert.equal(pointsFor(99), 0);
  assert.equal(pointsFor(100), 1);
  assert.equal(pointsFor(250), 2);
  assert.equal(pointsFor(1000), 10);
});

/* -------------------------- pointsToNextReward -------------------------- */

test("a brand-new account needs the full 10 points, not 0", () => {
  // Plain modulo arithmetic gives 0 here, which would falsely read as
  // "reward ready" for a customer who has never earned a point.
  assert.equal(pointsToNextReward(0), 10);
});

test("a negative balance is treated the same as zero", () => {
  assert.equal(pointsToNextReward(-5), 10);
});

test("counts down within a cycle", () => {
  assert.equal(pointsToNextReward(3), 7);
  assert.equal(pointsToNextReward(9), 1);
});

test("a balance that is an exact multiple of 10 is reward-ready", () => {
  assert.equal(pointsToNextReward(10), 0);
  assert.equal(pointsToNextReward(20), 0);
});

test("counts down within the second cycle the same way as the first", () => {
  assert.equal(pointsToNextReward(15), 5);
  assert.equal(pointsToNextReward(23), 7);
});

/* ------------------------------ layByMonthly ------------------------------ */

test("lay-by instalments round up to a whole rand", () => {
  assert.equal(layByMonthly(300, 3), 100);
  assert.equal(layByMonthly(100, 3), 34);
});
