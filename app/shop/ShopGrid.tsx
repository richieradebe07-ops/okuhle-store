"use client";

import { useState } from "react";
import { categories, products, CategoryId } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export function ShopGrid({ checkoutEnabled = false }: { checkoutEnabled?: boolean }) {
  const [active, setActive] = useState<CategoryId | "all">("all");
  const visible = products.filter(
    (p) => p.active && (active === "all" || p.category === active)
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "2.5rem",
        }}
      >
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            aria-pressed={active === c.id}
            style={{
              padding: "0.5rem 1.1rem",
              fontSize: "0.72rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: "999px",
              background: active === c.id ? "var(--accent)" : "transparent",
              color: active === c.id ? "var(--accent-fg)" : "var(--fg-muted)",
              border: `1px solid ${active === c.id ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} checkoutEnabled={checkoutEnabled} />
        ))}
      </div>

      {visible.length === 0 && (
        <p style={{ color: "var(--fg-muted)" }}>Nothing in this category yet — check back soon.</p>
      )}
    </>
  );
}
