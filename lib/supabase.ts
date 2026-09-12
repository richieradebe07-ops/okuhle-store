/**
 * Supabase REST access.
 *
 * Deliberately uses fetch against the REST API rather than adding the
 * @supabase/supabase-js dependency — the server only needs a handful of typed
 * queries, and this keeps the bundle and the dependency surface small.
 *
 * TWO KEYS, AND THE DIFFERENCE MATTERS:
 *   anon / publishable  — safe in the browser. RLS applies, so it can only read
 *                         a signed-in customer's own rows.
 *   service role        — SERVER ONLY. Bypasses RLS entirely. This is what
 *                         writes orders and marks them paid. It must never be
 *                         imported into a client component or exposed to the
 *                         browser; doing so would let anyone mark orders paid.
 */

export function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

export function supabaseConfigured() {
  const { url, serviceKey } = supabaseConfig();
  return Boolean(url && serviceKey);
}

type QueryOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Postgrest preference header, e.g. "return=representation". */
  prefer?: string;
};

/**
 * Server-side query using the service-role key. Never call from the browser.
 */
export async function serviceQuery<T>(
  path: string,
  { method = "GET", body, prefer }: QueryOptions = {}
): Promise<T> {
  const { url, serviceKey } = supabaseConfig();

  if (!url || !serviceKey) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  // Guard against this ever being bundled into client code.
  if (typeof window !== "undefined") {
    throw new Error("serviceQuery must never run in the browser");
  }

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Rand → cents. Money is stored as integers; floats and money do not mix. */
export function toCents(rand: number): number {
  return Math.round(rand * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
