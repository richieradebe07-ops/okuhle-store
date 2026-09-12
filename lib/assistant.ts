import { products } from "./products";
import { formatRand } from "./site";
import { layBy, layByMonthly } from "./loyalty";

/**
 * Layer 1 of the assistant: scripted answers and navigation.
 *
 * No model, no API cost, nothing that can hallucinate a price or promise a
 * delivery date. Every figure below is read from the same product and lay-by
 * data the rest of the site renders, so the assistant cannot drift out of sync
 * with the shop.
 *
 * Anything not covered here escalates to WhatsApp rather than being improvised.
 */
export type Reply = {
  id: string;
  /** The button the visitor taps. */
  question: string;
  /** Built at render time from live data. */
  answer: () => string;
  /** Optional place to send them — this is the navigation half. */
  action?: { label: string; href: string };
};

export const quickReplies: Reply[] = [
  {
    id: "sizing",
    question: "What size am I?",
    answer: () =>
      "Tees, golf tees, sweaters and hoodies run true to size in a regular fit. The Baggy Tee is oversized by design — order your usual size for the intended drape, not a size down. Between sizes? Size up. Our cotton settles slightly after the first wash and most people prefer the extra room across the shoulders.\n\nIf you tell us your usual size on WhatsApp we'll talk it through before you order.",
    action: { label: "See the range", href: "/shop" },
  },
  {
    id: "turnaround",
    question: "How long does it take?",
    answer: () =>
      "Everything is made to order, so allow 2–3 working days to make your piece. Delivery then takes 1–2 working days in Pietermaritzburg and Durban, 2–4 to Gauteng and other metros, and 3–7 to outlying areas.\n\nThose are estimates, not guarantees — couriers occasionally run late.",
    action: { label: "Shipping detail", href: "/shipping" },
  },
  {
    id: "lay-by",
    question: "How does lay-by work?",
    answer: () =>
      `Pay it off over ${layBy.months} months — no interest, no admin fee. A deposit starts production and your piece ships once the final payment clears.\n\n` +
      products.map((p) => `• ${p.name} — ${formatRand(layByMonthly(p.price))} a month`).join("\n") +
      "\n\nLay-by is arranged on WhatsApp so we can agree the instalments with you.",
    action: { label: "How lay-by works", href: "/shipping#lay-by" },
  },
  {
    id: "payment",
    question: "How do I pay?",
    answer: () =>
      "EFT, instant transfer or card. We send you the details once your order is confirmed, and you'll always see the full amount including delivery before you pay anything.\n\nCard details are handled by our payment provider — they never reach us.",
    action: { label: "Ordering explained", href: "/order" },
  },
  {
    id: "bulk",
    question: "Bulk or group orders",
    answer: () =>
      "Yes — 3 or more tees, golf tees or baggy fits, or 2 or more sweaters or hoodies, and the unit price drops. Team kit, church groups, matric crews and small businesses are a big part of what we do.\n\nMessage us with roughly what you need and we'll quote you.",
    action: { label: "See the range", href: "/shop" },
  },
  {
    id: "rewards",
    question: "Do you have rewards?",
    answer: () =>
      "Yes, and they're free — no subscription. Every R100 you spend earns a point, and 10 points takes R100 off a future order. You also get early access to drops and 15% off one order in your birthday month.",
    action: { label: "How rewards work", href: "/loyalty" },
  },
  {
    id: "location",
    question: "Where are you based?",
    answer: () =>
      "M70 Road, Mvundlweni, Pietermaritzburg, KwaZulu-Natal. Local collection is welcome — message us first so we can have your piece ready and agree a time.",
    action: { label: "Our story", href: "/about" },
  },
  {
    id: "order-status",
    question: "Track my order",
    answer: () =>
      "Order tracking isn't on the site yet. Message us on WhatsApp with your name and we'll tell you exactly where your piece is — we don't share order details here, because we can't confirm who's asking.",
  },
];

/** Product shortcuts, so "I want a hoodie" moves them rather than describing it. */
export const productShortcuts = products.map((p) => ({
  id: p.id,
  label: `${p.name} — ${formatRand(p.price)}`,
  href: `/shop/${p.id}`,
}));
