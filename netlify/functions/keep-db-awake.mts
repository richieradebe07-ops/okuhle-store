import type { Config } from "@netlify/functions";

/**
 * Supabase's free tier pauses a project after roughly a week with no
 * database activity. This store doesn't reliably get enough real traffic
 * between visits to keep it awake on its own — it has gone to sleep twice
 * already, silently breaking signup, checkout and reviews until someone
 * noticed and restored it by hand.
 *
 * This pings the database every three days — comfortably inside that
 * window — with a trivial authenticated read. It exists purely to generate
 * activity; the result is never used for anything.
 *
 * The project URL is hardcoded rather than read from an env var: it is
 * public by design (the same value already sits in netlify.toml and in
 * every browser's JS bundle), and env vars set in netlify.toml are not
 * available to functions at runtime, only to the build step.
 */
const SUPABASE_URL = "https://jxlybljgrbszfrvwlcep.supabase.co";

export default async () => {
  const serviceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) {
    console.error("[keep-db-awake] SUPABASE_SERVICE_ROLE_KEY is not set — cannot ping");
    return new Response("not configured", { status: 500 });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=id&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    console.log(`[keep-db-awake] ping responded ${res.status}`);
    return new Response(res.ok ? "ok" : "ping failed", { status: res.ok ? 200 : 502 });
  } catch (err) {
    console.error("[keep-db-awake] ping errored", err);
    return new Response("ping errored", { status: 502 });
  }
};

export const config: Config = {
  // Every 3rd day at 03:00 UTC — quiet hours for a KZN-based audience (05:00 SAST).
  schedule: "0 3 */3 * *",
};
