import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@/components/Section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "OKUHLE is a made-to-order streetwear label out of Mvundlweni, Pietermaritzburg. No middleman, no markup.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our story"
        title="Born in Pietermaritzburg. Made to mean something."
        lead="Okuhle means “something beautiful” in Zulu. That is the whole brief."
      />

      <Section title="Why OKUHLE">
        <div style={{ maxWidth: "44rem", color: "var(--fg-muted)", display: "grid", gap: "1.25rem" }}>
          <p style={{ margin: 0 }}>
            OKUHLE started in {site.established} out of Mvundlweni, Pietermaritzburg — built on one
            idea: clothing should carry meaning as well as style. Every hoodie, tee and sweater
            carries the OKUHLE emblem, a mark of quality and identity worn by a growing community
            across KwaZulu-Natal.
          </p>
          <p style={{ margin: 0 }}>
            We are not a fast fashion label. We do not sit on warehouses of stock hoping the right
            person walks past. Every piece is cut and made after you order it, in the colour and size
            you actually asked for. That is slower. It is also the reason our pieces fit the people
            who wear them.
          </p>
          <p style={{ margin: 0 }}>
            Selling direct means there is no retailer taking a cut and no markup to cover a shop
            floor. You pay for the garment and the work, not the middle of the supply chain.
          </p>
        </div>
      </Section>

      <Section title="How it works" background="var(--bg-sunken)">
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "1.25rem" }}>
          {[
            ["Pick your piece", "Choose the style, colour and size you want."],
            ["We confirm", "Message us on WhatsApp — we check the details and send you a total."],
            ["We make it", "Production takes 2–3 working days, because it is made for you."],
            ["We ship it", "1–2 days locally, 2–7 days elsewhere in South Africa."],
            ["You wear it", "Tag us and you might end up in the gallery."],
          ].map(([title, body], i) => (
            <li
              key={title}
              className="card"
              style={{ padding: "1.25rem 1.5rem", display: "flex", gap: "1.25rem" }}
            >
              <span className="display" style={{ color: "var(--accent)", fontSize: "1.5rem" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <strong style={{ display: "block" }}>{title}</strong>
                <span style={{ color: "var(--fg-muted)", fontSize: "0.92rem" }}>{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Find us">
        <p style={{ color: "var(--fg-muted)", maxWidth: "36rem" }}>
          We work out of {site.contact.address}. Local collection is welcome — message us first so we
          can have your piece ready and confirm a time.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.75rem" }}>
          <Link className="btn" href="/shop">
            Shop the range
          </Link>
          <Link className="btn btn-ghost" href="/loyalty">
            Free rewards
          </Link>
        </div>
      </Section>
    </>
  );
}
