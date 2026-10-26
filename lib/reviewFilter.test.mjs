/**
 * The automated review filter. Run with:
 *
 *   node --test --experimental-strip-types lib/reviewFilter.test.mjs
 *
 * Covers each of the five checks in Part C independently, plus that a clean
 * review trips none of them — the fast path that is meant to be the common
 * case.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { runReviewFilter, isDuplicate, wordOverlap, normaliseForComparison } from "./reviewFilter.ts";

const base = {
  body: "Fit true to size and the fabric held up after a few washes. Would buy again.",
  rating: 4,
  existingBodies: [],
  honeypot: "",
  msSincePageLoad: 45_000,
};

test("a clean, normal review trips nothing and publishes immediately", () => {
  const result = runReviewFilter(base);
  assert.deepEqual(result, { flagged: false, reason: null });
});

/* ------------------------------- links ------------------------------- */

test("a review containing a URL is flagged, not rejected", () => {
  const result = runReviewFilter({ ...base, body: "Great fit! Check out my page https://spam.example/x" });
  assert.equal(result.flagged, true);
  assert.equal(result.reason, "contains a link");
});

test("a bare domain with no protocol is still caught", () => {
  const result = runReviewFilter({ ...base, body: "Nice tee, see more deals at cheapdeals.shop today" });
  assert.equal(result.flagged, true);
  assert.equal(result.reason, "contains a link");
});

test("a www. link is caught", () => {
  const result = runReviewFilter({ ...base, body: "Loved it, more reviews at www.example.com right here" });
  assert.equal(result.flagged, true);
});

/* ------------------------------ profanity ----------------------------- */

test("profanity is flagged with the matched word in the reason, owner-only", () => {
  const result = runReviewFilter({ ...base, body: "This is a shit product honestly, do not buy it at all" });
  assert.equal(result.flagged, true);
  assert.equal(result.reason, "profanity match: shit");
});

/* ------------------------------ duplicates ----------------------------- */

test("exact duplicate content is flagged", () => {
  const text = "This hoodie is amazing quality and fits perfectly every single time I wear it";
  const result = runReviewFilter({ ...base, body: text, existingBodies: [text] });
  assert.equal(result.flagged, true);
  assert.equal(result.reason, "duplicate or near-duplicate content");
});

test("duplicate detection ignores case and punctuation", () => {
  const original = "Great fit, true to size, and the fabric is thick and holds up well over time.";
  const resubmitted = "GREAT FIT TRUE TO SIZE AND THE FABRIC IS THICK AND HOLDS UP WELL OVER TIME";
  const result = runReviewFilter({ ...base, body: resubmitted, existingBodies: [original] });
  assert.equal(result.flagged, true);
});

test("near-duplicate (one word changed) is still caught", () => {
  const original = "Fit true to size and the fabric held up nicely after several washes, would buy again";
  const nearCopy = "Fit true to size and the fabric held up nicely after several washes, will buy again";
  const result = runReviewFilter({ ...base, body: nearCopy, existingBodies: [original] });
  assert.equal(result.flagged, true);
});

test("two short, genuinely different reviews are not flagged as duplicates", () => {
  const result = runReviewFilter({
    ...base,
    body: "Runs a size small, order up.",
    existingBodies: ["Comfortable and warm, true to size."],
  });
  assert.equal(result.flagged, false);
});

test("wordOverlap and normaliseForComparison are exported and behave sanely", () => {
  assert.equal(normaliseForComparison("Hello,  World!!"), "hello world");
  assert.equal(wordOverlap("same words here", "same words here"), 1);
  assert.equal(wordOverlap("completely different text", "nothing alike whatsoever"), 0);
});

/* ------------------------------ honeypot ------------------------------- */

test("a filled honeypot field is flagged regardless of how clean the rest looks", () => {
  const result = runReviewFilter({ ...base, honeypot: "http://bot-filled-this-in.example" });
  assert.equal(result.flagged, true);
  assert.equal(result.reason, "honeypot field filled");
});

test("an empty or whitespace-only honeypot is not flagged", () => {
  assert.equal(runReviewFilter({ ...base, honeypot: "" }).flagged, false);
  assert.equal(runReviewFilter({ ...base, honeypot: "   " }).flagged, false);
});

/* ---------------------------- bot timing -------------------------------- */

test("a short, generic 5-star review submitted within seconds of page load is flagged", () => {
  const result = runReviewFilter({
    ...base,
    rating: 5,
    body: "Great product nice",
    msSincePageLoad: 1200,
  });
  assert.equal(result.flagged, true);
  assert.match(result.reason, /within seconds/);
});

test("the same fast submission with a longer body is not flagged on timing alone", () => {
  const result = runReviewFilter({
    ...base,
    rating: 5,
    body: "Great product, fits true to size and the stitching looks solid even after a wash.",
    msSincePageLoad: 1200,
  });
  assert.equal(result.flagged, false);
});

test("a slow, short 5-star review (a genuine quick thumbs-up) is not flagged", () => {
  const result = runReviewFilter({
    ...base,
    rating: 5,
    body: "Great product nice",
    msSincePageLoad: 120_000,
  });
  assert.equal(result.flagged, false);
});

test("no page-load timestamp (form sent without one) never trips the timing check", () => {
  const result = runReviewFilter({ ...base, rating: 5, body: "Great product nice", msSincePageLoad: null });
  assert.equal(result.flagged, false);
});

/* ------------------------- first match wins ----------------------------- */

test("when several checks would match, the first one in order is reported", () => {
  // Honeypot is checked before links — confirm the order is deterministic
  // rather than incidental, since the owner reads flagged_reason as the truth.
  const result = runReviewFilter({ ...base, honeypot: "filled", body: "check https://spam.example" });
  assert.equal(result.reason, "honeypot field filled");
});
