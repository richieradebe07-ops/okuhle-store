/**
 * Email sending via Resend.
 *
 * Deliberate design rules:
 *  - The API key is read from the environment, never hardcoded.
 *  - Sending NEVER throws into the caller. A failed notification must not roll
 *    back or obscure a successful payment — payment state and email state are
 *    independent.
 *  - One retry on a 5xx or a rate limit, then give up and log loudly.
 *  - In development, emails are logged to the console instead of sent, so the
 *    whole flow can be exercised without a key or a verified domain.
 *  - Every attempt is counted, because Resend's free tier allows only 100
 *    emails/day — about 50 orders — and silently hitting that on Black Friday
 *    would mean customers paying and hearing nothing.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_CONTACTS = "https://api.resend.com/audiences";

/** Warn the owner once the day's sends pass this. Free tier hard-caps at 100. */
export const DAILY_SEND_WARNING_THRESHOLD = 80;
export const DAILY_SEND_HARD_CAP = 100;

export type SendResult =
  | { ok: true; id?: string; simulated?: boolean }
  | { ok: false; error: string; queued?: boolean };

export function emailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    audienceId: process.env.RESEND_AUDIENCE_ID ?? "",
    fromEmail: process.env.FROM_EMAIL ?? "",
    fromName: process.env.FROM_NAME ?? "OHY Okuhle",
    ownerEmail: process.env.OWNER_EMAIL ?? "",
  };
}

export function emailConfigured() {
  const { apiKey, fromEmail } = emailConfig();
  return Boolean(apiKey && fromEmail);
}

/* ------------------------------------------------------------------ */
/* Daily send accounting                                              */
/* ------------------------------------------------------------------ */

type SendLog = { day: string; count: number; warned: boolean };

const globalForEmail = globalThis as unknown as {
  __okuhleSendLog?: SendLog;
  __okuhleQueue?: QueuedEmail[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sendLog(): SendLog {
  const existing = globalForEmail.__okuhleSendLog;
  if (!existing || existing.day !== today()) {
    globalForEmail.__okuhleSendLog = { day: today(), count: 0, warned: false };
  }
  return globalForEmail.__okuhleSendLog!;
}

export function sendsToday() {
  return sendLog().count;
}

/**
 * NOTE: this counter lives in process memory, so on serverless hosting it
 * undercounts across instances. It is a smoke alarm, not an accountant — the
 * authoritative number is in the Resend dashboard. Once orders move to Supabase
 * the send log should move with them.
 */
function recordSend() {
  const log = sendLog();
  log.count += 1;

  if (!log.warned && log.count >= DAILY_SEND_WARNING_THRESHOLD) {
    log.warned = true;
    console.warn(
      `[email] ${log.count} sends today — approaching Resend's ${DAILY_SEND_HARD_CAP}/day free-tier cap. ` +
        `Upgrade the Resend plan or order confirmations will stop sending.`
    );
    void notifyOwnerOfQuota(log.count);
  }
}

async function notifyOwnerOfQuota(count: number) {
  const { ownerEmail } = emailConfig();
  if (!ownerEmail) return;
  await dispatch({
    to: ownerEmail,
    subject: `⚠️ Okuhle: ${count} emails sent today — near the sending limit`,
    text:
      `${count} emails have gone out today.\n\n` +
      `Resend's free tier stops at ${DAILY_SEND_HARD_CAP} a day. Once that's hit, order ` +
      `confirmations stop sending and customers pay without hearing anything.\n\n` +
      `Upgrade the Resend plan to clear this.`,
    skipAccounting: true,
  });
}

/* ------------------------------------------------------------------ */
/* Retry queue                                                        */
/* ------------------------------------------------------------------ */

type QueuedEmail = { to: string; subject: string; text: string; html?: string; attempts: number };

function queue(): QueuedEmail[] {
  if (!globalForEmail.__okuhleQueue) globalForEmail.__okuhleQueue = [];
  return globalForEmail.__okuhleQueue;
}

/** Rate-limited sends are parked rather than dropped. */
export function queuedEmails() {
  return queue().length;
}

/* ------------------------------------------------------------------ */
/* Sending                                                            */
/* ------------------------------------------------------------------ */

type Dispatch = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  skipAccounting?: boolean;
};

async function dispatch(msg: Dispatch): Promise<SendResult> {
  const { apiKey, fromEmail, fromName, ownerEmail } = emailConfig();

  if (!msg.to) return { ok: false, error: "no recipient" };

  // Development, or not configured yet: log instead of send.
  if (!emailConfigured() || process.env.NODE_ENV !== "production") {
    console.info(
      `\n[email:dev] would send\n  to: ${msg.to}\n  subject: ${msg.subject}\n` +
        `${msg.text.split("\n").map((l) => "  | " + l).join("\n")}\n`
    );
    if (!msg.skipAccounting) recordSend();
    return { ok: true, simulated: true };
  }

  const body = JSON.stringify({
    from: `${fromName} <${fromEmail}>`,
    to: [msg.to],
    subject: msg.subject,
    text: msg.text,
    ...(msg.html ? { html: msg.html } : {}),
    ...(msg.replyTo ?? ownerEmail ? { reply_to: msg.replyTo ?? ownerEmail } : {}),
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        if (!msg.skipAccounting) recordSend();
        return { ok: true, id: data.id };
      }

      // 429 means the daily cap or rate limit — park it, don't lose it.
      if (res.status === 429) {
        queue().push({ ...msg, attempts: attempt });
        console.error(
          `[email] rate limited (${res.status}) sending "${msg.subject}" to ${msg.to} — queued`
        );
        return { ok: false, error: "rate limited", queued: true };
      }

      // Retry once on a server-side fault; anything else is our fault, so stop.
      if (res.status < 500 || attempt === 2) {
        const detail = await res.text().catch(() => "");
        console.error(`[email] failed (${res.status}) "${msg.subject}" to ${msg.to}: ${detail}`);
        return { ok: false, error: `resend ${res.status}` };
      }
    } catch (err) {
      if (attempt === 2) {
        console.error(`[email] network error sending "${msg.subject}" to ${msg.to}`, err);
        return { ok: false, error: "network" };
      }
    }
  }

  return { ok: false, error: "unknown" };
}

/* ------------------------------------------------------------------ */
/* Audience (marketing) — POPIA: only explicit opt-ins reach this      */
/* ------------------------------------------------------------------ */

/**
 * Add a contact to the marketing audience. Only ever called when someone has
 * actively ticked the marketing box — transactional email never routes here.
 */
export async function addToAudience(
  email: string,
  opts: { firstName?: string; unsubscribed?: boolean } = {}
): Promise<SendResult> {
  const { apiKey, audienceId } = emailConfig();

  if (!apiKey || !audienceId) {
    console.info(`[email:dev] would add ${email} to the marketing audience`);
    return { ok: true, simulated: true };
  }

  try {
    const res = await fetch(`${RESEND_CONTACTS}/${audienceId}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name: opts.firstName,
        unsubscribed: opts.unsubscribed ?? false,
      }),
    });
    if (!res.ok) {
      console.error(`[email] audience add failed (${res.status}) for ${email}`);
      return { ok: false, error: `resend ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] audience add error", err);
    return { ok: false, error: "network" };
  }
}

export { dispatch as sendEmail };
