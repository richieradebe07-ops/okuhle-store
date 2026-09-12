import { NextResponse } from "next/server";
import crypto from "crypto";
import { serviceQuery, supabaseConfigured, fromCents } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Order lookup for people without an account.
 *
 * WHAT THIS DELIBERATELY DOES NOT RETURN: the delivery address, the phone
 * number, the buyer's name, the email, or the PayFast reference. An order
 * number is a weak secret — it is printed on packaging and pasted into
 * WhatsApp — so what it unlocks has to be worth only as much as it protects.
 * Status, item and dates are enough to answer "where is my hoodie".
 *
 * Both the order number AND the matching email are required. One without the
 * other gets the same answer as nonsense: "no match". There is no message
 * that distinguishes "wrong email" from "no such order", because that
 * difference is exactly what an enumeration script is looking for.
 */

const NO_MATCH = "We can't find an order with that number and email address.";

type OrderRow = {
  id: string;
  created_at: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  amount_cents: number;
  product_name: string;
  colour: string;
  size: string;
  paid_at: string | null;
  buyer_email: string | null;
};

/** Case-insensitive, length-independent, and not short-circuiting on the first
 *  differing character — so response time doesn't hint at how close a guess was. */
function emailMatches(stored: string | null, supplied: string): boolean {
  if (!stored) return false;
  const a = crypto.createHash("sha256").update(stored.trim().toLowerCase()).digest();
  const b = crypto.createHash("sha256").update(supplied.trim().toLowerCase()).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Tight on purpose. A customer checks one order; a script checks thousands.
  const limit = rateLimit(`lookup:${ip}`, 8, 10 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many lookups from this connection. Wait ten minutes, or message us on WhatsApp with your order number.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: { orderId?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim().toUpperCase() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!orderId || !email) {
    return NextResponse.json(
      { error: "We need both the order number and the email address on the order." },
      { status: 400 }
    );
  }
  // Our own format: OK-XXXXXX-YYYYYY. Rejecting anything else keeps junk out
  // of the query and out of the rate-limit budget.
  if (!/^OK-[A-Z0-9-]{4,40}$/.test(orderId)) {
    return NextResponse.json({ error: NO_MATCH }, { status: 404 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "Order lookup isn't available yet. Message us on WhatsApp with your order number." },
      { status: 503 }
    );
  }

  let rows: OrderRow[];
  try {
    rows = await serviceQuery<OrderRow[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=id,created_at,status,amount_cents,product_name,colour,size,paid_at,buyer_email&limit=1`
    );
  } catch (err) {
    console.error("[lookup] query failed:", err);
    return NextResponse.json({ error: "Couldn't check that just now. Try again shortly." }, { status: 502 });
  }

  const order = rows[0];
  if (!order || !emailMatches(order.buyer_email, email)) {
    return NextResponse.json({ error: NO_MATCH }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      placedAt: order.created_at,
      paidAt: order.paid_at,
      item: `${order.product_name} — ${order.colour}, size ${order.size}`,
      amount: fromCents(order.amount_cents),
    },
  });
}
