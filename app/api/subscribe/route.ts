import { NextResponse } from "next/server";

/**
 * Newsletter signup. Forwards to ConvertKit when credentials are configured;
 * without them it accepts the address and reports that delivery is not wired up
 * yet, rather than silently pretending to have subscribed someone.
 */
export async function POST(request: Request) {
  let email: unknown;

  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;

  if (!apiKey || !formId) {
    console.warn("[subscribe] ConvertKit not configured; dropping signup for", email);
    return NextResponse.json(
      { error: "Signups aren't switched on yet — message us on WhatsApp and we'll add you." },
      { status: 503 }
    );
  }

  const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, email }),
  });

  if (!res.ok) {
    console.error("[subscribe] ConvertKit responded", res.status, await res.text());
    return NextResponse.json({ error: "Could not sign you up. Try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ message: "You're on the list. Watch your inbox for the next drop." });
}
