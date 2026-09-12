import crypto from "crypto";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  /** What we expect PayFast to charge. The ITN is checked against this. */
  amount: number;
  productId: string;
  productName: string;
  colour: string;
  size: string;
  buyerEmail?: string;
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

/**
 * Development store. Orders live in memory for the lifetime of one server
 * process.
 *
 * This is NOT a production store: on serverless hosting every request may get a
 * fresh process, so an order created during checkout would be gone by the time
 * the ITN arrives — and the ITN's amount check would fail open. Swapping in
 * Supabase is the remaining work; `payfastReady()` below is what stops this
 * being used for real money by accident.
 */
class MemoryOrderStore implements OrderStore {
  private orders = new Map<string, Order>();

  async create(input: Omit<Order, "id" | "createdAt" | "status">): Promise<Order> {
    const order: Order = {
      ...input,
      id: `OK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
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
    if (!order) return;
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
    globalForOrders.__okuhleOrders = new MemoryOrderStore();
  }
  return globalForOrders.__okuhleOrders;
}

/** True when there is a durable store behind orders. Flips when Supabase lands. */
export function hasDurableOrderStore() {
  return false;
}
