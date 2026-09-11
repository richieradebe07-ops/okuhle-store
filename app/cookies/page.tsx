import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Cookie Policy"
        lead="What this site stores in your browser, and why."
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>The short version</h2>
          <p>
            This site does not run advertising trackers. What we store is limited to what makes the
            site work for you.
          </p>

          <h2>What we store</h2>
          <ul>
            <li>
              <strong>Your theme choice</strong> — so the site stays in light or dark mode between
              visits.
            </li>
            <li>
              <strong>Your wishlist</strong> — saved pieces are kept in your browser on this device.
              They are not sent to us.
            </li>
            <li>
              <strong>Sign-in session</strong> — if you have an Okuhle+ account, so you stay signed
              in and see member pricing.
            </li>
            <li>
              <strong>Privacy-friendly analytics</strong> — aggregate page-view counts with no
              personal data and no cross-site tracking.
            </li>
          </ul>

          <h2>Clearing it</h2>
          <p>
            Clearing your browser&apos;s site data for this domain removes all of the above. Your
            wishlist will be emptied if you do.
          </p>

          <h2>Contact</h2>
          <p>Questions: {site.contact.email}.</p>
        </LegalBody>
      </Container>
    </>
  );
}
