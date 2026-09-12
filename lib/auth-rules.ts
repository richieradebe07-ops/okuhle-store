/**
 * Auth constants the browser is allowed to know.
 *
 * Separate from lib/auth.ts so a client component can show the password rule
 * without dragging `next/headers`, the service-role key path and the rest of
 * the server-only module anywhere near the bundle.
 */
export const MIN_PASSWORD_LENGTH = 10;

/**
 * Length first, because length is what actually helps, and no composition
 * rules, because "must contain a symbol" mostly produces Password1!.
 */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters. A short phrase you'll remember beats a clever short one.`;
  }
  if (password.length > 72) {
    return "That's longer than 72 characters, which is as much as the hashing takes.";
  }
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) {
    return "Don't put your email address in your password.";
  }
  if (/^[0-9]+$/.test(password)) {
    return "All digits is easy to guess — mix in some words.";
  }
  return null;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

