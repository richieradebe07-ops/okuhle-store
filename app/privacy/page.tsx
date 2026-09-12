import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { LegalDetail } from "@/components/Outstanding";
import { site } from "@/lib/site";
import { legal } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const active = legal.processors.filter((p) => p.active);
  const crossBorder = legal.processors.filter((p) => p.crossBorder && p.active);

  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        lead={`How we handle your personal information under POPIA. Version ${legal.privacyVersion}.`}
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>Who we are</h2>
          <p>
            {site.name} is a clothing business trading from {site.contact.address}, South Africa.
            Registered name:{" "}
            <LegalDetail value={legal.registeredName} label="registered name" />. Entity type:{" "}
            <LegalDetail value={legal.entityType} label="sole proprietor / (Pty) Ltd / CC" />.
            Registration number:{" "}
            <LegalDetail value={legal.registrationNumber} label="CIPC registration number" />.
          </p>
          <p>
            Contact: {site.contact.email} · {site.contact.phoneDisplay}
          </p>

          <h2>Information Officer</h2>
          <p>
            Under the Protection of Personal Information Act (POPIA), every business has an
            Information Officer, who is responsible for how personal information is handled here and
            is your first point of contact about it.
          </p>
          <p>
            Information Officer:{" "}
            <LegalDetail value={legal.informationOfficer.name} label="name" />, contactable at{" "}
            <LegalDetail value={legal.informationOfficer.email} label="email address" />.
            {!legal.informationOfficer.registeredWithRegulator && (
              <>
                {" "}
                Registration of the Information Officer with the Information Regulator is still
                outstanding.
              </>
            )}
          </p>

          <h2>What we collect, and why</h2>
          <table>
            <thead>
              <tr>
                <th>Information</th>
                <th>Why we need it</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Name and contact number</td>
                <td>To confirm your order and arrange delivery</td>
              </tr>
              <tr>
                <td>Delivery address</td>
                <td>To get your order to you</td>
              </tr>
              <tr>
                <td>Email address</td>
                <td>Order confirmations, and the newsletter if you asked for it</td>
              </tr>
              <tr>
                <td>Order details (item, colour, size, amount)</td>
                <td>To make your piece and keep the records the law requires</td>
              </tr>
              <tr>
                <td>Support messages and chat transcripts</td>
                <td>To answer your question and improve our support</td>
              </tr>
            </tbody>
          </table>
          <p>
            We collect this because we need it to perform the sale you asked for, to meet our legal
            obligations, or — for the newsletter — because you gave consent. We do not collect more
            than we need, and we do not ask for information we have no use for.
          </p>

          <h2>What we do not do</h2>
          <p>
            We do not sell your personal information. We do not share it for anyone else&apos;s
            marketing. We do not run advertising trackers on this site.
          </p>

          <h2>Who else sees it</h2>
          <ul>
            {active.map((p) => (
              <li key={p.name}>
                <strong>{p.name}</strong> — {p.purpose}. {p.note}
              </li>
            ))}
          </ul>

          <h2>Information sent outside South Africa</h2>
          <p>
            POPIA section 72 requires us to tell you when your personal information crosses the
            border. Some of the services we rely on are hosted outside South Africa:
          </p>
          <ul>
            {crossBorder.map((p) => (
              <li key={p.name}>
                <strong>{p.name}</strong> — {p.note}
              </li>
            ))}
          </ul>
          <p>
            Where this happens, we use providers that are contractually bound to protect your
            information to a standard comparable to POPIA.
          </p>

          <h2>How long we keep it</h2>
          <table>
            <tbody>
              {legal.retention.map(([what, how]) => (
                <tr key={what}>
                  <td>{what}</td>
                  <td>{how}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Keeping it safe</h2>
          <p>
            The site is served over HTTPS. Payment card details are handled entirely by our payment
            provider — they never reach our systems. Access to order and account information is
            limited to the people who need it to fulfil your order.
          </p>

          <h2>Your rights</h2>
          <p>Under POPIA you can ask us to:</p>
          <ul>
            <li>Tell you what personal information we hold about you</li>
            <li>Give you a copy of it</li>
            <li>Correct anything that is wrong</li>
            <li>
              Delete it — though we may have to keep order records where tax law requires, and
              we&apos;ll tell you if that applies
            </li>
            <li>Stop sending you marketing, at any time</li>
          </ul>
          <p>
            Email the Information Officer and we&apos;ll action it. There is no charge for a
            reasonable request.
          </p>

          <h2>Marketing</h2>
          <p>
            We only send marketing email to people who asked for it. It is never a condition of
            buying from us or having an account. Every email has an unsubscribe link, and you can
            also tell us to stop by email or on WhatsApp — we&apos;ll action it however it reaches
            us. Opting out does not affect your account or your ability to order.
          </p>

          <h2>Cookies and what this site stores</h2>
          <p>
            This site sets no cookies and runs no advertising trackers. It stores three things in
            your own browser, which are never sent to us: your light/dark preference, your wishlist,
            and whether you&apos;ve joined the mailing list. See the{" "}
            <a href="/cookies">Cookie Policy</a> for detail.
          </p>

          <h2>Complaints</h2>
          <p>
            Talk to us first — email the Information Officer and we&apos;ll try to sort it out. If
            you&apos;re not satisfied, you can complain to the {legal.regulator.name}:{" "}
            {legal.regulator.email} · {legal.regulator.site}
          </p>

          <h2>Changes</h2>
          <p>
            If we change this policy materially we&apos;ll update the version at the top and, where
            it affects you, tell you directly. Current version: {legal.privacyVersion}.
          </p>
        </LegalBody>
      </Container>
    </>
  );
}
