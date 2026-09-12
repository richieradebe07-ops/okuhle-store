import { NextResponse } from "next/server";
import { adminAuthConfigured, generateRecoveryLink, isEmail, normaliseEmail } from "@/lib/auth";
import { sendPasswordReset } from "@/lib/emails";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/site";

/**
 * Start a password reset.
 *
 * Always answers the same thing. Whether an address has an account here is
 * not a stranger's business, and a "no such account" message is a free
 * customer list for anyone with a wordlist.
 */
const GENERIC_OK =
  "If that address has an account, a reset link is on its way. It's valid for one hour.";

export async function POST(request: Request) {
  const ip = clientIp(request);

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isEmail(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const email = normaliseEmail(body.email);

  // Both limits matter: per IP stops a script, per email stops someone
  // repeatedly mailbombing one person's inbox with reset requests.
  const perIp = rateLimit(`reset:ip:${ip}`, 5, 60 * 60);
  const perEmail = rateLimit(`reset:email:${email}`, 3, 60 * 60);
  if (!perIp.allowed || !perEmail.allowed) {
    // Still generic — a rate-limit message that only appears for real
    // addresses would leak exactly what the generic response protects.
    return NextResponse.json({ message: GENERIC_OK });
  }

  if (!adminAuthConfigured()) {
    return NextResponse.json(
      { error: "Password resets aren't available yet. Message us on WhatsApp." },
      { status: 503 }
    );
  }

  const base = siteUrl(request);
  const link = await generateRecoveryLink({
    email,
    redirectTo: `${base}/reset-password`,
  });

  if (link) {
    const sent = await sendPasswordReset({ email, resetUrl: link, expiresInMinutes: 60 });
    if (!sent.ok) console.error("[forgot-password] email failed for", email, sent.error);
  }

  return NextResponse.json({ message: GENERIC_OK });
}
