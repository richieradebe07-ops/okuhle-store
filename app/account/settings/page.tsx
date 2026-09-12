import type { Metadata } from "next";
import Link from "next/link";
import { LoadFailure, SectionTitle, formatDate } from "@/components/AccountBits";
import { Outstanding } from "@/components/Outstanding";
import { requireSession } from "@/lib/auth";
import { loadAccount, loadConsents } from "@/lib/account";
import { latestMarketingConsent, type ConsentRow } from "@/lib/consent";
import { legal } from "@/lib/legal";
import { site, whatsappLink } from "@/lib/site";
import { DeleteAccount, MarketingToggle, PasswordChange } from "./SettingsForms";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

/**
 * Settings, and the POPIA data-subject rights in one place.
 *
 * Chapter 3 of POPIA gives people specific rights — to know what is held
 * (s23), to have it corrected (s24), to have it deleted (s24), and to stop
 * direct marketing (s69(3)(b)). Burying any of those behind "email us" is how
 * they become theoretical, so each one is a control on this page. Correction
 * is the exception and is honest about why: names and addresses live on
 * orders that have already shipped, and a person needs to make that change.
 */
export default async function SettingsPage() {
  const session = await requireSession("/account/settings");

  let consents: ConsentRow[] | null = null;
  let paidOrders = 0;
  try {
    const [rows, snapshot] = await Promise.all([
      loadConsents(session.user.id, session.accessToken),
      loadAccount(session.user.id, session.accessToken),
    ]);
    consents = rows;
    paidOrders = snapshot.paidOrders.length;
  } catch (err) {
    console.error("[account/settings] load failed:", err);
  }

  const marketing = consents ? await latestMarketingConsent(consents) : null;

  return (
    <>
      <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", margin: "0 0 0.75rem" }}>Settings</h1>
      <p style={{ color: "var(--fg-muted)", margin: "0 0 3rem", maxWidth: "42rem" }}>
        Your details, your email preferences, and your rights over the information we hold —
        actioned here rather than by request.
      </p>

      {!consents && (
        <div style={{ marginBottom: "3rem" }}>
          <LoadFailure what="settings" />
        </div>
      )}

      {/* ---------------- Marketing email ---------------- */}
      <section style={{ marginBottom: "clamp(2.5rem, 6vw, 4rem)" }}>
        <SectionTitle>Email</SectionTitle>
        {consents ? (
          <>
            <MarketingToggle initial={marketing?.granted ?? false} />
            {marketing && (
              <p style={{ color: "var(--fg-muted)", marginTop: "1rem", fontSize: "0.8rem" }}>
                Last changed {formatDate(marketing.at)}.
              </p>
            )}
          </>
        ) : null}
      </section>

      {/* ---------------- Your details ---------------- */}
      <section style={{ marginBottom: "clamp(2.5rem, 6vw, 4rem)" }}>
        <SectionTitle>Your details</SectionTitle>
        <div className="card" style={{ padding: "1.5rem" }}>
          <dl style={{ margin: 0, display: "grid", gap: "1rem" }}>
            <div>
              <dt
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                }}
              >
                Email
              </dt>
              <dd style={{ margin: "0.3rem 0 0" }}>{session.user.email}</dd>
            </div>
            <div>
              <dt
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                }}
              >
                First name
              </dt>
              <dd style={{ margin: "0.3rem 0 0" }}>{session.user.firstName ?? "Not given"}</dd>
            </div>
            <div>
              <dt
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                }}
              >
                Account created
              </dt>
              <dd style={{ margin: "0.3rem 0 0" }}>{formatDate(session.user.createdAt)}</dd>
            </div>
          </dl>

          <p style={{ color: "var(--fg-muted)", margin: "1.5rem 0 0", fontSize: "0.86rem" }}>
            <strong style={{ color: "var(--fg)" }}>Something wrong?</strong> POPIA section 24 gives
            you the right to have it corrected, and we&apos;ll do it the same day. A name or
            delivery address on an order that has already gone out has to be changed by a person
            rather than a form, so{" "}
            <a
              href={whatsappLink(`Hi ${site.name}, I need to correct a detail on my account.`)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              message us on WhatsApp
            </a>{" "}
            or email{" "}
            {legal.informationOfficer.email ? (
              <a href={`mailto:${legal.informationOfficer.email}`} style={{ color: "var(--accent)" }}>
                {legal.informationOfficer.email}
              </a>
            ) : (
              <Outstanding>Information Officer email</Outstanding>
            )}
            .
          </p>
        </div>
      </section>

      {/* ---------------- Password ---------------- */}
      <section style={{ marginBottom: "clamp(2.5rem, 6vw, 4rem)" }}>
        <SectionTitle>Password</SectionTitle>
        <div style={{ maxWidth: "26rem" }}>
          <PasswordChange />
        </div>
      </section>

      {/* ---------------- Your data ---------------- */}
      <section style={{ marginBottom: "clamp(2.5rem, 6vw, 4rem)" }}>
        <SectionTitle>Your data</SectionTitle>

        <div className="card" style={{ padding: "1.75rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Download everything we hold</h3>
          <p style={{ color: "var(--fg-muted)", margin: "0.75rem 0 1.5rem", fontSize: "0.9rem" }}>
            POPIA section 23 — the right of access. A JSON file with your account, every order,
            every point, and the full record of what you agreed to and when. No waiting, no
            request form.
          </p>
          <a className="btn btn-ghost" href="/api/account/export" download>
            Download my data
          </a>
        </div>

        {consents && consents.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>
              What you&apos;ve agreed to
            </h3>
            <div className="card" style={{ padding: "0.5rem 1.5rem" }}>
              {consents.map((row, i) => (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.9rem 0",
                    borderBottom: i === consents.length - 1 ? "none" : "1px solid var(--line)",
                    fontSize: "0.86rem",
                  }}
                >
                  <span>
                    {row.kind === "terms"
                      ? "Terms & Conditions"
                      : row.kind === "privacy"
                        ? "Privacy Policy"
                        : "Marketing email"}
                    {row.document_version && (
                      <span style={{ color: "var(--fg-muted)" }}> · v{row.document_version}</span>
                    )}
                    <span style={{ display: "block", color: "var(--fg-muted)", fontSize: "0.78rem" }}>
                      via {row.source.replace(/_/g, " ")} · {formatDate(row.created_at)}
                    </span>
                  </span>
                  <span
                    style={{
                      color: row.granted ? "var(--accent)" : "var(--fg-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.granted ? "Agreed" : "Declined"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.05rem", margin: "0 0 1rem" }}>How long we keep things</h3>
          <div className="card" style={{ padding: "0.5rem 1.5rem" }}>
            {legal.retention.map(([what, how], i) => (
              <div
                key={what}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  padding: "0.85rem 0",
                  borderBottom:
                    i === legal.retention.length - 1 ? "none" : "1px solid var(--line)",
                  fontSize: "0.86rem",
                  flexWrap: "wrap",
                }}
              >
                <span>{what}</span>
                <span style={{ color: "var(--fg-muted)", textAlign: "right" }}>{how}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--fg-muted)", marginTop: "1rem", fontSize: "0.8rem" }}>
            The full picture, including who we share data with and where they are, is in the{" "}
            <Link href="/privacy" style={{ color: "var(--fg-muted)" }}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------------- Deletion ---------------- */}
      <section>
        <SectionTitle>Close your account</SectionTitle>
        <DeleteAccount paidOrders={paidOrders} />
      </section>
    </>
  );
}
