import Link from "next/link";
import { site } from "@/lib/site";
import { Emblem } from "./Logo";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-sunken)",
        borderTop: "1px solid var(--line)",
        padding: "4rem clamp(1rem, 4vw, 3rem) 2rem",
        marginTop: "4rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gap: "2.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
        >
          <div style={{ maxWidth: "22rem" }}>
            <Emblem size={44} />
            <p style={{ color: "var(--fg-muted)", marginTop: "1rem", fontSize: "0.9rem" }}>
              {site.tagline} Est. {site.established}.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {site.socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${s.name} — ${s.handle}`}
                  style={{
                    color: "var(--fg-muted)",
                    textDecoration: "none",
                    fontSize: "0.72rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    border: "1px solid var(--line)",
                    borderRadius: "999px",
                    padding: "0.4rem 0.85rem",
                  }}
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Explore" links={site.footer.explore} />

          <div>
            <h3 style={columnTitle}>Contact</h3>
            <ul style={listStyle}>
              <li>
                <a href={`tel:${site.contact.phoneDisplay.replace(/\s/g, "")}`} style={linkStyle}>
                  {site.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`} style={linkStyle}>
                  {site.contact.email}
                </a>
              </li>
              <li style={{ color: "var(--fg-muted)", fontSize: "0.88rem" }}>
                {site.contact.location}
              </li>
            </ul>
          </div>

          <FooterColumn title="Legal" links={site.footer.legal} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--line)",
            color: "var(--fg-muted)",
            fontSize: "0.78rem",
          }}
        >
          <span>
            <span style={{ display: "block" }}>
              © {site.established} {site.name}. All rights reserved.
            </span>
            <span style={{ display: "block", fontSize: "0.75rem", marginTop: "0.3rem" }}>
              Website by{" "}
              <a
                href="https://aggrandizewebco.github.io"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit" }}
              >
                Aggrandize Web Co
              </a>
            </span>
          </span>
          <span>Beautifully Bold — Est. {site.established}</span>
        </div>
      </div>
    </footer>
  );
}

const columnTitle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.72rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--accent)",
  marginBottom: "1rem",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const linkStyle: React.CSSProperties = {
  color: "var(--fg-muted)",
  textDecoration: "none",
  fontSize: "0.88rem",
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 style={columnTitle}>{title}</h3>
      <ul style={listStyle}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} style={linkStyle}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
