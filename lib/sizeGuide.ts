import type { CategoryId } from "./products";

export type SizeGuideRow = {
  size: string;
  chestCm: number;
  lengthCm: number;
  sleeveCm?: number;
};

export type SizeGuide = {
  rows: SizeGuideRow[];
  /** e.g. "Measured flat, garment laid out — not body measurements." */
  note?: string;
};

/**
 * Real garment measurements, by category. Empty until the owner supplies
 * actual numbers per size (see docs/... or the Part A note in the product
 * pages brief) — a size guide built from guessed numbers is worse than no
 * size guide at all on a made-to-order brand, so this stays empty rather
 * than shipping plausible-looking fiction.
 */
const sizeGuides: Partial<Record<CategoryId, SizeGuide>> = {};

export function sizeGuideFor(category: CategoryId): SizeGuide | null {
  return sizeGuides[category] ?? null;
}
