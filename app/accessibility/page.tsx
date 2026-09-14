import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Accessibility"
        title="Accessibility"
        lead="An honest note on how usable this site is today, and how to reach us if it isn't working for you."
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>Where we stand</h2>
          <p>
            {site.name} has not been formally audited or certified against WCAG or any other
            accessibility standard, and we won&apos;t claim otherwise. What follows is what is
            actually true of the site today, not a target we&apos;re assuming we&apos;ve hit.
          </p>

          <h2>What&apos;s already in place</h2>
          <ul>
            <li>Every product and gallery photo carries descriptive alt text, not a filename or a blank tag.</li>
            <li>
              Navigation, forms and buttons are built from standard HTML elements (links, buttons,
              form fields) rather than custom controls, so keyboard navigation and screen readers
              work the way they expect to.
            </li>
            <li>
              Colours are chosen for contrast against the background in both light and dark mode,
              not purely for look.
            </li>
            <li>
              Motion respects your device&apos;s reduced-motion setting — animations shorten to
              effectively nothing if you&apos;ve asked your system for that.
            </li>
          </ul>

          <h2>Where it probably still falls short</h2>
          <p>
            We haven&apos;t run this past a screen reader user or an automated audit tool, so there
            are almost certainly gaps we don&apos;t know about yet — a focus order that jumps
            oddly, a colour combination that&apos;s technically borderline, a form error that
            isn&apos;t announced clearly. We&apos;d rather say that plainly than imply a level of
            testing that hasn&apos;t happened.
          </p>

          <h2>Tell us if something isn&apos;t working</h2>
          <p>
            If any part of this site is difficult or impossible to use with the tools you rely on,
            message us on{" "}
            <a
              href={whatsappLink(
                `Hi ${site.name}! I'm having trouble using part of the website — here's what's happening:`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>{" "}
            or email{" "}
            <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>. We&apos;ll fix what
            we can and tell you honestly if something will take longer.
          </p>

          <h2>Ongoing commitment</h2>
          <p>
            Accessibility isn&apos;t a one-time checklist here — as the site grows, new pages and
            features get built with the same standard-HTML, real-alt-text approach described
            above, and this page gets updated if that changes.
          </p>
        </LegalBody>
      </Container>
    </>
  );
}
