import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of an OKUHLE order with your order number and email address.",
};

export default function TrackPage() {
  return (
    <AuthShell
      eyebrow="Order status"
      title="Track your order"
      lead="Your order number and the email address on the order. We need both."
      footer={
        <>
          Why both? An order number gets printed on packaging and pasted into chats, so on its own
          it isn&apos;t a secret. Asking for the email too means a number someone happens to see
          can&apos;t be used to look up a stranger&apos;s order — and this page never shows an
          address or a phone number to anyone.
          <br />
          <br />
          Got an account?{" "}
          <Link href="/account/orders" style={{ color: "var(--accent)" }}>
            Your orders are all listed there
          </Link>
          .
        </>
      }
    >
      <TrackForm />
    </AuthShell>
  );
}
