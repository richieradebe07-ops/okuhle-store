import Link from "next/link";
import { Emblem } from "./Logo";

/**
 * The frame around login, signup and password pages.
 *
 * One narrow column, one job per page, and the emblem used once — the way the
 * old site used it: as a mark, not as wallpaper.
 */
export function AuthShell({
  eyebrow,
  title,
  lead,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(2.5rem, 8vw, 5rem) clamp(1rem, 4vw, 3rem)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "28rem" }}>
        <Link href="/" aria-label="OKUHLE home" style={{ display: "inline-block" }}>
          <Emblem size={44} />
        </Link>

        <p className="eyebrow" style={{ marginTop: "1.75rem" }}>
          {eyebrow}
        </p>
        <h1 style={{ fontSize: "clamp(1.9rem, 6vw, 2.6rem)", margin: "0.6rem 0 0" }}>{title}</h1>
        {lead && (
          <p style={{ color: "var(--fg-muted)", margin: "0.9rem 0 0", fontSize: "0.95rem" }}>
            {lead}
          </p>
        )}

        <div style={{ marginTop: "2rem" }}>{children}</div>

        {footer && (
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--line)",
              color: "var(--fg-muted)",
              fontSize: "0.88rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** A labelled input. Labels are real <label>s, not placeholders. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", marginBottom: "1.1rem" }}>
      <span
        style={{
          display: "block",
          fontSize: "0.72rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--fg-muted)",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span
          style={{
            display: "block",
            fontSize: "0.76rem",
            color: "var(--fg-muted)",
            marginTop: "0.4rem",
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

/** Error and success notices, styled the same way everywhere. */
export function Notice({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const colour =
    tone === "error" ? "#c0392b" : tone === "success" ? "var(--accent)" : "var(--fg-muted)";
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      style={{
        color: colour,
        fontSize: "0.88rem",
        margin: "0 0 1.1rem",
        borderLeft: `2px solid ${colour}`,
        paddingLeft: "0.8rem",
      }}
    >
      {children}
    </p>
  );
}

/**
 * A consent checkbox. Never checked by default — `defaultChecked` is not a
 * prop this component accepts, which is the cheapest way to make sure nobody
 * pre-ticks one by accident later.
 */
export function ConsentCheckbox({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: "0.7rem",
        alignItems: "flex-start",
        marginBottom: "1rem",
        fontSize: "0.85rem",
        color: "var(--fg-muted)",
        cursor: "pointer",
        lineHeight: 1.5,
      }}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "auto", marginTop: "0.2rem", flexShrink: 0 }}
      />
      <span>{children}</span>
    </label>
  );
}
