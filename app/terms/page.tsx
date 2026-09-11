import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { site } from "@/lib/site";
import { membership } from "@/lib/membership";
import { formatRand } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        lead="The agreement between you and OKUHLE when you order."
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>Orders</h2>
          <p>
            Every piece is made to order. An order is confirmed once we have agreed the piece,
            colour, size and total with you, and payment (or a lay-by deposit) has been received.
          </p>

          <h2>Pricing</h2>
          <p>
            All prices are in South African Rand and include VAT where applicable. Bulk pricing and
            Okuhle+ member pricing are applied at the time of order.
          </p>

          <h2>Production and delivery times</h2>
          <p>
            Production takes 2–3 working days. Delivery estimates are given in good faith but depend
            on the courier; we are not liable for courier delays outside our control.
          </p>

          <h2>Lay-by</h2>
          <p>
            Lay-by runs over 2–3 months with no interest or admin fee. Production starts on deposit,
            and the piece ships once the final payment clears. If a lay-by is abandoned for more than
            60 days without contact, we may re-list the piece and refund payments made, less the
            deposit.
          </p>

          <h2>Returns and exchanges</h2>
          <p>
            Because pieces are made to order we do not accept change-of-mind returns. Faulty or
            incorrect items: message us within 7 days of delivery and we will replace or refund.
            Size exchanges are possible within 7 days on unworn, unwashed items with tags attached.
          </p>

          <h2>Okuhle+ membership</h2>
          <p>
            Okuhle+ costs {formatRand(membership.monthlyPrice)} per month, with the first month at{" "}
            {formatRand(membership.firstMonthPrice)}. It renews monthly until you cancel. Cancelling
            stops future billing; it does not refund months already paid. Benefits run until the end
            of the paid period.
          </p>

          <h2>Intellectual property</h2>
          <p>
            The OKUHLE name, emblem and designs belong to us. Buying a piece does not grant a right
            to reproduce the emblem or designs commercially.
          </p>

          <h2>Contact</h2>
          <p>
            {site.contact.email} · {site.contact.phoneDisplay} · {site.contact.address}
          </p>
        </LegalBody>
      </Container>
    </>
  );
}
