import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password"
      title="Set a new password"
      lead="Choose something you'll remember. Changing it signs out anywhere else you were logged in."
    >
      <ResetForm />
    </AuthShell>
  );
}
