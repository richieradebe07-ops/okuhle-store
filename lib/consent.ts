/**
 * POPIA consent records.
 *
 * The point of this table is evidence. If someone asks "why do you have my
 * address" or "who said you could email me", the answer has to be a row with
 * a date, the version of the wording they agreed to, where they agreed it and
 * from which IP — not a recollection.
 *
 * Three rules, enforced here rather than left to each caller:
 *  1. Terms and privacy are recorded SEPARATELY, each against its own version.
 *  2. Marketing is recorded even when DECLINED. A row saying granted = false
 *     is what proves the box was not pre-ticked.
 *  3. Nothing is ever updated or deleted. Withdrawing consent appends a new
 *     row with granted = false.
 */
import { serviceQuery, supabaseConfigured } from "./supabase";
import { legal } from "./legal";

export type ConsentKind = "terms" | "privacy" | "marketing";

export type ConsentInput = {
  kind: ConsentKind;
  granted: boolean;
  email: string;
  userId?: string | null;
  /** "signup", "newsletter_form", "account_settings", "whatsapp"… */
  source: string;
  documentVersion?: string | null;
  ipAddress?: string | null;
};

export type ConsentRow = {
  id: string;
  created_at: string;
  kind: ConsentKind;
  granted: boolean;
  document_version: string | null;
  source: string;
  email: string;
};

function versionFor(kind: ConsentKind): string | null {
  if (kind === "terms") return legal.termsVersion;
  if (kind === "privacy") return legal.privacyVersion;
  // Marketing consent isn't consent to a document, so there is no version to
  // pin. The privacy policy version is recorded alongside it at signup.
  return null;
}

/**
 * Appends consent rows.
 *
 * Never throws. A consent record failing to write must not take an account
 * creation down with it — but it IS logged at error level, because a missing
 * record is a compliance gap somebody has to go and fix.
 */
export async function recordConsent(entries: ConsentInput[]): Promise<{ written: number }> {
  if (entries.length === 0) return { written: 0 };

  if (!supabaseConfigured()) {
    console.warn(
      "[consent] Supabase not configured — consent NOT recorded for",
      entries.map((e) => `${e.kind}=${e.granted}`).join(", ")
    );
    return { written: 0 };
  }

  const rows = entries.map((e) => ({
    user_id: e.userId ?? null,
    email: e.email,
    kind: e.kind,
    granted: e.granted,
    document_version: e.documentVersion ?? versionFor(e.kind),
    source: e.source,
    ip_address: e.ipAddress ?? null,
  }));

  try {
    await serviceQuery("consent_records", { method: "POST", body: rows });
    return { written: rows.length };
  } catch (err) {
    console.error("[consent] FAILED to record consent — compliance gap:", err, rows);
    return { written: 0 };
  }
}

/**
 * The three rows a signup produces. Marketing is included whichever way the
 * box was left, so the file shows the choice rather than its absence.
 */
export function signupConsent(input: {
  email: string;
  userId: string;
  acceptedTerms: boolean;
  marketingConsent: boolean;
  ipAddress: string | null;
}): ConsentInput[] {
  const base = {
    email: input.email,
    userId: input.userId,
    source: "signup",
    ipAddress: input.ipAddress,
  };
  return [
    { ...base, kind: "terms", granted: input.acceptedTerms },
    { ...base, kind: "privacy", granted: input.acceptedTerms },
    {
      ...base,
      kind: "marketing",
      granted: input.marketingConsent,
      // Pin which privacy wording was on screen when they chose.
      documentVersion: legal.privacyVersion,
    },
  ];
}

/** Latest marketing decision for an account, or null if never asked. */
export async function latestMarketingConsent(
  rows: ConsentRow[]
): Promise<{ granted: boolean; at: string } | null> {
  const marketing = rows
    .filter((r) => r.kind === "marketing")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (marketing.length === 0) return null;
  return { granted: marketing[0].granted, at: marketing[0].created_at };
}
