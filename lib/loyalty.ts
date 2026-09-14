/**
 * Free loyalty programme and lay-by framing.
 *
 * There is deliberately no paid membership tier. At any plausible purchase
 * frequency for this brand a monthly fee costs the customer more than it saves
 * them, so the rewards here are free with an account instead.
 */
export const loyalty = {
  /** Spend this much to earn one point. */
  randPerPoint: 100,
  /** Points needed to redeem. */
  redeemPoints: 10,
  /** Rand off when redeeming the above. */
  redeemValueRand: 100,
  /** Points lapse after this long with no account activity. Stated in the terms, not hidden. */
  expiryMonths: 12,
  perks: [
    "48-hour early access to new drops",
    "15% off one order during your birthday month",
    "First notification when a sold-out size is restocked",
    "Points on every order — no fee, no subscription",
  ],
} as const;

/** Points earned on an order of this value. Rounded down. */
export function pointsFor(amountRand: number) {
  return Math.floor(amountRand / loyalty.randPerPoint);
}

/**
 * How many more points until the next R100 reward.
 *
 * A brand-new account (balance 0) needs the full `redeemPoints`, not 0 — plain
 * modulo arithmetic gives 0 for that case, which would read as "reward ready."
 */
export function pointsToNextReward(balance: number) {
  if (balance <= 0) return loyalty.redeemPoints;
  const remainder = balance % loyalty.redeemPoints;
  return remainder === 0 ? 0 : loyalty.redeemPoints - remainder;
}

export const layBy = {
  months: 3,
  /** Lay-by is arranged over WhatsApp; nothing here bills anyone automatically. */
  note: "Pay it off over 3 months. No interest, no admin fee. Arranged on WhatsApp.",
} as const;

/** Monthly instalment for a lay-by, rounded up to whole rand. */
export function layByMonthly(priceRand: number, months: number = layBy.months) {
  return Math.ceil(priceRand / months);
}
