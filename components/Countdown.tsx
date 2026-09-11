"use client";

import { useEffect, useState } from "react";

/** Black Friday 2026 — Friday 27 November, South African time (UTC+2). */
export const BLACK_FRIDAY = new Date("2026-11-27T00:00:00+02:00");
/** The banner only appears this many days out. No permanent fake urgency. */
const SHOW_WITHIN_DAYS = 17;
const DAY_MS = 24 * 60 * 60 * 1000;

function parts(ms: number) {
  return {
    days: Math.floor(ms / DAY_MS),
    hours: Math.floor((ms % DAY_MS) / (60 * 60 * 1000)),
    minutes: Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000)),
  };
}

/**
 * Counts down to Black Friday. Renders nothing outside the window and nothing
 * once the date passes — a countdown that resets is a lie.
 */
export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(BLACK_FRIDAY.getTime() - Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;
  if (remaining <= 0 || remaining > SHOW_WITHIN_DAYS * DAY_MS) return null;

  const { days, hours, minutes } = parts(remaining);

  return (
    <div
      style={{
        background: "var(--fg)",
        color: "var(--bg)",
        textAlign: "center",
        padding: "0.6rem 1rem",
        fontSize: "0.75rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      Black Friday drop in {days}d {hours}h {minutes}m
    </div>
  );
}
