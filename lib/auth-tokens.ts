/**
 * Token helpers shared between the Node runtime and the Edge middleware.
 *
 * Kept free of `next/headers`, `node:crypto` and anything else Edge cannot
 * load, so `middleware.ts` can import it directly.
 */

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  /** Seconds the access token is valid for, as reported by Supabase. */
  expiresIn: number;
};

export const ACCESS_COOKIE = "okuhle_at";
export const REFRESH_COOKIE = "okuhle_rt";
/**
 * Readable by JavaScript, on purpose, and worth nothing on its own.
 *
 * It grants no access — it only tells the client "there is probably a session,
 * so /api/me is worth calling". The real tokens stay httpOnly.
 */
export const HINT_COOKIE = "okuhle_signedin";

/**
 * Reads `exp` out of a JWT WITHOUT verifying the signature.
 *
 * Only ever used to decide whether to refresh. Authority over who the user is
 * comes from Supabase (`GET /auth/v1/user`), never from this.
 */
export function accessTokenExpiry(jwt: string): number | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload)
          .split("")
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join("")
      )
    );
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** True when the access token is missing, unreadable, or about to expire. */
export function needsRefresh(accessToken: string | undefined, skewSeconds = 120): boolean {
  if (!accessToken) return true;
  const exp = accessTokenExpiry(accessToken);
  if (exp === null) return true;
  return exp - skewSeconds <= Math.floor(Date.now() / 1000);
}

/**
 * Exchanges a refresh token for a fresh session.
 *
 * Supabase rotates refresh tokens, so the NEW refresh token must be stored or
 * the session dies at the next refresh.
 */
export async function refreshTokens(
  url: string,
  anonKey: string,
  refreshToken: string
): Promise<SessionTokens | null> {
  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!data.access_token || !data.refresh_token) return null;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in ?? 3600,
    };
  } catch {
    return null;
  }
}
