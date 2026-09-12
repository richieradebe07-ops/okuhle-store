import { NextResponse } from "next/server";
import { addToAudience, emailConfig } from "@/lib/email";

/**
 * Newsletter signup → Resend audience.
 *
 * POPIA: an address is only added when `marketingConsent` is explicitly true.
 * A request without it is refused rather than quietly treated as consent.
 * Transactional email (order confirmations) never comes through here and does
 * not need this consent.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; marketingConsent?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, marketingConsent } = body;

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (marketingConsent !== true) {
    return NextResponse.json(
      { error: "We need your permission before adding you to the list." },
      { status: 400 }
    );
  }

  const { apiKey, audienceId } = emailConfig();
  if (!apiKey || !audienceId) {
    console.warn("[subscribe] Resend audience not configured; dropping signup for", email);
    return NextResponse.json(
      { error: "Signups aren't switched on yet — message us on WhatsApp and we'll add you." },
      { status: 503 }
    );
  }

  const result = await addToAudience(email);
  if (!result.ok) {
    return NextResponse.json({ error: "Could not sign you up. Try again shortly." }, { status: 502 });
  }

  console.info(`[subscribe] added ${email} with marketing consent at ${new Date().toISOString()}`);

  return NextResponse.json({ message: "You're on the list. Watch your inbox for the next drop." });
}
