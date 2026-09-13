import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, LoadFailure, formatDate, statusLabel } from "@/components/AccountBits";
import { requireSession } from "@/lib/auth";
import { loadOrders, type AccountOrder } from "@/lib/account";
import { formatRand, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const session = await requireSession("/account/orders");

  let orders: AccountOrder[] | null = null;
  try {
    orders = await loadOrders(session.user.id, session.accessToken);
  } catch (err) {
    console.error("[account/orders] load failed:", err);
  }

  return (
    <>
      <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", margin: "0 0 0.75rem" }}>Your orders</h1>
      <p style={{ color: "var(--fg-muted)", margin: "0 0 2.5rem", maxWidth: "40rem" }}>
        Orders you placed while signed in. Anything you bought as a guest or arranged on WhatsApp
        won&apos;t be listed here — those are{" "}
        <Link href="/track" style={{ color: "var(--accent)" }}>
          looked up by order number
        </Link>
        .
      </p>

      {!orders ? (
        <LoadFailure what="orders" />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" cta={{ href: "/shop", label: "Browse the collection" }}>
          Everything is made to order, in your colour and size.
        </EmptyState>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "1.05rem" }}>
                    {order.productName} — {order.colour}, size {order.size}
                  </p>
                  <p style={{ color: "var(--fg-muted)", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                    {order.id} · placed {formatDate(order.createdAt)}
                    {order.paidAt && ` · paid ${formatDate(order.paidAt)}`}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "1.05rem" }}>{formatRand(order.amount)}</p>
                  {order.delivery > 0 && (
                    <p
                      style={{ color: "var(--fg-muted)", margin: "0.3rem 0 0", fontSize: "0.78rem" }}
                    >
                      incl. {formatRand(order.delivery)} delivery
                    </p>
                  )}
                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      fontSize: "0.72rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: order.status === "paid" ? "var(--accent)" : "var(--fg-muted)",
                    }}
                  >
                    {statusLabel(order.status)}
                  </p>
                </div>
              </div>

              {order.pointsAwarded > 0 && (
                <p style={{ color: "var(--fg-muted)", margin: "1rem 0 0", fontSize: "0.82rem" }}>
                  Earned {order.pointsAwarded} {order.pointsAwarded === 1 ? "point" : "points"}.
                </p>
              )}

              <p
                style={{
                  margin: "1rem 0 0",
                  fontSize: "0.85rem",
                  display: "flex",
                  gap: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                {/* Only on paid orders — there is nothing to review until the
                    piece has actually been made and sent. */}
                {order.status === "paid" && (
                  <Link href={`/shop/${order.productId}#reviews`} style={{ color: "var(--accent)" }}>
                    Review the {order.productName}
                  </Link>
                )}
                <a
                  href={whatsappLink(`Hi ${site.name}, I'm asking about order ${order.id}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Ask about this order on WhatsApp
                </a>
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
