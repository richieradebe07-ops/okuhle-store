export const site = {
  name: "OKUHLE",
  label: "OHY",
  established: 2026,
  region: "RSA",
  tagline: "Beautifully bold streetwear out of Pietermaritzburg, South Africa.",
  heroHeadline: ["Wear Something", "Okuhle."],
  heroSub:
    "Streetwear built on meaning — okuhle means “something beautiful” in Zulu. Golf tees, tees, baggy fits, sweaters and hoodies in black, white and gold, made to order out of KwaZulu-Natal.",
  contact: {
    phoneDisplay: "076 198 1607",
    // international format for wa.me links
    whatsapp: "27761981607",
    email: "hello@ohyokuhle.co.za",
    location: "Pietermaritzburg, KZN",
    address: "M70 Road, Mvundlweni, Pietermaritzburg",
  },
  socials: [
    { name: "Instagram", handle: "@ohy_okuhle", url: "https://instagram.com/ohy_okuhle" },
    { name: "TikTok", handle: "@ohy_okuhle1", url: "https://tiktok.com/@ohy_okuhle1" },
    { name: "Facebook", handle: "OHY Okuhle", url: "https://facebook.com/ohyokuhle" },
    { name: "YouTube", handle: "@OHY_Okuhle", url: "https://youtube.com/@OHY_Okuhle" },
  ],
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Shop", href: "/shop" },
    { label: "Drops", href: "/drops" },
    { label: "Gallery", href: "/gallery" },
    { label: "Okuhle+", href: "/okuhle-plus" },
    { label: "Rewards", href: "/loyalty" },
    { label: "Reviews", href: "/reviews" },
    { label: "FAQ", href: "/faq" },
    { label: "Order", href: "/order" },
  ],
  footer: {
    explore: [
      { label: "Our Story", href: "/about" },
      { label: "Shop", href: "/shop" },
      { label: "Drops", href: "/drops" },
      { label: "Gallery", href: "/gallery" },
      { label: "Okuhle+", href: "/okuhle-plus" },
      { label: "Rewards", href: "/loyalty" },
      { label: "Reviews", href: "/reviews" },
      { label: "FAQ", href: "/faq" },
      { label: "Shipping", href: "/shipping" },
      { label: "Track an Order", href: "/track" },
      { label: "Wishlist", href: "/wishlist" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
};

/** Build a wa.me link with a pre-filled order message. */
export function whatsappLink(message: string) {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatRand(amount: number) {
  return `R${amount.toLocaleString("en-ZA")}`;
}

/**
 * Absolute base URL for links that leave the app — email links and the
 * redirect targets Supabase sends people back to.
 *
 * Falls back to the request's own origin when the env var is unset, so a
 * preview deploy emails preview links rather than localhost ones.
 */
export function siteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (request) {
    try {
      return new URL(request.url).origin;
    } catch {
      // fall through
    }
  }
  return "http://localhost:3000";
}
