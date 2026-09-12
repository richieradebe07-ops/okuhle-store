/**
 * Legal entity details and document versions.
 *
 * ECTA section 43 and POPIA both require specific disclosures that only the
 * business owner can supply. Anything unknown is `null` here rather than
 * invented — the legal pages render a visible "outstanding" marker in its
 * place, so a missing statutory disclosure cannot ship unnoticed.
 */
export const legal = {
  /** Registered name of the legal entity, if different from the trading name. */
  registeredName: null as string | null,
  /** Sole proprietor / (Pty) Ltd / CC etc. */
  entityType: null as string | null,
  /** CIPC registration number. */
  registrationNumber: null as string | null,
  /** VAT number, if registered. Null is fine — most small businesses are not. */
  vatNumber: null as string | null,

  /**
   * POPIA requires an Information Officer. By default this is the head of the
   * business, automatically, whether or not they have registered — and
   * registration with the Information Regulator is mandatory.
   */
  informationOfficer: {
    name: null as string | null,
    email: null as string | null,
    registeredWithRegulator: false,
  },

  /** Bump when the text materially changes, so consent can be tied to a version. */
  privacyVersion: "2026-09-11",
  termsVersion: "2026-09-11",
  cookieVersion: "2026-09-11",

  /** Where a data subject complains if we don't resolve it. */
  regulator: {
    name: "Information Regulator (South Africa)",
    email: "complaints.IR@justice.gov.za",
    site: "https://inforegulator.org.za",
  },

  /** Processors that receive personal information, and where they sit. */
  processors: [
    {
      name: "PayFast",
      purpose: "Processing card and EFT payments",
      crossBorder: false,
      note: "South African payment gateway. We never see or store full card details.",
      active: false,
    },
    {
      name: "ConvertKit (Kit)",
      purpose: "Sending the email newsletter you asked for",
      crossBorder: true,
      note: "Hosted in the United States — a cross-border transfer under POPIA s72.",
      active: false,
    },
    {
      name: "Netlify",
      purpose: "Hosting this website and serving its pages",
      crossBorder: true,
      note: "Servers outside South Africa. Receives standard web request data.",
      active: true,
    },
    {
      name: "Courier partner",
      purpose: "Delivering your order",
      crossBorder: false,
      note: "Receives your name, delivery address and contact number only.",
      active: true,
    },
  ],

  /** How long each category of personal information is kept. */
  retention: [
    ["Order records", "5 years — required for tax and accounting"],
    ["Account details", "Until you delete the account"],
    ["Newsletter subscription", "Until you unsubscribe"],
    ["Support chat transcripts", "12 months, then deleted"],
    ["Website request logs", "Kept by our host for a short period for security"],
  ],
} as const;

/** True when every statutory disclosure the pages need has been filled in. */
export function legalDetailsComplete() {
  return Boolean(
    legal.registeredName &&
      legal.entityType &&
      legal.registrationNumber &&
      legal.informationOfficer.name &&
      legal.informationOfficer.email
  );
}
