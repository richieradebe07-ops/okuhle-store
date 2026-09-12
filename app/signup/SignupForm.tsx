"use client";

import Link from "next/link";
import { useState } from "react";
import { ConsentCheckbox, Field, Notice } from "@/components/AuthShell";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

/**
 * Account creation.
 *
 * TWO SEPARATE CHECKBOXES, BOTH UNTICKED, and only one of them is required.
 * The marketing box is not wired to the submit guard at all — the form
 * submits happily with it left alone, which is the behaviour POPIA s69
 * actually requires. Bundling the two, or pre-ticking either, would be the
 * easiest thing in the world to do by accident, so the state starts false and
 * the submit check only ever looks at `acceptedTerms`.
 */
export function SignupForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("You need to accept the Terms and the Privacy Policy to open an account.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          email,
          password,
          acceptedTerms,
          marketingConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create your account.");
      setDone(data.message ?? "Check your email for the confirmation link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <>
        <Notice tone="success">{done}</Notice>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.88rem" }}>
          Nothing arrives in a few minutes? Check the spam folder, then{" "}
          <Link href="/signup" style={{ color: "var(--accent)" }}>
            try again
          </Link>{" "}
          — or message us on WhatsApp and a person will sort it out.
        </p>
      </>
    );
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      <form onSubmit={submit}>
        <Field label="First name" hint="So emails don't start with &ldquo;Dear customer&rdquo;.">
          <input
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </Field>

        <Field
          label="Password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters. A short phrase beats a clever word.`}
        >
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <div style={{ margin: "1.5rem 0 1.25rem" }}>
          {/* Required. This is the only box that gates the account. */}
          <ConsentCheckbox name="acceptedTerms" checked={acceptedTerms} onChange={setAcceptedTerms}>
            I accept the{" "}
            <Link href="/terms" style={{ color: "var(--accent)" }}>
              Terms &amp; Conditions
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" style={{ color: "var(--accent)" }}>
              Privacy Policy
            </Link>
            .
          </ConsentCheckbox>

          {/* Optional, and separate. Leaving it alone does not block anything. */}
          <ConsentCheckbox
            name="marketingConsent"
            checked={marketingConsent}
            onChange={setMarketingConsent}
          >
            Email me about new drops and member-only pieces.{" "}
            <em>Optional</em> — your account works exactly the same either way, and you can change
            your mind in your settings at any time.
          </ConsentCheckbox>
        </div>

        <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Creating your account…" : "Create my account"}
        </button>
      </form>
    </>
  );
}
