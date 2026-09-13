"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/rewards", label: "Points" },
  { href: "/account/settings", label: "Settings" },
];

/**
 * `isOwner` is decided on the server and passed in. The moderation page checks
 * again for itself — hiding a link is presentation, never protection.
 */
export function AccountNav({ isOwner = false }: { isOwner?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The cookies are cleared server-side either way; if the request itself
      // failed, sending them to the homepage and refreshing is still correct.
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
        padding: "1rem 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {(isOwner ? [...links, { href: "/account/reviews", label: "Approve reviews" }] : links).map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: "0.76rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: active ? "var(--accent)" : "var(--fg-muted)",
              borderBottom: active ? "1px solid var(--accent)" : "1px solid transparent",
              paddingBottom: "0.3rem",
            }}
          >
            {link.label}
          </Link>
        );
      })}

      <button
        onClick={signOut}
        disabled={signingOut}
        style={{
          marginLeft: "auto",
          background: "transparent",
          border: "none",
          color: "var(--fg-muted)",
          fontSize: "0.76rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </nav>
  );
}
