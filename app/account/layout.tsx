import { Container } from "@/components/Section";
import { AccountNav } from "@/components/AccountNav";
import { requireSession } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/reviews";

/**
 * Everything under /account requires a session.
 *
 * Middleware already redirects visitors without cookies, and refreshes an
 * expiring token before this renders. This check is the one that matters
 * anyway: middleware only reads the cookie, whereas `requireSession` asks
 * Supabase whether the token is genuine.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("/account");

  return (
    <div style={{ padding: "clamp(1.5rem, 5vw, 3rem) 0 clamp(3rem, 8vw, 6rem)" }}>
      <Container>
        <AccountNav isOwner={isOwnerEmail(session.user.email)} />
        <div style={{ marginTop: "clamp(2rem, 5vw, 3rem)" }}>{children}</div>
      </Container>
    </div>
  );
}
