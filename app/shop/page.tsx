import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { ShopGrid } from "./ShopGrid";
import { payfastConfigured } from "@/lib/payfast";
import { ratingSummaries } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Golf tees, tees, baggy fits, sweaters and hoodies — made to order in Pietermaritzburg.",
};

/** Picks up newly published reviews without waiting for a deploy. */
export const revalidate = 300;

export default async function ShopPage() {
  const summaries = await ratingSummaries();

  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title="Shop OKUHLE"
        lead="Every piece is made to order. Pick a colour and size, and we'll confirm sizing and availability with you on WhatsApp before anything is made."
      />
      <Container style={{ padding: "3rem clamp(1rem, 4vw, 3rem)" }}>
        <ShopGrid checkoutEnabled={payfastConfigured()} summaries={summaries} />
      </Container>
    </>
  );
}
