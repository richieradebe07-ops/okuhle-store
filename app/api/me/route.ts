import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { loadAccount } from "@/lib/account";
import { resolveState } from "@/lib/ladder";

/**
 * Who is signed in, and just enough about them to pick the right call to
 * action. Called by VisitorStateProvider.
 *
 * Returns ONLY what the page needs to decide what to show: no addresses, no
 * phone numbers, no order contents. Even though this is the user's own data,
 * shipping it into the browser on every page view for no reason is how it
 * ends up somewhere it shouldn't be.
 *
 * Never a 5xx: the site's navigation must not break because the accounts
 * service is having a moment. A failure reads as "not signed in".
 */
export async function GET() {
  const anonymous = NextResponse.json({ signedIn: false, paidOrders: 0, points: 0 });
  anonymous.headers.set("Cache-Control", "private, no-store");

  try {
    const session = await currentSession();
    if (!session) return anonymous;

    const snapshot = await loadAccount(session.user.id, session.accessToken);

    const response = NextResponse.json({
      signedIn: true,
      firstName: session.user.firstName,
      paidOrders: snapshot.paidOrders.length,
      points: snapshot.points,
      member: snapshot.memberActive,
      memberNumber: snapshot.memberActive ? snapshot.membership?.memberNumber ?? null : null,
      state: resolveState({
        signedIn: true,
        subscribed: true,
        paidOrders: snapshot.paidOrders.length,
      }),
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (err) {
    console.error("[me] failed:", err);
    return anonymous;
  }
}
