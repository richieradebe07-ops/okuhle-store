/**
 * Review logic with no imports, so it runs anywhere.
 *
 * Split out for two reasons: client components can take the types without
 * pulling lib/reviews.ts's server-only Supabase code anywhere near the
 * browser bundle, and `node --test` can import it directly to exercise the
 * real functions rather than a copy of them.
 */

/** How many reviews landed on each star value, 5 down to 1 — the Shein-style distribution bar. */
export type StarCounts = { 5: number; 4: number; 3: number; 2: number; 1: number };

export type RatingSummary = { average: number; count: number; verified: number; byStar: StarCounts };

function emptyStarCounts(): StarCounts {
  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
}

/**
 * Turns rated rows into per-product averages and star distributions.
 *
 * Rows with no rating are skipped rather than counted as zero: a comment left
 * without stars must not drag an average down.
 */
export function summariseRatings(
  rows: { product_id: string | null; rating: number | null; verified_purchase: boolean }[]
): Record<string, RatingSummary> {
  const totals: Record<string, { sum: number; count: number; verified: number; byStar: StarCounts }> = {};

  for (const row of rows) {
    if (!row.product_id || row.rating === null) continue;
    const t = (totals[row.product_id] ??= { sum: 0, count: 0, verified: 0, byStar: emptyStarCounts() });
    t.sum += row.rating;
    t.count += 1;
    if (row.verified_purchase) t.verified += 1;
    if (row.rating >= 1 && row.rating <= 5) {
      t.byStar[row.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([id, t]) => [
      id,
      {
        // One decimal place. Rounding to a whole star would turn 4.4 into 4.
        average: Math.round((t.sum / t.count) * 10) / 10,
        count: t.count,
        verified: t.verified,
        byStar: t.byStar,
      },
    ])
  );
}

/**
 * The owner is whoever signs in with OWNER_EMAIL.
 *
 * Deliberately not a database role: one person runs this shop, and that
 * address is already configured for order alerts. Comparison trims and
 * lowercases, because an address typed into a signup form and one pasted into
 * an env var differ in exactly those ways. Fails closed — with no OWNER_EMAIL
 * set, nobody is the owner.
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
  if (!owner || !email) return false;
  return email.trim().toLowerCase() === owner;
}
