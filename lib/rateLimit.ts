/**
 * Fixed-window rate limiting, in memory.
 *
 * Used to blunt credential stuffing on /api/auth/* and order-number
 * enumeration on /api/orders/lookup.
 *
 * HONEST LIMITATION: this counts per server process. On serverless hosting
 * (Netlify, Vercel) a burst spread across N warm instances gets roughly N
 * times the allowance, and a cold start resets the window. That makes it a
 * speed bump, not a wall — good enough to stop a script walking order numbers
 * from one laptop, not good enough to stop a distributed attack. A shared
 * store (Upstash Redis, or a Postgres table) is the fix when that matters;
 * see docs/auth-setup.md.
 */

type Window = { count: number; resetAt: number };

const globalForLimits = globalThis as unknown as {
  __okuhleLimits?: Map<string, Window>;
};

function store() {
  if (!globalForLimits.__okuhleLimits) globalForLimits.__okuhleLimits = new Map();
  return globalForLimits.__okuhleLimits;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. Sent as Retry-After when blocked. */
  retryAfter: number;
};

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const map = store();

  // Opportunistic cleanup so a long-lived process doesn't grow unbounded.
  if (map.size > 5000) {
    for (const [k, w] of map) if (w.resetAt <= now) map.delete(k);
  }

  const existing = map.get(key);
  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count++;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfter };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfter };
}

/**
 * Best-effort client IP.
 *
 * Trusts `x-forwarded-for` because Netlify and Vercel both set it and strip
 * any client-supplied value at the edge. Behind a proxy that does NOT strip
 * it, a caller can spoof this header and sidestep the limit — which is why
 * nothing security-critical depends on the IP alone, only rate limiting and
 * the POPIA consent audit trail.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** An inet-safe value for consent_records.ip_address, or null. */
export function ipForAudit(request: Request): string | null {
  const ip = clientIp(request);
  if (ip === "unknown") return null;
  // Postgres `inet` rejects anything that isn't an address; be conservative.
  const looksLikeIp = /^[0-9a-fA-F:.]+$/.test(ip) && ip.length <= 45;
  return looksLikeIp ? ip : null;
}
