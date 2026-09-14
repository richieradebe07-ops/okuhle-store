"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Product, savings } from "@/lib/products";
import { formatRand, site, whatsappLink } from "@/lib/site";
import { layBy, layByMonthly, pointsFor } from "@/lib/loyalty";
import { BuyNow } from "./BuyNow";
import { useWishlist } from "./WishlistProvider";
import { Emblem } from "./Logo";
import { Stars } from "./Stars";
import { ScarcityBadge } from "./ScarcityBadge";
import { SizeGuide } from "./SizeGuide";
// Type-only, so none of lib/reviews' server-side code reaches this bundle.
import type { RatingSummary } from "@/lib/reviews-shared";

/** Relative luminance, to decide whether artwork on this colour should be black or white. */
function isLight(hex: string) {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

export function ProductCard({
  summary,
  product,
  checkoutEnabled = false,
}: {
  product: Product;
  checkoutEnabled?: boolean;
  /** Star average, when this piece has published reviews. Omitted when none. */
  summary?: RatingSummary | null;
}) {
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState<string | null>(null);
  const [angleIndex, setAngleIndex] = useState(0);
  const { has, toggle } = useWishlist();
  const saved = savings(product);

  // Extra angles (back, detail close-up, ...) alongside the primary shot —
  // optional, and empty for every colourway until that photography exists.
  const angles = [color.image, ...(color.images ?? [])].filter(
    (src, i, arr): src is string => Boolean(src) && arr.indexOf(src) === i
  );
  const mainImage = angles[angleIndex] ?? color.image;

  function selectColor(c: typeof color) {
    setColor(c);
    setAngleIndex(0);
  }

  const orderMessage = `Hi ${site.name}! I'd like to order:

• ${product.name}
• Colour: ${color.name}
• Size: ${size ?? "(please advise)"}
• Price: ${formatRand(product.price)}

Is this available?`;

  return (
    <article className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          background: mainImage ? "#ffffff" : color.hex,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.35s ease",
          overflow: "hidden",
        }}
      >
        {mainImage ? (
          <Image
            src={mainImage}
            alt={`${product.name} in ${color.name}`}
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          /* Fabric swatch until this colourway is photographed. Deliberately no
             emblem here — a logo stamped on flat colour reads as a fake product. */
          <span
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: isLight(color.hex) ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.6)",
            }}
          >
            {color.name}
          </span>
        )}

        {saved > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0.75rem",
              left: "0.75rem",
              zIndex: 1,
              background: "var(--bg)",
              color: "var(--accent)",
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "0.3rem 0.6rem",
              border: "1px solid var(--accent)",
            }}
          >
            Save {formatRand(saved)}
          </span>
        )}

        <button
          onClick={() => toggle(product.id)}
          aria-label={has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            zIndex: 1,
            width: "2.2rem",
            height: "2.2rem",
            borderRadius: "50%",
            border: "none",
            background: "var(--bg)",
            color: has(product.id) ? "var(--accent)" : "var(--fg-muted)",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          ♥
        </button>
      </div>

      {/* Only renders once a colourway actually has more than one angle
          photographed — currently none do, so this is normally absent. */}
      {angles.length > 1 && (
        <div style={{ display: "flex", gap: "0.4rem", padding: "0.6rem 1.25rem 0" }}>
          {angles.map((src, i) => (
            <button
              key={src}
              onClick={() => setAngleIndex(i)}
              aria-label={`View angle ${i + 1}`}
              aria-pressed={i === angleIndex}
              style={{
                position: "relative",
                width: "2.6rem",
                height: "2.6rem",
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
                border: i === angleIndex ? "2px solid var(--accent)" : "1px solid var(--line)",
                background: "#ffffff",
              }}
            >
              <Image src={src} alt="" fill sizes="42px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div>
          <h3 style={{ fontSize: "1.35rem", margin: 0 }}>
            <Link href={`/shop/${product.id}`} style={{ color: "inherit", textDecoration: "none" }}>
              {product.name}
            </Link>
          </h3>
          {/* Only rendered once there is something real behind it — an empty
              row of grey stars on every card says "nobody has bought this". */}
          {summary && summary.count > 0 && (
            <Link
              href={`/shop/${product.id}#reviews`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                margin: "0.5rem 0 0",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Stars rating={summary.average} size="0.85rem" />
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--fg-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {summary.average} ({summary.count})
              </span>
            </Link>
          )}
          <p style={{ color: "var(--fg-muted)", fontSize: "0.86rem", margin: "0.35rem 0 0" }}>
            {product.tagline ?? product.description}
          </p>
        </div>

        <ScarcityBadge product={product} />

        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span className="display" style={{ fontSize: "1.5rem", color: "var(--accent)" }}>
            {formatRand(product.price)}
          </span>
          {product.compareAtPrice && (
            <span
              style={{
                color: "var(--fg-muted)",
                textDecoration: "line-through",
                fontSize: "0.9rem",
              }}
            >
              {formatRand(product.compareAtPrice)}
            </span>
          )}
        </div>

        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--fg-muted)" }}>
          or{" "}
          <strong style={{ color: "var(--accent)" }}>
            {formatRand(layByMonthly(product.price))}/month
          </strong>{" "}
          over {layBy.months} months —{" "}
          <Link href="/shipping#lay-by" style={{ color: "var(--fg-muted)" }}>
            how lay-by works
          </Link>
        </p>

        <div>
          <FieldLabel>
            Colour: <span style={{ color: "var(--accent)" }}>{color.name}</span>
          </FieldLabel>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => selectColor(c)}
                aria-label={c.name}
                aria-pressed={c.name === color.name}
                style={{
                  width: "1.6rem",
                  height: "1.6rem",
                  borderRadius: "50%",
                  background: c.hex,
                  cursor: "pointer",
                  border:
                    c.name === color.name
                      ? "2px solid var(--accent)"
                      : "1px solid var(--line)",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem" }}>
            <FieldLabel>
              Size:{" "}
              <span style={{ color: size ? "var(--accent)" : "var(--fg-muted)" }}>
                {size ?? "Select a size"}
              </span>
            </FieldLabel>
            <SizeGuide category={product.category} productName={product.name} />
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={s === size}
                style={{
                  minWidth: "2.6rem",
                  padding: "0.45rem 0.6rem",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  background: s === size ? "var(--accent)" : "transparent",
                  color: s === size ? "var(--accent-fg)" : "var(--fg)",
                  border: `1px solid ${s === size ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <BuyNow
          productId={product.id}
          colour={color.name}
          size={size}
          price={product.price}
          enabled={checkoutEnabled}
        />

        <a
          className={checkoutEnabled ? "btn btn-ghost" : "btn"}
          href={whatsappLink(orderMessage)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: "100%" }}
        >
          {checkoutEnabled ? "Or order via WhatsApp" : "Order via WhatsApp"}
        </a>

        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            color: "var(--fg-muted)",
            textAlign: "center",
          }}
        >
          Earns {pointsFor(product.price)} points ·{" "}
          <Link href="/loyalty" style={{ color: "var(--fg-muted)" }}>
            free rewards
          </Link>
        </p>
      </div>
    </article>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 0.5rem",
        fontSize: "0.68rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--fg-muted)",
      }}
    >
      {children}
    </p>
  );
}
