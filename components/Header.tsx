"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { Emblem, Wordmark } from "./Logo";
import { useWishlist } from "./WishlistProvider";

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
        }
        .mobile-menu :global(a) {
          color: var(--fg);
          text-decoration: none;
          font-size: 1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .mobile-menu :global(a:hover) {
          color: var(--accent);
        }
        @media (min-width: 900px) {
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
