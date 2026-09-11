import Image from "next/image";
import { site } from "@/lib/site";

/**
 * The OKUHLE emblem. The artwork is black, so it needs flipping on dark
 * backgrounds. "auto" follows the page theme; pass "dark"/"light" when the
 * emblem sits on a fixed colour (a garment swatch) that the theme doesn't move.
 */
export function Emblem({
  size = 40,
  tone = "auto",
}: {
  size?: number;
  tone?: "auto" | "dark" | "light";
}) {
  const className =
    tone === "auto" ? "emblem" : tone === "light" ? "emblem-invert" : undefined;

  return (
    <Image
      className={className}
      src="/brand/emblem.png"
      alt="OKUHLE emblem"
      width={size}
      height={size}
      priority={size > 80}
      style={{ flexShrink: 0, width: size, height: size }}
    />
  );
}

export function Wordmark() {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1 }}>
      <span
        className="display"
        style={{ fontSize: "1.4rem", letterSpacing: "0.18em", fontWeight: 500 }}
      >
        {site.name}
      </span>
      <span
        style={{
          fontSize: "0.52rem",
          letterSpacing: "0.34em",
          color: "var(--fg-muted)",
          marginTop: "0.2rem",
        }}
      >
        EST. {site.established} · {site.region}
      </span>
    </span>
  );
}
