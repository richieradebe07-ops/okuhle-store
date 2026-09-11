/**
 * Drops — time-boxed limited editions layered on top of the always-available
 * base catalogue.
 *
 * The base range (Golf Tee, T-Shirt, Baggy Tee, Sweater, Hoodie in standard
 * colours) is never part of a drop. Drops are limited colourways, collabs and
 * numbered runs only.
 *
 * Every scarcity signal here is derived from real data: status comes from the
 * clock, and remaining units come from `unitsSold`, which must be populated
 * from actual orders. A drop with `limitedQuantity: null` is unlimited and
 * renders no counter. Nothing invents a number.
 */
export type DropStatus = "upcoming" | "live" | "closed" | "sold_out";

export type Drop = {
  slug: string;
  name: string;
  description: string;
  opensAt: string;
  closesAt: string;
  /** null = unlimited. A number here means a real, honoured cap. */
  limitedQuantity: number | null;
  /** Real orders only. Until checkout is live this stays 0 and no counter shows. */
  unitsSold: number;
  /** Product ids from the catalogue included in this drop. */
  productIds: string[];
  heroImage?: string;
  gallery?: string[];
};

/**
 * No drops are configured yet — Drop 001's contents are still an open question
 * for the founder. Adding one here is a data edit, not a code change.
 */
export const drops: Drop[] = [];

export function dropStatus(drop: Drop, now: Date = new Date()): DropStatus {
  if (drop.limitedQuantity !== null && drop.unitsSold >= drop.limitedQuantity) {
    return "sold_out";
  }
  if (now < new Date(drop.opensAt)) return "upcoming";
  if (now > new Date(drop.closesAt)) return "closed";
  return "live";
}

/** Units left, or null when the drop is unlimited (so no counter is rendered). */
export function unitsRemaining(drop: Drop) {
  if (drop.limitedQuantity === null) return null;
  return Math.max(0, drop.limitedQuantity - drop.unitsSold);
}

export function getDrop(slug: string) {
  return drops.find((d) => d.slug === slug);
}

/** Closed drops stay published — a visible history of things that really did sell out. */
export function archivedDrops(now: Date = new Date()) {
  return drops.filter((d) => ["closed", "sold_out"].includes(dropStatus(d, now)));
}

export function activeDrops(now: Date = new Date()) {
  return drops.filter((d) => ["upcoming", "live"].includes(dropStatus(d, now)));
}

/** Waitlist counts below this look worse than showing nothing. */
export const WAITLIST_VISIBILITY_THRESHOLD = 25;

export function waitlistLabel(count: number | null) {
  if (count === null || count < WAITLIST_VISIBILITY_THRESHOLD) return null;
  return `${count.toLocaleString("en-ZA")} people waiting`;
}
