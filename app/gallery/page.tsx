import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader, Container } from "@/components/Section";
import { lookbook } from "@/lib/products";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: "The OKUHLE range, colourway by colourway. Tag us and get featured.",
};

export default function GalleryPage() {
  const shots = lookbook();

  return (
    <>
      <PageHeader
        eyebrow="The lookbook"
        title="Every colourway"
        lead="The full range, colour by colour. Wearing yours? Tag us and we'll put you up here."
      />

      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {shots.map((shot) => (
            <Link
              key={shot.src}
              href={shot.href}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                background: "#ffffff",
                border: "1px solid var(--line)",
                overflow: "hidden",
                display: "block",
              }}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(max-width: 700px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            </Link>
          ))}
        </div>

        <div className="card" style={{ padding: "2rem", marginTop: "2.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Get featured</h2>
          <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 1.5rem", maxWidth: "34rem" }}>
            Tag {site.socials[0].handle} on Instagram or {site.socials[1].handle} on TikTok and your
            shot goes up here alongside the range.
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
