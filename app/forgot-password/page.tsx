import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Send yourself a link to set a new OKUHLE password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password"
      title="Reset your password"
      lead="We'll email you a link. It works once, and it expires after an hour."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
          .
        </>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
