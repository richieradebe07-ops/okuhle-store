import crypto from "crypto";

/**
 * PayFast integration primitives.
 *
 * PayFast is used rather than Stripe because Stripe does not pay out to South
 * African bank accounts. PayFast settles in ZAR and supports the local payment
 * methods (card, Instant EFT, SnapScan, Zapper).
 *
 * The signature rules are fiddly and getting them wrong is the single most
 * common integration failure, so they live here in one place with tests:
 *   - Values are URL-encoded the way PHP's urlencode() does it: spaces become
 *     "+", and percent-escapes are UPPERCASE.
 *   - Empty values are omitted entirely.
 *   - Field ORDER matters, and differs between the two directions:
 *       outgoing (checkout) → PayFast's prescribed field order
 *       incoming (ITN)      → the order the fields actually arrived in
 *   - The passphrase, when set, is appended last as &passphrase=...
 */

export type PayFastMode = "sandbox" | "live";

export function payfastMode(): PayFastMode {
  return process.env.PAYFAST_SANDBOX === "false" ? "live" : "sandbox";
}

export function processUrl() {
  return payfastMode() === "live"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";
}

export function validateUrl() {
  return payfastMode() === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";
}

/** Hostnames PayFast sends ITNs from. Resolved at request time — the IPs change. */
export const PAYFAST_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
];

export function payfastConfig() {
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID ?? "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY ?? "",
    passphrase: process.env.PAYFAST_PASSPHRASE ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };
}

/** True once real credentials exist. Checkout UI stays hidden until then. */
export function payfastConfigured() {
  const { merchantId, merchantKey } = payfastConfig();
  return Boolean(merchantId && merchantKey);
}

/**
 * PHP urlencode() semantics, which is what PayFast signs against.
 * encodeURIComponent differs in three ways that all break the signature.
 */
export function payfastEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

/**
 * Build the string PayFast signs. Order is the caller's responsibility —
 * outgoing uses PayFast's prescribed order, incoming uses arrival order.
 */
export function signatureString(fields: [string, string][], passphrase?: string): string {
  const parts = fields
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${k}=${payfastEncode(String(v).trim())}`);

  if (passphrase && passphrase.trim() !== "") {
    parts.push(`passphrase=${payfastEncode(passphrase.trim())}`);
  }

  return parts.join("&");
}

export function signature(fields: [string, string][], passphrase?: string): string {
  return crypto.createHash("md5").update(signatureString(fields, passphrase)).digest("hex");
}

/** PayFast requires exactly two decimal places. */
export function formatAmount(rand: number): string {
  return rand.toFixed(2);
}

/** The order PayFast expects checkout fields in. Fields not set are skipped. */
const CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
] as const;

export type CheckoutInput = {
  /** Our own order reference. Comes back on the ITN as m_payment_id. */
  orderId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  buyer?: { firstName?: string; lastName?: string; email?: string; cell?: string };
};

/**
 * Returns the exact hidden fields to POST to PayFast, signature included.
 * Must only ever run server-side — the passphrase must not reach the browser.
 */
export function buildCheckoutFields(input: CheckoutInput): Record<string, string> {
  const { merchantId, merchantKey, passphrase, siteUrl } = payfastConfig();

  const raw: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${siteUrl}/order-confirmed?ref=${encodeURIComponent(input.orderId)}`,
    cancel_url: `${siteUrl}/order-cancelled?ref=${encodeURIComponent(input.orderId)}`,
    notify_url: `${siteUrl}/api/webhooks/payfast`,
    name_first: input.buyer?.firstName ?? "",
    name_last: input.buyer?.lastName ?? "",
    email_address: input.buyer?.email ?? "",
    cell_number: input.buyer?.cell ?? "",
    m_payment_id: input.orderId,
    amount: formatAmount(input.amount),
    item_name: input.itemName,
    item_description: input.itemDescription ?? "",
  };

  const ordered: [string, string][] = CHECKOUT_FIELD_ORDER.filter(
    (k) => raw[k] !== undefined && raw[k] !== ""
  ).map((k) => [k, raw[k]]);

  const fields = Object.fromEntries(ordered);
  fields.signature = signature(ordered, passphrase);
  return fields;
}

/**
 * Verify an ITN signature. `orderedPairs` must be in the order the fields
 * arrived in the request body, with `signature` itself excluded.
 */
export function verifyItnSignature(
  orderedPairs: [string, string][],
  received: string,
  passphrase?: string
): boolean {
  const expected = signature(orderedPairs, passphrase);
  const a = Buffer.from(expected);
  const b = Buffer.from((received ?? "").toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
