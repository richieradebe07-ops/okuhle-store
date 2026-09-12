import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Keeps preview deployments out of search results.
 *
 * A full copy of the shop sitting on a netlify.app subdomain is not a
 * harmless curiosity: Google treats it as duplicate content and it can
 * outrank or cannibalise the real store. Only the live domain is allowed to
 * be indexed, so a preview can never compete with it by accident.
 */
const PRODUCTION_HOSTS = ["ohyokuhle.co.za", "www.ohyokuhle.co.za"];

export default function robots(): MetadataRoute.Robots {
  let host = "";
  try {
    host = new URL(siteUrl()).host;
  } catch {
    host = "";
  }

  const isProduction = PRODUCTION_HOSTS.includes(host);

  if (!isProduction) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here is secret, but there is no reason for a crawler to
        // index someone's account area or an order-status form.
        disallow: ["/account", "/account/", "/api/", "/login", "/signup", "/reset-password", "/track"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
