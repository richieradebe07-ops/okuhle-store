import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { loadAccount, loadConsents } from "@/lib/account";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { legal } from "@/lib/legal";
import { site } from "@/lib/site";

/**
 * POPIA section 23 — the right of access. Everything we hold about the
 * signed-in person, as a file they can keep, in a format they can actually
 * read.
 *
 * The export is built from the same RLS-protected reads the account pages
 * use, so it cannot return anyone else's data even if this handler were
 * called with a tampered user id — there is no user id to tamper with, it
 * comes from the session.
 */
export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  // Cheap for us, but not free — and an export is the one request worth
  // making noisy if something starts hammering it.
  const limit = rateLimit(`export:${session.user.id}:${clientIp(request)}`, 5, 60 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You've requested this a few times already. Try again in an hour." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let snapshot;
  let consents;
  try {
    [snapshot, consents] = await Promise.all([
      loadAccount(session.user.id, session.accessToken),
      loadConsents(session.user.id, session.accessToken),
    ]);
  } catch (err) {
    console.error("[export] failed:", err);
    return NextResponse.json({ error: "Couldn't build your export. Try again shortly." }, { status: 502 });
  }

  const payload = {
    about_this_file: {
      description: `Everything ${site.name} holds about your account, exported at your request under section 23 of POPIA.`,
      exported_at: new Date().toISOString(),
      responsible_party: site.name,
      information_officer: legal.informationOfficer.email ?? "see the Privacy Policy",
      regulator: legal.regulator.name,
      note: "Amounts are in South African rand. Points are the free loyalty programme; the balance is the sum of the events below.",
    },
    account: {
      email: session.user.email,
      first_name: session.user.firstName,
      created_at: session.user.createdAt,
      email_confirmed_at: session.user.emailConfirmedAt,
    },
    orders: snapshot.orders.map((o) => ({
      order_number: o.id,
      placed_at: o.createdAt,
      status: o.status,
      item: o.productName,
      colour: o.colour,
      size: o.size,
      amount_rand: o.amount,
      delivery_rand: o.delivery,
      paid_at: o.paidAt,
      points_awarded: o.pointsAwarded,
    })),
    loyalty: {
      balance: snapshot.points,
      events: snapshot.rewardEvents.map((e) => ({
        at: e.createdAt,
        points: e.points,
        reason: e.reason,
        order_number: e.orderId,
      })),
    },
    membership: snapshot.membership
      ? {
          member_number: snapshot.membership.memberNumber,
          status: snapshot.membership.status,
          purchased_at: snapshot.membership.purchasedAt,
          expires_at: snapshot.membership.expiresAt,
          price_paid_rand: snapshot.membership.pricePaid,
        }
      : null,
    consent_history: consents.map((c) => ({
      at: c.created_at,
      what: c.kind,
      granted: c.granted,
      document_version: c.document_version,
      given_via: c.source,
    })),
    what_is_not_here: [
      "Card details — PayFast processes payments and we never receive or store them.",
      "WhatsApp conversations — those live in WhatsApp, not on our systems.",
      "Web server request logs, which our host keeps briefly for security.",
    ],
  };

  const filename = `okuhle-my-data-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
