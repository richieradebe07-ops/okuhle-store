/**
 * Signature tests. Run with: node --test lib/payfast.test.mjs
 *
 * These pin the encoding and ordering rules, which are where PayFast
 * integrations usually break. They do NOT prove PayFast accepts the result —
 * only a sandbox transaction proves that.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Mirrors lib/payfast.ts. Kept in sync deliberately so the test exercises the
// rules rather than importing the TypeScript build output.
function payfastEncode(value) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

function signatureString(fields, passphrase) {
  const parts = fields
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${k}=${payfastEncode(String(v).trim())}`);
  if (passphrase && passphrase.trim() !== "") {
    parts.push(`passphrase=${payfastEncode(passphrase.trim())}`);
  }
  return parts.join("&");
}

const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");

test("spaces encode as +, not %20", () => {
  assert.equal(payfastEncode("Golf Tee"), "Golf+Tee");
});

test("percent escapes are uppercase", () => {
  assert.equal(payfastEncode("a@b.co.za"), "a%40b.co.za");
  assert.equal(payfastEncode("R270 — paid"), "R270+%E2%80%94+paid");
});

test("empty values are omitted entirely", () => {
  const s = signatureString([
    ["merchant_id", "10000100"],
    ["name_first", ""],
    ["amount", "270.00"],
  ]);
  assert.equal(s, "merchant_id=10000100&amount=270.00");
});

test("field order is preserved, not sorted", () => {
  const s = signatureString([
    ["b", "2"],
    ["a", "1"],
  ]);
  assert.equal(s, "b=2&a=1");
});

test("passphrase is appended last and encoded", () => {
  const s = signatureString([["amount", "270.00"]], "my pass phrase");
  assert.equal(s, "amount=270.00&passphrase=my+pass+phrase");
});

test("no passphrase means no passphrase field", () => {
  assert.equal(signatureString([["amount", "270.00"]], ""), "amount=270.00");
  assert.equal(signatureString([["amount", "270.00"]], undefined), "amount=270.00");
});

test("signature changes when the passphrase changes", () => {
  const fields = [["amount", "270.00"]];
  assert.notEqual(md5(signatureString(fields, "a")), md5(signatureString(fields, "b")));
});

test("amount is always two decimal places", () => {
  assert.equal((270).toFixed(2), "270.00");
  assert.equal((400).toFixed(2), "400.00");
  assert.equal((133.333).toFixed(2), "133.33");
});

test("ITN signature verification is order-sensitive", () => {
  const arrived = [
    ["m_payment_id", "OK-123"],
    ["amount_gross", "270.00"],
  ];
  const shuffled = [
    ["amount_gross", "270.00"],
    ["m_payment_id", "OK-123"],
  ];
  assert.notEqual(md5(signatureString(arrived)), md5(signatureString(shuffled)));
});
