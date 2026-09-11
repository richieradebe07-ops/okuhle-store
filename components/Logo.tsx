import { site } from "@/lib/site";

export function Emblem({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="OKUHLE emblem"
      style={{ flexShrink: 0 }}
    >
      <circle cx="24" cy="24" r="22" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--accent)" strokeWidth="0.75" opacity="0.6" />
      {/* stylised sail / crest */}
      <path d="M24 12 L33 30 L24 25 L15 30 Z" fill="var(--accent)" />
      <path d="M24 12 L24 25" stroke="var(--bg)" strokeWidth="1" />
    </svg>
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
