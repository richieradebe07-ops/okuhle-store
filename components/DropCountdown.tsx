"use client";

import { useEffect, useState } from "react";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Counts down to a fixed timestamp. When it reaches zero it stops and says so —
 * it never resets or extends, because a timer that does either is a lie and
 * visitors only fall for it once.
 */
export function DropCountdown({ target, label }: { target: string; label: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(new Date(target).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining === null) return null;

  if (remaining <= 0) {
    return (
      <p style={{ marginTop: "1.5rem", color: "var(--fg-muted)" }}>
        {label.replace(/ in$/, "")} — time&apos;s up.
      </p>
    );
  }

  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--fg-muted)",
          margin: "0 0 0.5rem",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", gap: "1.25rem" }}>
        {[
          [days, "days"],
          [hours, "hrs"],
          [minutes, "min"],
          [seconds, "sec"],
        ].map(([value, unit]) => (
          <span key={unit as string} style={{ display: "flex", flexDirection: "column" }}>
            <span className="display" style={{ fontSize: "2rem", color: "var(--accent)" }}>
              {String(value).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "0.62rem", letterSpacing: "0.16em", color: "var(--fg-muted)" }}>
              {unit as string}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
