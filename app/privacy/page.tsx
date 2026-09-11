import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" lead="How we handle your information." />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>What we collect</h2>
          <p>
            When you order, we collect your name, contact number, delivery address and the details
            of what you ordered. If you join our mailing list we store your email address. If you
            become an Okuhle+ member we also store your membership status and billing reference.
          </p>

          <h2>What we use it for</h2>
          <p>
            To make and deliver your order, to answer your messages, to send you drop announcements
            if you asked for them, and to run the Okuhle+ membership. Nothing else.
          </p>

          <h2>What we do not do</h2>
          <p>
            We do not sell your information, and we do not share it with anyone except the couriers
            and payment providers who need it to deliver your order and process your payment.
          </p>

          <h2>Card details</h2>
          <p>
            We never see or store your full card details. Payments are handled by our payment
            provider on their own secure infrastructure.
          </p>

          <h2>Your choices</h2>
          <p>
            You can unsubscribe from our emails at any time using the link in any email. You can ask
            us to show you, correct, or delete the information we hold about you by messaging us at{" "}
            {site.contact.email}.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy: {site.contact.email} or {site.contact.phoneDisplay}.
          </p>
        </LegalBody>
      </Container>
    </>
  );
}
