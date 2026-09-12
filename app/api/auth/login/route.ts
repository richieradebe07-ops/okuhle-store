import { NextResponse } from "next/server";
import {
  applySessionCookies,
  authConfigured,
  isEmail,
  normaliseEmail,
  signInWithPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Sign in.
 *
 * Limited two ways on purpose: per IP, which slows one machine trying many
 * accounts, and per email, which slows many machines trying one account.
 * Neither is a wall — see the note in lib/rateLimit.ts — but both cost an
 * attacker more than they cost a customer who mistypes a password.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);

  if (!authConfigured()) {
    return NextResponse.json(
      { error: "Accounts aren't switched on yet. Order on WhatsApp and we'll look after you." },
      { status: 503 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isEmail(body.email) || typeof body.password !== "string" || !body.password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const email = normaliseEmail(body.email);

  const perIp = rateLimit(`login:ip:${ip}`, 10, 15 * 60);
  const perEmail = rateLimit(`login:email:${email}`, 8, 15 * 60);
  if (!perIp.allowed || !perEmail.allowed) {
    const retryAfter = Math.max(perIp.retryAfter, perEmail.retryAfter);
    return NextResponse.json(
      {
        error:
          "Too many attempts. Wait a few minutes, or reset your password if you've forgotten it.",
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const result = await signInWithPassword(email, body.password);

  if (!result.ok) {
    if (result.reason === "unavailable") {
      return NextResponse.json({ error: result.message }, { status: 503 });
    }
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  const response = NextResponse.json({
    message: "Signed in.",
    user: { email: result.user.email, firstName: result.user.firstName },
  });
  applySessionCookies(response, result.tokens);
  return response;
}
