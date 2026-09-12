import { NextResponse } from "next/server";
import {
  applySessionCookies,
  passwordProblem,
  updatePasswordWithRecoverySession,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Finish a password reset.
 *
 * The tokens come from the recovery link's URL fragment, which only the
 * person who opened the emailed link has. They are posted here rather than
 * used in the browser so the new session ends up in httpOnly cookies like
 * every other session, instead of in JavaScript's reach.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`reset-finish:${clientIp(request)}`, 10, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Ask for a fresh reset link." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: { accessToken?: unknown; refreshToken?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.accessToken !== "string" || !body.accessToken) {
    return NextResponse.json(
      { error: "That link is missing its token. Open the link from the email again." },
      { status: 400 }
    );
  }
  if (typeof body.password !== "string") {
    return NextResponse.json({ error: "Choose a new password." }, { status: 400 });
  }
  const issue = passwordProblem(body.password);
  if (issue) return NextResponse.json({ error: issue }, { status: 400 });

  const result = await updatePasswordWithRecoverySession({
    accessToken: body.accessToken,
    refreshToken: typeof body.refreshToken === "string" ? body.refreshToken : "",
    password: body.password,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const response = NextResponse.json({ message: "Password changed. You're signed in." });
  applySessionCookies(response, result.tokens);
  return response;
}
