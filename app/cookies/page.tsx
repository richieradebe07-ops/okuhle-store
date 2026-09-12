import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { site } from "@/lib/site";
import { legal } from "@/lib/legal";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Cookie Policy"
        lead={`What this site stores, and why there is no consent banner. Version ${legal.cookieVersion}.`}
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>The short version</h2>
          <p>
            This site sets <strong>no cookies at all</strong>. It runs no advertising trackers, no
            Meta or TikTok pixel, and no cross-site tracking of any kind. That is why you have not
            been shown a consent banner — under POPIA, consent is required for non-essential
            tracking, and there isn&apos;t any here to consent to.
          </p>

          <h2>What is stored on your device</h2>
          <p>
            Three things are saved in your own browser&apos;s local storage. They stay on your
            device, are never transmitted to us, and are not used to identify or track you:
          </p>
          <table>
            <thead>
              <tr>
                <th>What</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Light or dark mode</td>
                <td>So the site looks the way you left it</td>
              </tr>
              <tr>
                <td>Your wishlist</td>
                <td>So saved pieces are still there when you come back</td>
              </tr>
              <tr>
                <td>Whether you joined the mailing list</td>
                <td>So we stop asking you to join something you already joined</td>
              </tr>
            </tbody>
          </table>
          <p>
            Clearing your browser&apos;s site data for this domain removes all three. Your wishlist
            will be emptied if you do.
          </p>

          <h2>Requests to other companies</h2>
          <p>
            Page fonts are loaded from Google Fonts, which means your browser makes a request to
            Google and Google sees your IP address. No cookie is set by this. We are looking at
            self-hosting the fonts to remove that request entirely.
          </p>
          <p>
            Our social links are ordinary links. Nothing from Instagram, TikTok, Facebook or YouTube
            is embedded in these pages, so those platforms are not notified that you visited.
          </p>

          <h2>If that changes</h2>
          <p>
            If we ever add advertising pixels, embedded third-party content that sets cookies, or
            analytics that identifies individuals, we will put a proper consent banner in place
            first — with Accept, Reject and Manage preferences given equal weight, nothing
            pre-ticked, and nothing non-essential loading before you agree. We will not quietly start
            tracking and update this page afterwards.
          </p>

          <h2>Questions</h2>
          <p>
            Email {site.contact.email} and ask. See also our <a href="/privacy">Privacy Policy</a>.
          </p>
        </LegalBody>
      </Container>
    </>
  );
}
