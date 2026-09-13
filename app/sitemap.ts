import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { drops } from "@/lib/drops";
import { siteUrl } from "@/lib/site";

/**
 * Only the pages a stranger should arrive on.
 *
 * Deliberately excluded: the account area, the auth pages, the order-status
 * form and the cancelled/confirmed pages. None of them mean anything without
 * the session or the order that led there, and a search result landing
 * someone on "order cancelled" is worse than no result at all.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/shop", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/drops", priority: 0.7 },
    { path: "/gallery", priority: 0.6 },
    { path: "/okuhle-plus", priority: 0.8 },
    { path: "/loyalty", priority: 0.6 },
    { path: "/reviews", priority: 0.7 },
    { path: "/faq", priority: 0.5 },
    { path: "/order", priority: 0.6 },
    { path: "/shipping", priority: 0.4 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
    { path: "/cookies", priority: 0.2 },
  ];

  return [
    ...pages.map(({ path, priority }) => ({
      url: `${base}${path}`,
      lastModified: now,
      priority,
    })),
    ...products
      .filter((product) => product.active)
      .map((product) => ({
        url: `${base}/shop/${product.id}`,
        lastModified: now,
        priority: 0.8,
      })),
    ...drops.map((drop) => ({
      url: `${base}/drops/${drop.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
