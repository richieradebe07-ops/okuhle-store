import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, LoadFailure, Stat, StatGrid, formatDate } from "@/components/AccountBits";
import { RewardsProgress } from "@/components/RewardsProgress";
import { requireSession } from "@/lib/auth";
import { loadRewards, type RewardEvent } from "@/lib/account";
import { loyalty, pointsToNextReward } from "@/lib/loyalty";

export const metadata: Metadata = {
  title: "Your points",
  robots: { index: false, follow: false },
};

export default async function RewardsPage() {
  const session = await requireSession("/account/rewards");

  let rewards: { balance: number; events: RewardEvent[] } | null = null;
  try {
    rewards = await loadRewards(session.user.id, session.accessToken);
  } catch (err) {
    console.error("[account/rewards] load failed:", err);
  }

  if (!rewards) {
    return (
      <>
        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", margin: "0 0 1.5rem" }}>Your points</h1>
        <LoadFailure what="points" />
      </>
    );
  }

  const toNext = pointsToNextReward(rewards.balance);
  const redeemable = Math.floor(rewards.balance / loyalty.redeemPoints) * loyalty.redeemValueRand;

  return (
    <>
      <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", margin: "0 0 0.75rem" }}>Your points</h1>
      <p style={{ color: "var(--fg-muted)", margin: "0 0 2.5rem", maxWidth: "40rem" }}>
        One point for every R{loyalty.randPerPoint} you spend. {loyalty.redeemPoints} points is R
        {loyalty.redeemValueRand} off. Free, no fee, and nothing expires while you&apos;re
        ordering — points lapse after {loyalty.expiryMonths} months of no activity, which is stated
        in the{" "}
        <Link href="/terms" style={{ color: "var(--accent)" }}>
          terms
        </Link>{" "}
        rather than hidden in them.
      </p>

      <StatGrid>
        <Stat value={String(rewards.balance)} label="Points" />
        <Stat
          value={redeemable > 0 ? `R${redeemable}` : "R0"}
          label="Ready to use"
          detail={redeemable > 0 ? "Mention it when you order." : undefined}
        />
        <Stat
          value={toNext > 0 ? String(toNext) : "0"}
          label="To your next R100"
          detail={toNext > 0 ? `R${toNext * loyalty.randPerPoint} more of spending.` : "You're there."}
        />
      </StatGrid>

      <div style={{ marginTop: "clamp(2rem, 5vw, 3rem)" }}>
        <RewardsProgress balance={rewards.balance} />
      </div>

      <div style={{ marginTop: "clamp(2.5rem, 6vw, 4rem)" }}>
        <h2 style={{ fontSize: "1.4rem", margin: "0 0 1.25rem" }}>Every point, accounted for</h2>

        {rewards.events.length === 0 ? (
          <EmptyState title="No points yet" cta={{ href: "/shop", label: "Browse the collection" }}>
            Points land when a payment clears, not when a checkout starts — so an order you
            didn&apos;t finish never shows up here.
          </EmptyState>
        ) : (
          <div className="card" style={{ padding: "0.5rem 1.5rem" }}>
            {rewards.events.map((event, i) => (
              <div
                key={`${event.createdAt}-${i}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1.1rem 0",
                  borderBottom:
                    i === rewards.events.length - 1 ? "none" : "1px solid var(--line)",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>{event.reason}</p>
                  <p style={{ color: "var(--fg-muted)", margin: "0.3rem 0 0", fontSize: "0.8rem" }}>
                    {formatDate(event.createdAt)}
                  </p>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    color: event.points > 0 ? "var(--accent)" : "var(--fg-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.points > 0 ? `+${event.points}` : event.points}
                </p>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: "var(--fg-muted)", marginTop: "1.5rem", fontSize: "0.82rem" }}>
          Your balance is added up from this list every time you load the page, rather than stored
          as a number somewhere — so what you see here always matches what actually happened.
        </p>
      </div>
    </>
  );
}
