import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { currentUser } from "@/lib/auth";
import { loyalty } from "@/lib/loyalty";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "A free OKUHLE account: order history, points on everything you buy, and first notice when a sold-out size is back.",
};

export default async function SignupPage() {
  if (await currentUser()) redirect("/account");

  return (
    <AuthShell
      eyebrow="Free account"
      title="Create your account"
      lead={`No fee, ever. One point for every R${loyalty.randPerPoint} you spend, and ${loyalty.redeemPoints} points is R${loyalty.redeemValueRand} off.`}
      footer={
        <>
          Already have one?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
          .
          <br />
          <br />
          An account is not required to order — you can buy as a guest, or on WhatsApp. It is
          required to earn points, because points have to attach to somebody.
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
