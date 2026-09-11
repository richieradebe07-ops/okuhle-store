import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { Accordion } from "@/components/Accordion";
import { faqs } from "@/lib/faqs";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Sizing, ordering, lay-by, shipping, returns and rewards — everything you need before you order.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        lead="Everything you need to know before you order. Can't find your answer? Message us directly on WhatsApp."
      />

      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <div style={{ maxWidth: "46rem", display: "grid", gap: "3rem" }}>
          {faqs.map((section) => (
            <section key={section.title}>
              <h2
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: "0.5rem",
                }}
              >
                {section.title}
              </h2>
              {section.items.map((item) => (
                <Accordion key={item.q} q={item.q} a={item.a} />
              ))}
            </section>
          ))}

          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.6rem" }}>Still stuck?</h2>
            <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 1.5rem" }}>
              Message us on WhatsApp and a real person in Pietermaritzburg will answer.
            </p>
            <a
              className="btn"
              href={whatsappLink(`Hi ${site.name}! I have a question:`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
