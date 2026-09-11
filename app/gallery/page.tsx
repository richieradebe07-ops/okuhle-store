import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { Emblem } from "@/components/Logo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: "OKUHLE worn out in KwaZulu-Natal. Tag us and get featured.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="The community"
        title="Worn in the wild"
        lead="Follow along and see OKUHLE out in KwaZulu-Natal — tag us and get featured."
      />

      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {/* Placeholder tiles — swap for real community photography. */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "1 / 1",
                background: i % 2 ? "var(--bg-sunken)" : "var(--bg-raised)",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Emblem size={64} />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "2rem", marginTop: "2.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Get featured</h2>
          <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 1.5rem", maxWidth: "34rem" }}>
            Wearing yours? Tag {site.socials[0].handle} on Instagram or {site.socials[1].handle} on
            TikTok and we will put you up here.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {site.socials.map((s) => (
              <a
                key={s.name}
                className="btn btn-ghost"
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
