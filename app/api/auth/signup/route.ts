import { NextResponse } from "next/server";
import {
  adminAuthConfigured,
  createUserWithConfirmationLink,
  isEmail,
  normaliseEmail,
  passwordProblem,
} from "@/lib/auth";
import { recordConsent, signupConsent } from "@/lib/consent";
import { sendDuplicateSignupNotice, sendEmailVerification } from "@/lib/emails";
import { addToAudience } from "@/lib/email";
import { clientIp, ipForAudit, rateLimit } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/site";

/**
 * Account creation.
 *
 * THE CONSENT RULES, WHICH ARE NOT NEGOTIABLE (POPIA s69):
 *  - Accepting the terms and privacy policy is required to open an account.
 *  - Marketing consent is SEPARATE and OPTIONAL. An account is created
 *    whether or not it is given. It is never inferred from the other box, and
 *    the form ships with both boxes unticked.
 *  - Both decisions are written to consent_records with the document version,
 *    the source and the IP — including the "no", because a record saying they
 *    declined is what proves nothing was pre-ticked.
 *
 * The response is IDENTICAL whether or not the address already has an
 * account, so this endpoint can't be used to find out who shops here. The
 * real owner of the address is told what happened by email instead.
 */

/** Said back to the caller in every non-error case. */
const GENERIC_OK =
  "Check your email — we've sent a link to confirm your account. It's valid for 24 hours.";

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Account creation is expensive (it sends email), so it is limited harder
  // than login.
  const limit = rateLimit(`signup:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many signups from this connection. Try again in a while, or message us on WhatsApp." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: {
    email?: unknown;
    password?: unknown;
    firstName?: unknown;
    acceptedTerms?: unknown;
    marketingConsent?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isEmail(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const email = normaliseEmail(body.email);

  if (typeof body.password !== "string") {
    return NextResponse.json({ error: "Choose a password." }, { status: 400 });
  }
  const passwordIssue = passwordProblem(body.password, email);
  if (passwordIssue) {
    return NextResponse.json({ error: passwordIssue }, { status: 400 });
  }

  // The one box that gates account creation.
  if (body.acceptedTerms !== true) {
    return NextResponse.json(
      { error: "You need to accept the Terms and the Privacy Policy to open an account." },
      { status: 400 }
    );
  }

  // Explicitly coerced, so a missing field is a "no" and never an accident.
  const marketingConsent = body.marketingConsent === true;
  const firstName =
    typeof body.firstName === "string" && body.firstName.trim()
      ? body.firstName.trim().slice(0, 60)
      : undefined;

  // Checked AFTER validation, so the consent and password rules are what a
  // caller hits first and a misconfigured deployment cannot mask a bad
  // request as an outage.
  if (!adminAuthConfigured()) {
    return NextResponse.json(
      { error: "Accounts aren't switched on yet. Order on WhatsApp and we'll look after you." },
      { status: 503 }
    );
  }

  const base = siteUrl(request);
  const created = await createUserWithConfirmationLink({
    email,
    password: body.password,
    firstName,
    // Land them on the login page with a note, rather than parsing tokens out
    // of a URL fragment. One extra step, far fewer ways to go wrong.
    redirectTo: `${base}/login?confirmed=1`,
  });

  if (!created.ok) {
    if (created.reason === "duplicate") {
      // Same answer as success. The address's real owner gets told the truth.
      const notice = await sendDuplicateSignupNotice({
        email,
        loginUrl: `${base}/login`,
        resetUrl: `${base}/forgot-password`,
      });
      if (!notice.ok) console.warn("[signup] duplicate notice not sent:", notice.error);
      return NextResponse.json({ message: GENERIC_OK });
    }
    if (created.reason === "weak") {
      return NextResponse.json({ error: created.message }, { status: 400 });
    }
    if (created.reason === "unavailable") {
      return NextResponse.json(
        { error: "Accounts aren't available right now. Try again shortly." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Could not create that account." }, { status: 400 });
  }

  // Consent first: if the email fails, the record of what they agreed to must
  // still exist.
  const consent = await recordConsent(
    signupConsent({
      email,
      userId: created.userId,
      acceptedTerms: true,
      marketingConsent,
      ipAddress: ipForAudit(request),
    })
  );
  if (consent.written === 0) {
    console.error("[signup] consent records NOT written for", created.userId);
  }

  const verification = await sendEmailVerification({
    email,
    confirmUrl: created.confirmationLink,
    firstName,
  });
  if (!verification.ok) {
    // The account exists but they can't confirm it. Say so plainly rather
    // than showing "check your email" for an email that isn't coming.
    console.error("[signup] verification email failed for", email, verification.error);
    return NextResponse.json(
      {
        error:
          "Your account was created but the confirmation email didn't send. Message us on WhatsApp and we'll activate it.",
      },
      { status: 502 }
    );
  }

  // Only now, and only if they asked for it.
  if (marketingConsent) {
    const added = await addToAudience(email);
    if (!added.ok) console.warn("[signup] marketing audience add failed:", added.error);
  }

  return NextResponse.json({ message: GENERIC_OK });
}
