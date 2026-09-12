import crypto from "crypto";
import { serviceQuery, supabaseConfigured, toCents, fromCents } from "./supabase";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  /** What we expect PayFast to charge, in rand. The ITN is checked against this. */
  amount: number;
  productId: string;
  productName: string;
  colour: string;
  size: string;
  buyerEmail?: string;
  buyerName?: string;
  buyerPhone?: string;
  userId?: string;
  /** PayFast's own payment id, recorded when the ITN confirms payment. */
  pfPaymentId?: string;
  paidAt?: string;
};

export interface OrderStore {
  create(order: Omit<Order, "id" | "createdAt" | "status">): Promise<Order>;
  get(id: string): Promise<Order | null>;
  markPaid(id: string, pfPaymentId: string): Promise<void>;
  markStatus(id: string, status: OrderStatus): Promise<void>;
  countPaidFor(productIds: string[]): Promise<number>;
}

function newOrderId() {
  return `OK-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

/** Postgres row shape. Money is cents in the database, rand in the app. */
type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  amount_cents: number;
  product_id: string;
  product_name: string;
  colour: string;
  size: string;
  buyer_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  user_id: string | null;
  pf_payment_id: string | null;
  paid_at: string | null;
};

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    amount: fromCents(row.amount_cents),
    productId: row.product_id,
    productName: row.product_name,
    colour: row.colour,
    size: row.size,
    buyerEmail: row.buyer_email ?? undefined,
    buyerName: row.buyer_name ?? undefined,
    buyerPhone: row.buyer_phone ?? undefined,
    userId: row.user_id ?? undefined,
    pfPaymentId: row.pf_payment_id ?? undefined,
    paidAt: row.paid_at ?? undefined,
  };
}

/**
 * Supabase-backed store. Uses the service-role key, so it bypasses RLS —
 * this is the only path allowed to write orders. A browser holds the anon key
 * and RLS blocks it from inserting an order or marking one paid.
 */
class SupabaseOrderStore implements OrderStore {
  async create(input: Omit<Order, "id" | "createdAt" | "status">): Promise<Order> {
    const rows = await serviceQuery<OrderRow[]>("orders", {
      method: "POST",
      prefer: "return=representation",
      body: {
        id: newOrderId(),
        amount_cents: toCents(input.amount),
        product_id: input.productId,
        product_name: input.productName,
        colour: input.colour,
        size: input.size,
        buyer_email: input.buyerEmail ?? null,
        buyer_name: input.buyerName ?? null,
        buyer_phone: input.buyerPhone ?? null,
        user_id: input.userId ?? null,
      },
    });
    return fromRow(rows[0]);
  }

  async get(id: string): Promise<Order | null> {
    const rows = await serviceQuery<OrderRow[]>(
      `orders?id=eq.${encodeURIComponent(id)}&limit=1`
    );
    return rows.length ? fromRow(rows[0]) : null;
  }

  /**
   * Marks an order paid. Scoped to `status=eq.pending` so a repeated ITN — which
   * PayFast does deliver — cannot re-trigger the side effects that follow.
   */
  async markPaid(id: string, pfPaymentId: string): Promise<void> {
    await serviceQuery<OrderRow[]>(
      `orders?id=eq.${encodeURIComponent(id)}&status=eq.pending`,
      {
        method: "PATCH",
        prefer: "return=representation",
        body: {
          status: "paid",
          pf_payment_id: pfPaymentId || null,
          paid_at: new Date().toISOString(),
        },
      }
    );
  }

  async markStatus(id: string, status: OrderStatus): Promise<void> {
    await serviceQuery(`orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    });
  }

  async countPaidFor(productIds: string[]): Promise<number> {
    if (productIds.length === 0) return 0;
    const list = productIds.map((p) => `"${p}"`).join(",");
    const rows = await serviceQuery<{ id: string }[]>(
      `orders?status=eq.paid&product_id=in.(${encodeURIComponent(list)})&select=id`
    );
    return rows.length;
  }
}

/**
 * Development fallback: orders live in memory for one server process.
 *
 * Not viable in production — on serverless hosting each request may get a fresh
 * process, so an order created at checkout would be gone when the ITN arrives
 * and the amount check would have nothing to compare against. That is why
 * `hasDurableOrderStore()` gates production checkout.
 */
class MemoryOrderStore implements OrderStore {
  private orders = new Map<string, Order>();

  async create(input: Omit<Order, "id" | "createdAt" | "status">): Promise<Order> {
    const order: Order = {
      ...input,
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    this.orders.set(order.id, order);
    return order;
  }

  async get(id: string) {
    return this.orders.get(id) ?? null;
  }

  async markPaid(id: string, pfPaymentId: string) {
    const order = this.orders.get(id);
    if (!order || order.status !== "pending") return;
    order.status = "paid";
    order.pfPaymentId = pfPaymentId;
    order.paidAt = new Date().toISOString();
  }

  async markStatus(id: string, status: OrderStatus) {
    const order = this.orders.get(id);
    if (order) order.status = status;
  }

  async countPaidFor(productIds: string[]) {
    let n = 0;
    for (const o of this.orders.values()) {
      if (o.status === "paid" && productIds.includes(o.productId)) n++;
    }
    return n;
  }
}

const globalForOrders = globalThis as unknown as { __okuhleOrders?: OrderStore };

export function orderStore(): OrderStore {
  if (!globalForOrders.__okuhleOrders) {
    globalForOrders.__okuhleOrders = supabaseConfigured()
      ? new SupabaseOrderStore()
      : new MemoryOrderStore();
  }
  return globalForOrders.__okuhleOrders;
}

/** True when orders survive a process restart — the gate on live checkout. */
export function hasDurableOrderStore() {
  return supabaseConfigured();
}
