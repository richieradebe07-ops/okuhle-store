import type { Metadata } from "next";
import Link from "next/link";
import {
  EmptyState,
  LoadFailure,
  SectionTitle,
  Stat,
  StatGrid,
  formatDate,
  statusLabel,
} from "@/components/AccountBits";
import { requireSession } from "@/lib/auth";
import { loadAccount, type AccountSnapshot } from "@/lib/account";
import { rungFor, resolveState } from "@/lib/ladder";
import { loyalty, pointsToNextReward } from "@/lib/loyalty";
import { membership } from "@/lib/membership";
import { formatRand } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await requireSession("/account");

  let snapshot: AccountSnapshot | null = null;
  try {
    snapshot = await loadAccount(session.user.id, session.accessToken);
  } catch (err) {
    console.error("[account] load failed:", err);
  }

  const name = session.user.firstName;

  if (!snapshot) {
    return (
      <>
        <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.6rem)", margin: "0 0 1.5rem" }}>
          {name ? `Sawubona, ${name}` : "Your account"}
        </h1>
        <LoadFailure what="account" />
      </>
    );
  }

  const nextReward = pointsToNextReward(snapshot.points);
  // The same ladder the rest of the site uses, so the account page asks for
  // the next step rather than the biggest one.
  const rung = rungFor(
    resolveState({ signedIn: true, subscribed: true, paidOrders: snapshot.paidOrders.length })
  );
  const latest = snapshot.orders[0];

  return (
    <>
      <h1 style={{ fontSize: "clamp(1.9rem, 5vw, 2.6rem)", margin: 0 }}>
        {name ? `Sawubona, ${name}` : "Your account"}
      </h1>
      <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 2.5rem" }}>
        {session.user.email}
        {snapshot.memberActive && snapshot.membership && (
          <>
            {" · "}
            <span style={{ color: "var(--accent)" }}>
              {membership.name} member #{snapshot.membership.memberNumber}
            </span>
          </>
        )}
      </p>

      <StatGrid>
        <Stat
          value={String(snapshot.points)}
          label={snapshot.points === 1 ? "Point" : "Points"}
          detail={
            snapshot.points >= loyalty.redeemPoints
              ? `That's R${loyalty.redeemValueRand} off your next order.`
              : nextReward > 0
                ? `${nextReward} more for R${loyalty.redeemValueRand} off.`
                : undefined
          }
          href="/account/rewards"
        />
        <Stat
          value={String(snapshot.paidOrders.length)}
          label={snapshot.paidOrders.length === 1 ? "Order" : "Orders"}
          detail={snapshot.totalSpent > 0 ? `${formatRand(snapshot.totalSpent)} with us.` : undefined}
          href="/account/orders"
        />
        <Stat
          value={snapshot.memberActive ? "Active" : "Not yet"}
          label={membership.name}
          detail={
            snapshot.memberActive && snapshot.membership
              ? `Renews ${formatDate(snapshot.membership.expiresAt)}.`
              : `R${membership.priceRand} for the year.`
          }
          href="/okuhle-plus"
        />
      </StatGrid>

      <div style={{ marginTop: "clamp(2.5rem, 6vw, 4rem)" }}>
        <SectionTitle
          action={
            snapshot.orders.length > 0 ? (
              <Link href="/account/orders" style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
                All orders
              </Link>
            ) : undefined
          }
        >
          {latest ? "Your latest order" : "Your orders"}
        </SectionTitle>

        {latest ? (
          <div className="card" style={{ padding: "1.75rem" }}>
            <p style={{ margin: 0, fontSize: "1.1rem" }}>
              {latest.productName} — {latest.colour}, size {latest.size}
            </p>
            <p style={{ color: "var(--fg-muted)", margin: "0.6rem 0 0", fontSize: "0.9rem" }}>
              {latest.id} · {formatDate(latest.createdAt)} · {formatRand(latest.amount)}
            </p>
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.78rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: latest.status === "paid" ? "var(--accent)" : "var(--fg-muted)",
              }}
            >
              {statusLabel(latest.status)}
            </p>
            {latest.status === "paid" && (
              <p style={{ color: "var(--fg-muted)", margin: "1rem 0 0", fontSize: "0.88rem" }}>
                Everything is made to order — allow 2–3 working days before it ships. Your tracking
                number comes through on WhatsApp.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            title="Nothing here yet"
            cta={{ href: rung.href, label: rung.label }}
          >
            {rung.support ?? "Have a look at what's in the collection."}
          </EmptyState>
        )}
      </div>

      {snapshot.orders.length > 0 && (
        <div style={{ marginTop: "clamp(2.5rem, 6vw, 4rem)" }}>
          <SectionTitle>What next</SectionTitle>
          <div className="card" style={{ padding: "1.75rem" }}>
            <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.92rem" }}>
              {rung.support}
            </p>
            <Link className="btn" href={rung.href} style={{ marginTop: "1.25rem" }}>
              {rung.label}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
