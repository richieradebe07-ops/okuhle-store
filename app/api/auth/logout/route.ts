import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, clearSessionCookies, signOutEverywhere } from "@/lib/auth";

/**
 * Sign out.
 *
 * The cookies are cleared whatever happens upstream — a visitor tapping "log
 * out" must end up logged out of this browser even if Supabase is
 * unreachable. Revoking the refresh token on Supabase's side is attempted
 * first so the session cannot be resurrected elsewhere.
 */
export async function POST() {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      await signOutEverywhere(accessToken);
    } catch (err) {
      console.warn("[logout] token revocation failed; clearing cookies anyway:", err);
    }
  }

  const response = NextResponse.json({ message: "Signed out." });
  clearSessionCookies(response);
  return response;
}
