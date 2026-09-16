"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { Emblem, Wordmark } from "./Logo";
import { useWishlist } from "./WishlistProvider";
import { useVisitorState } from "./VisitorStateProvider";

/** Person outline. An icon rather than a word, to match the other actions. */
function AccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.5 14c0-2.8 2.5-4.6 5.5-4.6s5.5 1.8 5.5 4.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * One link, two destinations. A visitor with a session goes to their account;
 * everyone else goes to sign in. The dot is the only status signal — a member
 * number in the header would be shouting.
 */
function AccountLink({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, ready } = useVisitorState();
  const signedIn = ready && profile.signedIn;

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className="icon-btn"
      aria-label={signedIn ? "Your account" : "Sign in"}
      title={signedIn ? "Your account" : "Sign in"}
      onClick={onNavigate}
    >
      <AccountIcon />
      {signedIn && profile.member && <span className="member-dot" aria-hidden="true" />}
    </Link>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("okuhle_theme", next);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={flip}
      className="icon-btn"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

/** The account links, spelled out, for the mobile menu. */
function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { profile, ready } = useVisitorState();

  if (ready && profile.signedIn) {
    return (
      <Link href="/account" onClick={onNavigate}>
        My Account
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" onClick={onNavigate}>
        Sign In
      </Link>
      <Link href="/signup" onClick={onNavigate}>
        Create Account
      </Link>
    </>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { items } = useWishlist();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <Emblem size={38} />
          <Wordmark />
        </Link>

        <nav className="desktop-nav">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <AccountLink />
          <Link href="/wishlist" className="icon-btn" aria-label="Wishlist">
            ♥
            {items.length > 0 && <span className="badge">{items.length}</span>}
          </Link>
          <button
            className="icon-btn menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <nav onClick={(e) => e.stopPropagation()}>
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <MobileAccountLinks onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.9rem clamp(1rem, 4vw, 3rem);
          background: color-mix(in srgb, var(--bg) 88%, transparent);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          text-decoration: none;
          color: var(--fg);
        }
        .desktop-nav {
          display: none;
          gap: 1.75rem;
        }
        .desktop-nav :global(a) {
          color: var(--fg-muted);
          text-decoration: none;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }
        .desktop-nav :global(a:hover) {
          color: var(--accent);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-actions :global(.icon-btn) {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--fg);
          font-size: 1rem;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .header-actions :global(.icon-btn:hover) {
          border-color: var(--accent);
          color: var(--accent);
        }
        .header-actions :global(.member-dot) {
          position: absolute;
          top: 0;
          right: 0;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: var(--accent);
          border: 1px solid var(--bg);
        }
        .header-actions :global(.badge) {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 1.1rem;
          height: 1.1rem;
          padding: 0 0.25rem;
          border-radius: 999px;
          background: var(--accent);
          color: var(--accent-fg);
          font-size: 0.62rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: color-mix(in srgb, var(--bg-sunken) 92%, transparent);
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: flex-end;
        }
        .mobile-menu nav {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 6rem 2.5rem 2rem;
          min-width: min(70vw, 320px);
          background: var(--bg);
          border-left: 1px solid var(--line);
          /* The panel is pinned to the full viewport height (.mobile-menu is
             inset: 0), but its content (nav links, each now a 44px tap
             target, plus the account links) can be taller than that on a
             real phone. Without a height + scroll of its own, the links
             past the bottom of the screen were simply unreachable — this
             is the actual fix, not a rewording of the layout. */
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .mobile-menu :global(a) {
          color: var(--fg);
          text-decoration: none;
          font-size: 1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          /* 44px minimum tap target (WCAG 2.5.5) — the font's own line-height
             alone was well under that. */
          display: flex;
          align-items: center;
          min-height: 44px;
        }
        .mobile-menu :global(a:hover) {
          color: var(--accent);
        }
        /*
         * 1240px, not the more conventional ~900px tablet breakpoint — the
         * ten-item nav plus logo plus header actions measures ~1190px at
         * minimum (verified: logo 116px + nav 825px + actions 131px + gaps
         * + padding), so anything narrower genuinely doesn't fit and was
         * overflowing off-screen at common viewports like 1024×768 iPad
         * landscape. Re-measure this if nav items are added or removed.
         */
        @media (min-width: 1240px) {
          .desktop-nav {
            display: flex;
          }
          .menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
