/**
 * Okuhle+ — R299 for the year, paid once.
 *
 * Not a subscription: there is no recurring billing and nothing auto-renews.
 * The member actively renews, which is why a reminder goes out 14 days before
 * expiry rather than a silent charge.
 *
 * The offer leads with access, not discount. That is deliberate — at 12% off, a
 * member has to spend about R2,500 in a year for the discount alone to cover
 * the R299, which is more than most people buy. The member-only colourways,
 * guaranteed allocation and 48-hour head start are the actual product.
 */
export const membership = {
  name: "Okuhle+",
  priceRand: 299,
  termMonths: 12,
  /** Modest on purpose. The annual fee cannot fund more than this. */
  discountPercent: 12,
  /**
   * Free delivery kicks in at this order value. NOT unlimited: at roughly R70
   * a shipment, unlimited delivery costs more than the whole fee after about
   * four orders and makes every active member unprofitable.
   */
  freeDeliveryThresholdRand: 500,
  earlyAccessHours: 48,
  memberColourwaysPerYear: 4,
  renewalReminderDaysBefore: 14,
} as const;

/** R299/year shown as a monthly figure — R299 reads as a commitment, R25 reads as nothing. */
export function monthlyEquivalent() {
  return Math.round(membership.priceRand / membership.termMonths);
}

/** Spend needed before the discount alone repays the fee. Honest number, used in the FAQ. */
export function discountBreakEvenRand() {
  return Math.round(membership.priceRand / (membership.discountPercent / 100));
}

export type MembershipStatus = "active" | "expired";

export type Membership = {
  userId: string;
  /** Sequential, permanent, never reused — even after expiry. */
  memberNumber: number;
  status: MembershipStatus;
  purchasedAt: string;
  expiresAt: string;
  pricePaid: number;
  /** Renewing members keep the price they joined at when the price rises. */
  priceLocked: boolean;
  /** Ships with their first order, not separately, to save a shipment. */
  welcomePackSent: boolean;
};

export function expiryFrom(purchasedAt: Date): Date {
  const expiry = new Date(purchasedAt);
  expiry.setMonth(expiry.getMonth() + membership.termMonths);
  return expiry;
}

/**
 * Member benefits apply only while active AND unexpired. Both conditions are
 * checked — a stale `status` field must never be enough on its own.
 */
export function isActive(m: Membership | null, now: Date = new Date()): boolean {
  if (!m) return false;
  return m.status === "active" && new Date(m.expiresAt) > now;
}

/** Price a member pays. Rounded to whole rand. Non-members pay list. */
export function memberPrice(listPriceRand: number): number {
  return Math.round(listPriceRand * (1 - membership.discountPercent / 100));
}

export function priceFor(listPriceRand: number, m: Membership | null, now?: Date): number {
  return isActive(m, now) ? memberPrice(listPriceRand) : listPriceRand;
}

/** Members get free delivery at and above the threshold; below it they pay. */
export function qualifiesForFreeDelivery(
  orderTotalRand: number,
  m: Membership | null,
  now?: Date
): boolean {
  return isActive(m, now) && orderTotalRand >= membership.freeDeliveryThresholdRand;
}

/** How far a member is from free delivery, or null when they already qualify. */
export function amountToFreeDelivery(orderTotalRand: number): number | null {
  const short = membership.freeDeliveryThresholdRand - orderTotalRand;
  return short > 0 ? short : null;
}

export function needsRenewalReminder(m: Membership, now: Date = new Date()): boolean {
  if (m.status !== "active") return false;
  const expiry = new Date(m.expiresAt);
  if (expiry <= now) return false;
  const daysLeft = (expiry.getTime() - now.getTime()) / 86_400_000;
  return daysLeft <= membership.renewalReminderDaysBefore;
}

/** Benefits, ordered for the pricing page: access first, discount last. */
export const memberBenefits = [
  "Member-only pieces the public can't buy — a new one every quarter",
  "You never miss a drop — guaranteed allocation on limited releases",
  "48-hour early access to everything",
  "Your numbered member card",
  "Direct line to the founder in the members' group",
  "A say in what we make next",
  "Priority production, free size exchanges",
  `${membership.discountPercent}% off everything, free delivery over R${membership.freeDeliveryThresholdRand}`,
] as const;
