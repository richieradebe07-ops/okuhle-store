import { scarcityLabel, type Product } from "@/lib/products";

/** Renders nothing when the product carries no real run/stock data. */
export function ScarcityBadge({ product }: { product: Product }) {
  const label = scarcityLabel(product);
  if (!label) return null;

  return (
    <p
      style={{
        margin: 0,
        fontSize: "0.72rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--accent)",
      }}
    >
      {label}
    </p>
  );
}
