import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your OKUHLE account for your orders, points and member benefits.",
};

export default async function LoginPage() {
  // Already signed in? There is nothing on this page for them.
  if (await currentUser()) redirect("/account");

  return (
    <AuthShell
      eyebrow="Your account"
      title="Sign in"
      lead="Your orders, your points, and your Okuhle+ benefits in one place."
      footer={
        <>
          No account yet?{" "}
          <Link href="/signup" style={{ color: "var(--accent)" }}>
            Create one
          </Link>{" "}
          — it&apos;s free, and it&apos;s how you earn points.
          <br />
          <br />
          Just checking on an order?{" "}
          <Link href="/track" style={{ color: "var(--fg-muted)" }}>
            Track it with your order number
          </Link>
          .
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
