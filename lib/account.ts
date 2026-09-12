/**
 * Everything the /account pages read.
 *
 * All of it goes through `userQuery` — the anon key plus the customer's own
 * access token — so Row Level Security decides what comes back. The
 * `user_id=eq.…` filters below are belt and braces, not the protection.
 */
import { userQuery } from "./supabase";
import { fromCents } from "./supabase";
import type { ConsentRow } from "./consent";
import { isActive, type Membership } from "./membership";

export type AccountOrder = {
  id: string;
  createdAt: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  amount: number;
  delivery: number;
  productId: string;
  productName: string;
  colour: string;
  size: string;
  paidAt: string | null;
  pointsAwarded: number;
};

type OrderRow = {
  id: string;
  created_at: string;
  status: AccountOrder["status"];
  amount_cents: number;
  delivery_cents: number | null;
  product_id: string;
  product_name: string;
  colour: string;
  size: string;
  paid_at: string | null;
  points_awarded: number | null;
};

type MembershipRow = {
  member_number: number;
  status: "active" | "expired";
  purchased_at: string;
  expires_at: string;
  price_paid_cents: number;
  price_locked: boolean;
  welcome_pack_sent: boolean;
};

export type RewardEvent = {
  createdAt: string;
  points: number;
  reason: string;
  orderId: string | null;
};

export type AccountSnapshot = {
  orders: AccountOrder[];
  paidOrders: AccountOrder[];
  points: number;
  membership: Membership | null;
  memberActive: boolean;
  rewardEvents: RewardEvent[];
  totalSpent: number;
};

const ORDER_FIELDS =
  "id,created_at,status,amount_cents,delivery_cents,product_id,product_name,colour,size,paid_at,points_awarded";

function toOrder(row: OrderRow): AccountOrder {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    amount: fromCents(row.amount_cents),
    delivery: fromCents(row.delivery_cents ?? 0),
    productId: row.product_id,
    productName: row.product_name,
    colour: row.colour,
    size: row.size,
    paidAt: row.paid_at,
    pointsAwarded: row.points_awarded ?? 0,
  };
}

export async function loadOrders(userId: string, accessToken: string): Promise<AccountOrder[]> {
  const rows = await userQuery<OrderRow[]>(
    `orders?user_id=eq.${encodeURIComponent(userId)}&select=${ORDER_FIELDS}&order=created_at.desc`,
    accessToken
  );
  return rows.map(toOrder);
}

export async function loadMembership(
  userId: string,
  accessToken: string
): Promise<Membership | null> {
  const rows = await userQuery<MembershipRow[]>(
    `memberships?user_id=eq.${encodeURIComponent(userId)}&order=purchased_at.desc&limit=1`,
    accessToken
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    userId,
    memberNumber: r.member_number,
    status: r.status,
    purchasedAt: r.purchased_at,
    expiresAt: r.expires_at,
    pricePaid: fromCents(r.price_paid_cents),
    priceLocked: r.price_locked,
    welcomePackSent: r.welcome_pack_sent,
  };
}

export async function loadRewards(
  userId: string,
  accessToken: string
): Promise<{ balance: number; events: RewardEvent[] }> {
  const [balanceRows, eventRows] = await Promise.all([
    userQuery<{ balance: number }[]>(
      `reward_balances?user_id=eq.${encodeURIComponent(userId)}&select=balance`,
      accessToken
    ),
    userQuery<{ created_at: string; points: number; reason: string; order_id: string | null }[]>(
      `reward_events?user_id=eq.${encodeURIComponent(userId)}&select=created_at,points,reason,order_id&order=created_at.desc`,
      accessToken
    ),
  ]);

  return {
    balance: balanceRows[0]?.balance ?? 0,
    events: eventRows.map((e) => ({
      createdAt: e.created_at,
      points: e.points,
      reason: e.reason,
      orderId: e.order_id,
    })),
  };
}

export async function loadConsents(userId: string, accessToken: string): Promise<ConsentRow[]> {
  return userQuery<ConsentRow[]>(
    `consent_records?user_id=eq.${encodeURIComponent(userId)}&select=id,created_at,kind,granted,document_version,source,email&order=created_at.desc`,
    accessToken
  );
}

/**
 * One read for the dashboard. Requests run in parallel; a single failure takes
 * the page down rather than rendering a half-true "0 points, no orders",
 * which is worse than an honest error.
 */
export async function loadAccount(userId: string, accessToken: string): Promise<AccountSnapshot> {
  const [orders, membership, rewards] = await Promise.all([
    loadOrders(userId, accessToken),
    loadMembership(userId, accessToken),
    loadRewards(userId, accessToken),
  ]);

  const paidOrders = orders.filter((o) => o.status === "paid");

  return {
    orders,
    paidOrders,
    points: rewards.balance,
    membership,
    memberActive: isActive(membership),
    rewardEvents: rewards.events,
    totalSpent: paidOrders.reduce((sum, o) => sum + o.amount, 0),
  };
}
