"use client";

/**
 * Stars, in two modes.
 *
 * The read-only one is decorative and carries its meaning in an aria-label,
 * so a screen reader hears "4 out of 5" rather than five identical glyphs.
 * The input one is a real radio group — keyboard-operable and submittable —
 * rather than a row of divs with click handlers.
 */

export function Stars({ rating, size = "1rem" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating);
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5`}
      style={{ color: "var(--accent)", fontSize: size, letterSpacing: "0.08em", whiteSpace: "nowrap" }}
    >
      <span aria-hidden="true">
        {"★".repeat(rounded)}
        <span style={{ opacity: 0.3 }}>{"★".repeat(5 - rounded)}</span>
      </span>
    </span>
  );
}

export function StarInput({
  value,
  onChange,
  name = "rating",
}: {
  value: number | null;
  onChange: (value: number) => void;
  name?: string;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--fg-muted)",
          marginBottom: "0.5rem",
          padding: 0,
        }}
      >
        Your rating
      </legend>
      <div style={{ display: "flex", gap: "0.15rem" }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = value !== null && star <= value;
          return (
            <label
              key={star}
              style={{ cursor: "pointer", lineHeight: 1 }}
              title={`${star} out of 5`}
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                // Visually hidden, but still focusable and in the tab order.
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                  whiteSpace: "nowrap",
                  border: 0,
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  fontSize: "1.7rem",
                  color: active ? "var(--accent)" : "var(--line-strong, var(--fg-muted))",
                  opacity: active ? 1 : 0.35,
                  transition: "opacity 0.15s ease, color 0.15s ease",
                }}
              >
                ★
              </span>
              <span
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                }}
              >
                {star} out of 5
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
