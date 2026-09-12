import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  HINT_COOKIE,
  REFRESH_COOKIE,
  needsRefresh,
  refreshTokens,
} from "@/lib/auth-tokens";

/**
 * Keeps the session alive, and keeps the account pages private.
 *
 * Supabase access tokens last an hour. Server components can READ cookies but
 * cannot SET them, so the refresh has to happen before the page renders —
 * which is exactly what middleware is for. The refreshed pair is written onto
 * both the response (so the browser keeps it) and the incoming request (so
 * the page being rendered right now sees the new token, not the stale one).
 *
 * Refresh tokens are single use and rotate on every exchange, so failing to
 * store the new one silently ends the session an hour later. That is the bug
 * this file exists to not have.
 */

const PAGE_PREFIX = "/account";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const isPage = request.nextUrl.pathname.startsWith(PAGE_PREFIX);

  const signInRedirect = () => {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    const res = NextResponse.redirect(login);
    // Clear the client-side hint too, or the page keeps asking /api/me about
    // a session that no longer exists.
    res.cookies.set({ name: HINT_COOKIE, value: "", path: "/", maxAge: 0 });
    return res;
  };

  // Nothing to work with: send visitors to the login page, and let API
  // handlers answer 401 for themselves.
  if (!accessToken && !refreshToken) {
    return isPage ? signInRedirect() : NextResponse.next();
  }

  if (!needsRefresh(accessToken) || !refreshToken || !url || !anonKey) {
    return NextResponse.next();
  }

  const refreshed = await refreshTokens(url, anonKey, refreshToken);

  if (!refreshed) {
    // The refresh token is spent or revoked — the session is genuinely over.
    const res = isPage ? signInRedirect() : NextResponse.next();
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
      res.cookies.set({ name, value: "", httpOnly: true, path: "/", maxAge: 0 });
    }
    res.cookies.set({ name: HINT_COOKIE, value: "", path: "/", maxAge: 0 });
    return res;
  }

  // Make the in-flight request see the fresh token.
  request.cookies.set(ACCESS_COOKIE, refreshed.accessToken);
  request.cookies.set(REFRESH_COOKIE, refreshed.refreshToken);

  const response = NextResponse.next({ request });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: refreshed.accessToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshed.expiresIn,
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshed.refreshToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/api/account/:path*",
    "/api/me",
    // Not a protected route — but an expired token here would quietly drop a
    // signed-in customer to guest checkout and cost them their points.
    "/api/checkout",
  ],
};
