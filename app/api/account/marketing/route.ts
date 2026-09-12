import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { recordConsent } from "@/lib/consent";
import { addToAudience } from "@/lib/email";
import { ipForAudit } from "@/lib/rateLimit";
import { legal } from "@/lib/legal";

/**
 * Turn marketing email on or off. POPIA s69(3)(b): a data subject may object
 * at any time, and it has to be as easy to stop as it was to start.
 *
 * Consent history is APPENDED, never edited — the record reads forwards:
 * granted on this date, withdrawn on that one. That trail is the evidence if
 * anyone ever asks why they were emailed.
 */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let body: { granted?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.granted !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const granted = body.granted;

  // Record the decision FIRST. If the audience update fails we are left
  // having promised something we didn't do, which is recoverable; the reverse
  // — quietly emailing someone with no record of consent — is not.
  const consent = await recordConsent([
    {
      kind: "marketing",
      granted,
      email: session.user.email,
      userId: session.user.id,
      source: "account_settings",
      documentVersion: legal.privacyVersion,
      ipAddress: ipForAudit(request),
    },
  ]);
  if (consent.written === 0) {
    return NextResponse.json(
      { error: "Couldn't save that change. Try again shortly." },
      { status: 502 }
    );
  }

  const result = await addToAudience(session.user.email, { unsubscribed: !granted });
  if (!result.ok) {
    console.error("[marketing] audience update failed for", session.user.email, result.error);
    return NextResponse.json(
      {
        error: granted
          ? "Saved your choice, but the mailing list didn't update. Message us on WhatsApp and we'll add you."
          : "Saved your choice, but the mailing list didn't update. Message us on WhatsApp and we'll take you off immediately.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    granted,
    message: granted
      ? "You're on the list. We'll email you about new drops."
      : "Done — no more marketing email. You'll still get order confirmations.",
  });
}
