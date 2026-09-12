/**
 * Writing to the points ledger. Server only — uses the service-role key.
 *
 * Points are earned when a payment is CONFIRMED by the PayFast ITN, never when
 * a checkout starts. An abandoned checkout must not mint points.
 *
 * The ledger is append-only and the balance is a view over it, so there is no
 * counter to get out of step with the transactions. Awarding twice for the
 * same order is blocked by a unique index in the database
 * (`reward_events_order_earn_idx`), not by a check in this file — a duplicate
 * ITN arriving on two instances at once would slip past an application check.
 */
import { serviceQuery, supabaseConfigured } from "./supabase";
import { pointsFor } from "./loyalty";
import type { Order } from "./orders";

export type AwardResult =
  | { awarded: true; points: number }
  | { awarded: false; reason: "no-account" | "no-points" | "already-awarded" | "not-configured" | "error" };

/**
 * Awards loyalty points for a confirmed order.
 *
 * Guest orders earn nothing — there is no account to credit. That is stated
 * on the loyalty page rather than left as a surprise.
 */
export async function awardPointsForOrder(order: Order): Promise<AwardResult> {
  if (!order.userId) return { awarded: false, reason: "no-account" };
  if (!supabaseConfigured()) return { awarded: false, reason: "not-configured" };

  const points = pointsFor(order.amount);
  if (points <= 0) return { awarded: false, reason: "no-points" };

  try {
    await serviceQuery("reward_events", {
      method: "POST",
      body: {
        user_id: order.userId,
        points,
        reason: `Order ${order.id}`,
        order_id: order.id,
      },
    });
  } catch (err) {
    // 23505 is the unique-violation code: the points are already on the
    // ledger, which is the correct end state for a repeated ITN.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("23505") || message.includes("duplicate key")) {
      return { awarded: false, reason: "already-awarded" };
    }
    console.error("[rewards] could not award points for", order.id, err);
    return { awarded: false, reason: "error" };
  }

  // Mirror the total onto the order so the owner's view of an order is
  // self-contained. Failing here loses a display field, not the points.
  try {
    await serviceQuery(`orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      body: { points_awarded: points },
    });
  } catch (err) {
    console.warn("[rewards] points awarded but orders.points_awarded not updated:", err);
  }

  return { awarded: true, points };
}

/** Spends points. Returns false when the balance is short. */
export async function redeemPoints(input: {
  userId: string;
  points: number;
  reason: string;
  orderId?: string;
}): Promise<boolean> {
  if (input.points <= 0) return false;
  if (!supabaseConfigured()) return false;

  // Read the derived balance first. This is a check-then-act race in theory;
  // in practice a customer redeeming from two devices in the same instant is
  // not the threat model, and the worst case is a negative balance that the
  // ledger makes visible rather than hides.
  try {
    const rows = await serviceQuery<{ balance: number }[]>(
      `reward_balances?user_id=eq.${encodeURIComponent(input.userId)}&select=balance`
    );
    const balance = rows[0]?.balance ?? 0;
    if (balance < input.points) return false;

    await serviceQuery("reward_events", {
      method: "POST",
      body: {
        user_id: input.userId,
        points: -input.points,
        reason: input.reason,
        order_id: input.orderId ?? null,
      },
    });
    return true;
  } catch (err) {
    console.error("[rewards] redemption failed for", input.userId, err);
    return false;
  }
}
