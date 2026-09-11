/**
 * The commitment ladder.
 *
 * Each visitor state gets exactly one primary call to action — the next rung,
 * never the top of the ladder. A first-time visitor is asked for an email, not
 * a R400 hoodie.
 *
 * States above "subscribed" need accounts and order history. They are defined
 * here so the ladder is complete, but `resolveState` can only reach the first
 * two until auth and PayFast land.
 */
export type VisitorState =
  | "anonymous"
  | "subscribed"
  | "account"
  | "customer"
  | "repeat";

export type Rung = {
  label: string;
  href: string;
  /** Shown under the CTA where there's room. */
  support?: string;
};

export const ladder: Record<VisitorState, Rung> = {
  anonymous: {
    label: "Join the list",
    href: "/#join",
    support: "First access to the next drop.",
  },
  subscribed: {
    label: "Shop the collection",
    href: "/shop",
    support: "Made to order, in your colour and size.",
  },
  account: {
    // Deliberately the cheapest entry piece, not the hoodie.
    label: "Start with the Tee — R210",
    href: "/shop/t-shirt",
    support: "The easiest way in.",
  },
  customer: {
    label: "Complete the fit",
    href: "/shop",
    support: "What goes with what you already have.",
  },
  repeat: {
    label: "Founding Member — 50 spots",
    href: "/founding-members",
    support: "One-time, permanent, numbered.",
  },
};

export function rungFor(state: VisitorState): Rung {
  return ladder[state];
}
