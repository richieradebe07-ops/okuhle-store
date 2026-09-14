"use client";

import { useEffect, useRef } from "react";

/**
 * Signature gold-petal falling effect, homepage only (see Part A of the
 * brief this implements — scope was deliberately kept to one page rather
 * than run a decorative animation layer's performance cost site-wide).
 *
 * Two implementations, feature-detected:
 *   1. Native CSS scroll-driven animation (animation-timeline: scroll(root))
 *      — runs on the compositor thread, stays smooth on low-end phones.
 *      Chrome/Edge 115+, Safari 26+. NOT Firefox.
 *   2. A JS fallback for browsers without it (Firefox, older Safari):
 *      IntersectionObserver + a scroll listener that only exists while
 *      this layer is actually mounted and in view — never a global
 *      scroll listener running for the page's whole lifetime.
 *
 * Placeholder vector petal shape and the site's existing --gold/--gold-bright
 * (already the theme's accent colour — see app/globals.css). Swap the path
 * in PETAL_PATH for commissioned artwork later; nothing else needs to change.
 *
 * The CSS (.petal-layer, .petal, @keyframes, @supports, reduced-motion) lives
 * in app/globals.css rather than a styled-jsx block here — that CSS has to
 * be present on the very first paint. A "use client" component's styled-jsx
 * can inject after hydration, and for a fraction of a second the petals
 * would render unstyled (in normal document flow, not position:fixed),
 * pushing page content down and then snapping back once the real styles
 * land — a real, measured layout shift, not a hypothetical one.
 */

const PETAL_PATH = "M8 0C11 3 13 7 8 16C3 7 5 3 8 0Z";

/**
 * Hardcoded per-petal stagger — left position, size, rotation, fall
 * distance, and rangeStart (the % of the page's scroll range at which this
 * petal starts falling — 0 falls the whole way down, 30 only starts once
 * the visitor is 30% down the page). Fifteen is the desktop cap from the
 * brief's performance budget; tablet/mobile caps are applied in CSS below
 * via nth-child, not by rendering fewer elements (avoids any hydration
 * mismatch between server and client petal counts).
 *
 * rangeStart is the stagger mechanism, not animation-delay: a scroll-linked
 * timeline (animation-timeline: scroll()) combined with a TIME-based delay
 * and animation-iteration-count: infinite is spec-ambiguous in a bounded
 * scroll range — verified this rendered every petal frozen at its final
 * keyframe regardless of scroll position. iteration-count: 1 mapped onto a
 * per-petal animation-range instead is unambiguous: exactly one pass,
 * directly proportional to scroll.
 */
const PETALS = [
  { left: 4, size: 14, rot: 10, drift: 18, rangeStart: 0 },
  { left: 12, size: 10, rot: -15, drift: -12, rangeStart: 12 },
  { left: 20, size: 16, rot: 25, drift: 24, rangeStart: 4 },
  { left: 28, size: 11, rot: -8, drift: -20, rangeStart: 18 },
  { left: 36, size: 13, rot: 18, drift: 10, rangeStart: 8 },
  { left: 44, size: 9, rot: -22, drift: -16, rangeStart: 22 },
  { left: 52, size: 15, rot: 12, drift: 22, rangeStart: 2 },
  { left: 60, size: 10, rot: -18, drift: -10, rangeStart: 15 },
  { left: 68, size: 14, rot: 20, drift: 16, rangeStart: 6 },
  { left: 76, size: 11, rot: -12, drift: -22, rangeStart: 25 },
  { left: 82, size: 12, rot: 8, drift: 14, rangeStart: 0 },
  { left: 88, size: 16, rot: -20, drift: -18, rangeStart: 10 },
  { left: 94, size: 9, rot: 15, drift: 20, rangeStart: 20 },
  { left: 58, size: 13, rot: -10, drift: -14, rangeStart: 3 },
  { left: 16, size: 10, rot: 22, drift: 12, rangeStart: 16 },
];

/** The exact check the brief specifies — a looser one lets partial-support
 * browsers render a broken effect instead of falling back cleanly. */
const SUPPORTS_SCROLL_DRIVEN =
  typeof CSS !== "undefined" &&
  CSS.supports("(animation-timeline: view()) and (animation-range: entry)");

export function PetalLayer() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (SUPPORTS_SCROLL_DRIVEN) return; // native CSS handles it, nothing to do
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    const petals = Array.from(layer.querySelectorAll<HTMLElement>("[data-petal]"));
    let ticking = false;
    let observing = false;

    function apply() {
      const doc = document.documentElement;
      const range = doc.scrollHeight - window.innerHeight;
      const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;

      petals.forEach((el, i) => {
        const p = PETALS[i];
        if (!p) return;
        // Mirrors the CSS animation-range stagger: this petal doesn't start
        // falling until scroll passes its rangeStart.
        const start = p.rangeStart / 100;
        const local = start >= 1 ? 0 : Math.min(1, Math.max(0, (progress - start) / (1 - start)));
        const y = -10 + local * 130; // vh, falls past the bottom of the page
        const x = Math.sin(local * Math.PI * 2 + i) * p.drift * 0.3;
        const rot = p.rot + local * 90;
        el.style.transform = `translate3d(${x}px, ${y}vh, 0) rotate(${rot}deg)`;
      });
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const inView = entries[0]?.isIntersecting;
        if (inView && !observing) {
          observing = true;
          apply();
          window.addEventListener("scroll", onScroll, { passive: true });
        } else if (!inView && observing) {
          observing = false;
          window.removeEventListener("scroll", onScroll);
        }
      },
      { threshold: 0 }
    );
    io.observe(layer);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={layerRef} className="petal-layer" aria-hidden="true">
      {PETALS.map((p, i) => (
        <svg
          key={i}
          data-petal
          className="petal"
          width={p.size}
          height={p.size * 2}
          viewBox="0 0 16 16"
          style={
            {
              left: `${p.left}%`,
              "--petal-rot": `${p.rot}deg`,
              "--petal-drift": `${p.drift}px`,
              "--petal-range-start": `${p.rangeStart}%`,
            } as React.CSSProperties
          }
        >
          <path d={PETAL_PATH} fill="var(--accent)" />
        </svg>
      ))}
    </div>
  );
}
