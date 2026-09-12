import { NextResponse } from "next/server";
import { buildCheckoutFields, payfastConfigured, processUrl } from "@/lib/payfast";
import { orderStore, hasDurableOrderStore } from "@/lib/orders";
import { getProduct } from "@/lib/products";

/**
 * Starts a PayFast checkout.
 *
 * The price is looked up from our own catalogue rather than taken from the
 * request — otherwise anyone could POST their own amount and buy a hoodie for
 * R1. The signature is computed here so the passphrase never reaches the
 * browser.
 */
export async function POST(request: Request) {
  if (!payfastConfigured()) {
    return NextResponse.json(
      { error: "Card checkout isn't switched on yet. Order on WhatsApp and we'll sort you out." },
      { status: 503 }
    );
  }

  // Refuse real money until orders can actually be persisted — without a
  // durable store the ITN cannot verify the amount it was asked to confirm.
  if (!hasDurableOrderStore() && process.env.NODE_ENV === "production") {
    console.error("[checkout] blocked: no durable order store configured");
    return NextResponse.json(
      { error: "Checkout is not available right now. Please order on WhatsApp." },
      { status: 503 }
    );
  }

  let body: { productId?: unknown; colour?: unknown; size?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { productId, colour, size, email } = body;
  if (typeof productId !== "string" || typeof colour !== "string" || typeof size !== "string") {
    return NextResponse.json({ error: "Pick a colour and size first." }, { status: 400 });
  }

  const product = getProduct(productId);
  if (!product || !product.active) {
    return NextResponse.json({ error: "That item isn't available." }, { status: 404 });
  }
  if (!product.colors.some((c) => c.name === colour)) {
    return NextResponse.json({ error: "That colour isn't available." }, { status: 400 });
  }
  if (!product.sizes.includes(size)) {
    return NextResponse.json({ error: "That size isn't available." }, { status: 400 });
  }

  const order = await orderStore().create({
    amount: product.price,
    productId: product.id,
    productName: product.name,
    colour,
    size,
    buyerEmail: typeof email === "string" ? email : undefined,
  });

  const fields = buildCheckoutFields({
    orderId: order.id,
    amount: order.amount,
    itemName: `${product.name} — ${colour}, ${size}`,
    itemDescription: `${product.name} in ${colour}, size ${size}. Made to order by OKUHLE.`,
    buyer: { email: order.buyerEmail },
  });

  return NextResponse.json({ action: processUrl(), fields, orderId: order.id });
}
