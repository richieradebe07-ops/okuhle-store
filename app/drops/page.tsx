import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Container, Section } from "@/components/Section";
import { EmailSignup } from "@/components/EmailSignup";
import { drops, dropStatus, activeDrops, archivedDrops } from "@/lib/drops";

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Limited colourways and numbered runs. The base range stays available — drops don't come back.",
};

export default function DropsPage() {
  const active = activeDrops();
  const archive = archivedDrops();

  return (
    <>
      <PageHeader
        eyebrow="Drops"
        title="Limited runs"
        lead="The core range is always available, made to order. Drops are different — limited colourways and numbered runs, open for a window, then gone for good."
      />

      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        {drops.length === 0 ? (
          <div className="card" style={{ padding: "2rem", maxWidth: "36rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Drop 001 is coming</h2>
            <p style={{ color: "var(--fg-muted)", margin: "0.85rem 0 1.5rem" }}>
              The first limited run hasn&apos;t been announced yet. Join the list and you&apos;ll
              hear before it goes public — the list gets a head start every time.
            </p>
            <div id="join">
              <EmailSignup />
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {active.map((d) => (
              <DropCard key={d.slug} slug={d.slug} name={d.name} description={d.description} />
            ))}
          </div>
        )}
      </Container>

      {archive.length > 0 && (
        <Section
          eyebrow="Archive"
          title="Closed drops"
          lead="These are done. They stay up as a record — nothing here is coming back."
          background="var(--bg-sunken)"
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            {archive.map((d) => (
              <Link
                key={d.slug}
                href={`/drops/${d.slug}`}
                className="card"
                style={{
                  padding: "1.25rem 1.5rem",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span>{d.name}</span>
                <span
                  style={{
                    color: "var(--fg-muted)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  {dropStatus(d) === "sold_out" ? "Sold out" : "Closed"}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function DropCard({
  slug,
  name,
  description,
}: {
  slug: string;
  name: string;
  description: string;
}) {
  return (
    <Link
      href={`/drops/${slug}`}
      className="card"
      style={{ padding: "1.75rem", textDecoration: "none", color: "inherit" }}
    >
      <h2 style={{ margin: 0, fontSize: "1.6rem" }}>{name}</h2>
      <p style={{ color: "var(--fg-muted)", margin: "0.6rem 0 0" }}>{description}</p>
    </Link>
  );
}
