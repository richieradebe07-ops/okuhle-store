/**
 * Supabase Auth (GoTrue) over REST — server side only.
 *
 * WHY THE ADMIN API RATHER THAN THE PUBLIC SIGNUP ENDPOINT
 * Supabase's own signup and recovery endpoints send their own email through
 * whatever SMTP the project is configured with — by default a shared sender
 * capped at a couple of messages an hour, which would quietly break signups on
 * a busy day. `admin/generate_link` creates the user (or the recovery token)
 * and hands back the link WITHOUT sending anything, so the email goes out
 * through Resend using the templates in lib/emails.ts: one sender, one domain,
 * one set of copy, one place to look when something doesn't arrive.
 *
 * That means signup and password reset need SUPABASE_SERVICE_ROLE_KEY. Login,
 * refresh and reading the current user only need the anon key.
 *
 * THE TOKENS LIVE IN httpOnly COOKIES. JavaScript on the page cannot read
 * them, so an XSS bug cannot walk off with a session. `okuhle_signedin` is
 * readable but grants nothing — it only saves the client a pointless /api/me
 * call when nobody is logged in.
 */
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { cache } from "react";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  HINT_COOKIE,
  REFRESH_COOKIE,
  refreshTokens,
  type SessionTokens,
} from "./auth-tokens";
import { supabaseConfig } from "./supabase";
import { MIN_PASSWORD_LENGTH, isEmail, normaliseEmail, passwordProblem } from "./auth-rules";

export { ACCESS_COOKIE, HINT_COOKIE, REFRESH_COOKIE };
// Re-exported so route handlers have one import for everything auth.
export { MIN_PASSWORD_LENGTH, isEmail, normaliseEmail, passwordProblem };

/** Signup and password reset need the service key; login does not. */
export function authConfigured() {
  const { url, anonKey } = supabaseConfig();
  return Boolean(url && anonKey);
}

export function adminAuthConfigured() {
  const { url, anonKey, serviceKey } = supabaseConfig();
  return Boolean(url && anonKey && serviceKey);
}

export type AuthUser = {
  id: string;
  email: string;
  /** Null until they confirm the link we emailed them. */
  emailConfirmedAt: string | null;
  firstName: string | null;
  createdAt: string;
};

type GoTrueUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
};

function toAuthUser(u: GoTrueUser): AuthUser {
  const first = u.user_metadata?.first_name;
  return {
    id: u.id,
    email: u.email ?? "",
    emailConfirmedAt: u.email_confirmed_at ?? u.confirmed_at ?? null,
    firstName: typeof first === "string" && first.trim() ? first.trim() : null,
    createdAt: u.created_at ?? "",
  };
}

type GoTrueOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** A user's access token — the request then acts as that user. */
  token?: string;
  /** Use the service-role key. Admin endpoints only. */
  admin?: boolean;
};

type GoTrueResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; code?: string };

async function gotrue<T>(
  path: string,
  { method = "GET", body, token, admin = false }: GoTrueOptions = {}
): Promise<GoTrueResult<T>> {
  const { url, anonKey, serviceKey } = supabaseConfig();
  if (!url || !anonKey) {
    return { ok: false, status: 503, error: "Supabase Auth is not configured." };
  }
  if (admin && !serviceKey) {
    return { ok: false, status: 503, error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
  }
  if (typeof window !== "undefined") {
    throw new Error("lib/auth.ts must never run in the browser");
  }

  const apikey = admin ? serviceKey : anonKey;
  const bearer = token ?? apikey;

  let res: Response;
  try {
    res = await fetch(`${url}/auth/v1/${path}`, {
      method,
      headers: {
        apikey,
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[auth] network failure calling", path, err);
    return { ok: false, status: 502, error: "Could not reach the accounts service." };
  }

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const body = (parsed ?? {}) as { msg?: string; message?: string; error_code?: string; code?: string };
    return {
      ok: false,
      status: res.status,
      error: body.msg || body.message || `Auth request failed (${res.status})`,
      code: body.error_code || body.code,
    };
  }

  return { ok: true, status: res.status, data: parsed as T };
}

/* ------------------------------------------------------------------ */
/* Sign in / sign out                                                 */
/* ------------------------------------------------------------------ */

export type SignInOutcome =
  | { ok: true; tokens: SessionTokens; user: AuthUser }
  | { ok: false; reason: "credentials" | "unconfirmed" | "unavailable"; message: string };

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInOutcome> {
  const res = await gotrue<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: GoTrueUser;
  }>("token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });

  if (!res.ok) {
    if (res.status === 503 || res.status === 502) {
      return { ok: false, reason: "unavailable", message: res.error };
    }
    // GoTrue distinguishes "not confirmed" from "wrong password"; tell the
    // user which, because one of them they can fix themselves.
    if (res.code === "email_not_confirmed" || /not confirmed/i.test(res.error)) {
      return {
        ok: false,
        reason: "unconfirmed",
        message: "Confirm your email address first — check your inbox for the link we sent.",
      };
    }
    return {
      ok: false,
      reason: "credentials",
      message: "That email and password don't match.",
    };
  }

  return {
    ok: true,
    tokens: {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresIn: res.data.expires_in ?? 3600,
    },
    user: toAuthUser(res.data.user),
  };
}

export async function signOutEverywhere(accessToken: string): Promise<void> {
  // Best effort: the cookies are cleared regardless, so a failure here only
  // means the refresh token stays valid until it expires on Supabase's side.
  await gotrue("logout", { method: "POST", token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Signup                                                             */
/* ------------------------------------------------------------------ */

export type CreateUserOutcome =
  | { ok: true; userId: string; confirmationLink: string }
  | { ok: false; reason: "duplicate" | "weak" | "invalid" | "unavailable"; message: string };

/**
 * Creates the account and returns the confirmation link without emailing it.
 * The caller sends it through Resend.
 */
export async function createUserWithConfirmationLink(input: {
  email: string;
  password: string;
  firstName?: string;
  redirectTo: string;
}): Promise<CreateUserOutcome> {
  const res = await gotrue<{ id?: string; action_link?: string; user?: GoTrueUser }>(
    "admin/generate_link",
    {
      method: "POST",
      admin: true,
      body: {
        type: "signup",
        email: input.email,
        password: input.password,
        redirect_to: input.redirectTo,
        data: input.firstName ? { first_name: input.firstName } : {},
      },
    }
  );

  if (!res.ok) {
    if (res.status === 503 || res.status === 502) {
      return { ok: false, reason: "unavailable", message: res.error };
    }
    if (
      res.code === "email_exists" ||
      res.code === "user_already_exists" ||
      /already (been )?registered|already exists/i.test(res.error)
    ) {
      return { ok: false, reason: "duplicate", message: res.error };
    }
    if (res.code === "weak_password" || /password/i.test(res.error)) {
      return { ok: false, reason: "weak", message: res.error };
    }
    console.error("[auth] generate_link(signup) failed:", res.status, res.error);
    return { ok: false, reason: "invalid", message: res.error };
  }

  const userId = res.data.id ?? res.data.user?.id;
  const link = res.data.action_link;
  if (!userId || !link) {
    console.error("[auth] generate_link(signup) returned no id/action_link");
    return { ok: false, reason: "unavailable", message: "Accounts service returned an unexpected response." };
  }
  return { ok: true, userId, confirmationLink: link };
}

/* ------------------------------------------------------------------ */
/* Password reset                                                     */
/* ------------------------------------------------------------------ */

/**
 * Recovery link for an existing account, or null when there is no such
 * account. Callers MUST respond identically either way — whether an address
 * has an account here is not something a stranger gets to find out.
 */
export async function generateRecoveryLink(input: {
  email: string;
  redirectTo: string;
}): Promise<string | null> {
  const res = await gotrue<{ action_link?: string }>("admin/generate_link", {
    method: "POST",
    admin: true,
    body: { type: "recovery", email: input.email, redirect_to: input.redirectTo },
  });

  if (!res.ok) {
    // 4xx here is overwhelmingly "no such user", which is not an error worth
    // shouting about. Anything else is.
    if (res.status >= 500 || res.status === 503) {
      console.error("[auth] generate_link(recovery) failed:", res.status, res.error);
    }
    return null;
  }
  return res.data.action_link ?? null;
}

/**
 * Sets a new password using the short-lived session the recovery link grants.
 * Returns fresh tokens so the visitor lands signed in rather than at a login
 * form typing the password they just chose.
 */
export async function updatePasswordWithRecoverySession(input: {
  accessToken: string;
  refreshToken: string;
  password: string;
}): Promise<{ ok: true; tokens: SessionTokens; user: AuthUser } | { ok: false; message: string }> {
  const res = await gotrue<GoTrueUser>("user", {
    method: "PUT",
    token: input.accessToken,
    body: { password: input.password },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "That reset link has expired or has already been used. Ask for a new one.",
      };
    }
    return { ok: false, message: res.error };
  }

  // The password change invalidates other sessions, so mint a clean pair.
  const { url, anonKey } = supabaseConfig();
  const refreshed = await refreshTokens(url, anonKey, input.refreshToken);
  const tokens: SessionTokens = refreshed ?? {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresIn: 3600,
  };

  return { ok: true, tokens, user: toAuthUser(res.data) };
}

export async function changePassword(
  accessToken: string,
  password: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await gotrue<GoTrueUser>("user", {
    method: "PUT",
    token: accessToken,
    body: { password },
  });
  return res.ok ? { ok: true } : { ok: false, message: res.error };
}

/* ------------------------------------------------------------------ */
/* Reading the current user                                           */
/* ------------------------------------------------------------------ */

/**
 * Asks Supabase who this access token belongs to.
 *
 * Deliberately a round trip rather than decoding the JWT locally: decoding
 * tells you what the token CLAIMS, not whether it is genuine, unexpired or
 * un-revoked. `cache` collapses repeat calls within one request.
 */
export const userFromAccessToken = cache(async (accessToken: string): Promise<AuthUser | null> => {
  const res = await gotrue<GoTrueUser>("user", { token: accessToken });
  return res.ok ? toAuthUser(res.data) : null;
});

export type Session = { user: AuthUser; accessToken: string };

/**
 * The signed-in user for this request, or null.
 *
 * Does NOT refresh — middleware handles that before the request arrives, so
 * this stays a pure read and can be called from server components (which
 * cannot set cookies).
 */
export const currentSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  const user = await userFromAccessToken(accessToken);
  return user ? { user, accessToken } : null;
});

export async function currentUser(): Promise<AuthUser | null> {
  return (await currentSession())?.user ?? null;
}

/** Guards the /account pages. Sends visitors back where they were heading. */
export async function requireSession(returnTo: string): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}

/* ------------------------------------------------------------------ */
/* Admin: deletion                                                    */
/* ------------------------------------------------------------------ */

/**
 * Deletes the auth user. The schema decides what happens to their rows:
 * orders keep their record with user_id nulled (tax law, 5 years), consent
 * records survive with user_id nulled (the audit trail is the point), and
 * rewards and memberships cascade away with the account.
 */
export async function deleteAuthUser(userId: string): Promise<{ ok: boolean; message?: string }> {
  const res = await gotrue(`admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    admin: true,
  });
  return res.ok ? { ok: true } : { ok: false, message: res.error };
}

/* ------------------------------------------------------------------ */
/* Cookies                                                            */
/* ------------------------------------------------------------------ */

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function sessionCookieOptions(secure = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };
}

/** Applies a session to a response. Used by the auth route handlers. */
export function applySessionCookies(response: NextResponse, tokens: SessionTokens) {
  const base = sessionCookieOptions();
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    ...base,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
  // Client-readable hint. Not httpOnly by design; carries no authority.
  response.cookies.set({
    name: HINT_COOKIE,
    value: "1",
    httpOnly: false,
    secure: base.secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearSessionCookies(response: NextResponse) {
  const base = sessionCookieOptions();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set({ name, value: "", ...base, maxAge: 0 });
  }
  response.cookies.set({
    name: HINT_COOKIE,
    value: "",
    httpOnly: false,
    secure: base.secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  });
}

