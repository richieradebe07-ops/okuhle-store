"use client";

import { useEffect, useState } from "react";
import { loyalty, pointsToNextReward } from "@/lib/loyalty";

/**
 * Segmented loyalty progress bar — one block per point toward the next R100
 * reward. Fills on mount rather than being server-rendered already-full, so
 * the motion itself reads as "here's what just happened to your balance."
 * The global prefers-reduced-motion rule in app/globals.css zeroes both the
 * duration and the delay of every transition, so the per-segment stagger
 * below collapses to ~0 for that setting — nothing extra needed here.
 *
 * Reads redeemPoints/redeemValueRand/randPerPoint from lib/loyalty directly
 * rather than taking them as props, so there is exactly one place — not two
 * that have to be kept in sync — that knows the redemption thresholds.
 */
export function RewardsProgress({ balance }: { balance: number }) {
  const { redeemPoints, redeemValueRand, randPerPoint } = loyalty;
  const toNext = pointsToNextReward(balance);
  const filled = redeemPoints - toNext;
  const ready = toNext === 0;
  const percent = Math.round((filled / redeemPoints) * 100);

  const [animateIn, setAnimateIn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const displayedFilled = animateIn ? filled : 0;
  const displayedPercent = animateIn ? percent : 0;

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <p style={{ margin: 0, fontSize: "1.05rem" }}>
          {ready ? "Your next R" + redeemValueRand + " off is ready" : "Progress to your next R" + redeemValueRand + " off"}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display, inherit)",
            fontSize: "1.4rem",
            color: "var(--accent)",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-hidden="true"
        >
          {displayedPercent}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={redeemPoints}
        aria-valuenow={filled}
        aria-label={`${filled} of ${redeemPoints} points toward your next R${redeemValueRand} off`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${redeemPoints}, 1fr)`,
          gap: "0.3rem",
        }}
      >
        {Array.from({ length: redeemPoints }, (_, i) => {
          const isFilled = i < displayedFilled;
          return (
            <div
              key={i}
              style={{
                height: "0.6rem",
                borderRadius: "999px",
                background: isFilled ? "var(--accent)" : "var(--bg-sunken)",
                border: "1px solid var(--line)",
                transition: `background 0.45s ease ${i * 0.04}s`,
              }}
            />
          );
        })}
      </div>

      <p style={{ color: "var(--fg-muted)", margin: "1rem 0 0", fontSize: "0.85rem" }}>
        {ready
          ? "Mention it when you order — nothing to redeem online yet."
          : `${toNext} more point${toNext === 1 ? "" : "s"} — R${toNext * randPerPoint} of spending — gets you there.`}
      </p>
    </div>
  );
}
