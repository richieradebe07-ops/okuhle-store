import { NextResponse } from "next/server";
import dns from "dns/promises";
import {
  PAYFAST_HOSTS,
  payfastConfig,
  validateUrl,
  verifyItnSignature,
} from "@/lib/payfast";
import { orderStore } from "@/lib/orders";
import { sendOrderConfirmation, sendOwnerOrderAlert } from "@/lib/emails";

/**
 * PayFast ITN (Instant Transaction Notification) handler.
 *
 * PayFast requires four independent checks before an ITN is trusted. All four
 * run here, and any failure means the payment is NOT recorded — an ITN is an
 * unauthenticated public POST, so skipping any of these lets anyone mark orders
 * as paid:
 *
 *   1. Signature matches, using the fields in the order they arrived
 *   2. The request actually came from a PayFast server
 *   3. The amount charged matches the amount we recorded for the order
 *   4. PayFast itself confirms the notification via server-to-server postback
 *
 * Always returns 200. PayFast retries on non-200, and retrying a rejected
 * forgery achieves nothing.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const params = new URLSearchParams(raw);

  // Preserve arrival order — the ITN signature depends on it.
  const pairs: [string, string][] = [];
  let received = "";
  for (const [key, value] of params.entries()) {
    if (key === "signature") {
      received = value;
      continue;
    }
    pairs.push([key, value]);
  }

  const data = Object.fromEntries(params.entries());
  const orderId = data.m_payment_id;
  const reject = (reason: string, extra?: unknown) => {
    console.error(`[payfast-itn] rejected (${reason})`, { orderId, extra });
    return NextResponse.json({ received: true }, { status: 200 });
  };

  // 1. Signature
  const { passphrase } = payfastConfig();
  if (!received || !verifyItnSignature(pairs, received, passphrase)) {
    return reject("bad signature");
  }

  // 2. Source
  if (!(await isFromPayFast(request))) {
    return reject("source ip not PayFast");
  }

  // 3. Amount — compared against what we recorded, never what was sent
  if (!orderId) return reject("no m_payment_id");
  const order = await orderStore().get(orderId);
  if (!order) return reject("unknown order");

  const paid = Number(data.amount_gross);
  if (!Number.isFinite(paid) || Math.abs(paid - order.amount) > 0.01) {
    return reject("amount mismatch", { expected: order.amount, got: data.amount_gross });
  }

  // 4. Ask PayFast to confirm it sent this
  if (!(await confirmWithPayFast(raw))) {
    return reject("postback validation failed");
  }

  switch (data.payment_status) {
    case "COMPLETE":
      // Idempotent: PayFast may deliver the same ITN more than once.
      if (order.status !== "paid") {
        await orderStore().markPaid(orderId, data.pf_payment_id ?? "");
        console.info(`[payfast-itn] order ${orderId} paid`);

        // Notifications are deliberately AFTER the order is recorded and are
        // never allowed to affect it. The customer has paid; if an email fails
        // that is a support problem, not a payment problem.
        const paidOrder = (await orderStore().get(orderId)) ?? order;
        const buyer = {
          name: [data.name_first, data.name_last].filter(Boolean).join(" ") || undefined,
          phone: data.cell_number || undefined,
        };

        const [confirmation, alert] = await Promise.allSettled([
          sendOrderConfirmation(paidOrder),
          sendOwnerOrderAlert(paidOrder, buyer),
        ]);

        for (const [what, result] of [
          ["customer confirmation", confirmation],
          ["owner alert", alert],
        ] as const) {
          if (result.status === "rejected") {
            console.error(`[payfast-itn] ${what} threw for ${orderId}`, result.reason);
          } else if (!result.value.ok) {
            console.error(`[payfast-itn] ${what} not sent for ${orderId}: ${result.value.error}`);
          }
        }
      }
      break;
    case "CANCELLED":
      await orderStore().markStatus(orderId, "cancelled");
      break;
    default:
      await orderStore().markStatus(orderId, "failed");
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/** Resolve PayFast's hostnames and check the caller is one of them. */
async function isFromPayFast(request: Request): Promise<boolean> {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const sourceIp = forwarded.split(",")[0].trim() || request.headers.get("x-nf-client-connection-ip");
  if (!sourceIp) return false;

  const resolved = await Promise.all(
    PAYFAST_HOSTS.map(async (host) => {
      try {
        const [v4, v6] = await Promise.all([
          dns.resolve4(host).catch(() => [] as string[]),
          dns.resolve6(host).catch(() => [] as string[]),
        ]);
        return [...v4, ...v6];
      } catch {
        return [] as string[];
      }
    })
  );

  return resolved.flat().includes(sourceIp);
}

/** Server-to-server postback: PayFast replies VALID or INVALID. */
async function confirmWithPayFast(rawBody: string): Promise<boolean> {
  try {
    const res = await fetch(validateUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = (await res.text()).trim();
    return text.startsWith("VALID");
  } catch (err) {
    console.error("[payfast-itn] postback error", err);
    return false;
  }
}
