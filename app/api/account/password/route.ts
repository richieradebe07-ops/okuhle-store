import { NextResponse } from "next/server";
import {
  applySessionCookies,
  changePassword,
  currentSession,
  passwordProblem,
  signInWithPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Change password while signed in.
 *
 * The current password is re-checked even though the session is already
 * valid. A borrowed laptop with a live session should not be enough to lock
 * the owner out of their own account.
 */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const limit = rateLimit(`pwchange:${session.user.id}:${clientIp(request)}`, 5, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
    return NextResponse.json({ error: "Enter both passwords." }, { status: 400 });
  }

  const issue = passwordProblem(body.newPassword, session.user.email);
  if (issue) return NextResponse.json({ error: issue }, { status: 400 });

  const reauth = await signInWithPassword(session.user.email, body.currentPassword);
  if (!reauth.ok) {
    return NextResponse.json({ error: "That's not your current password." }, { status: 401 });
  }

  const changed = await changePassword(reauth.tokens.accessToken, body.newPassword);
  if (!changed.ok) {
    return NextResponse.json({ error: changed.message ?? "Couldn't change it." }, { status: 400 });
  }

  // The change invalidates the old tokens, so replace this browser's session
  // with the one just minted — otherwise the next click logs them out.
  const response = NextResponse.json({ message: "Password changed." });
  applySessionCookies(response, reauth.tokens);
  return response;
}
