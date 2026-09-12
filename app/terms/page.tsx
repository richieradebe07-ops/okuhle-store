import type { Metadata } from "next";
import { PageHeader, Container } from "@/components/Section";
import { LegalBody } from "@/components/LegalBody";
import { Outstanding } from "@/components/Outstanding";
import { formatRand, site } from "@/lib/site";
import { legal } from "@/lib/legal";
import { products } from "@/lib/products";
import { layBy, layByMonthly, loyalty } from "@/lib/loyalty";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        lead={`The agreement between you and ${site.name} when you order. Version ${legal.termsVersion}.`}
      />
      <Container style={{ padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 3rem)" }}>
        <LegalBody>
          <h2>Who you are dealing with</h2>
          <p>
            The Electronic Communications and Transactions Act (ECTA) section 43 requires us to tell
            you exactly who you are buying from:
          </p>
          <ul>
            <li>
              Trading name: {site.name} ({site.label})
            </li>
            <li>
              Registered name: <Outstanding>registered name</Outstanding>
            </li>
            <li>
              Legal status: <Outstanding>sole proprietor / (Pty) Ltd / CC</Outstanding>
            </li>
            <li>
              Registration number: <Outstanding>CIPC registration number</Outstanding>
            </li>
            <li>
              VAT number: <Outstanding>VAT number, or &ldquo;not VAT registered&rdquo;</Outstanding>
            </li>
            <li>Physical address: {site.contact.address}, South Africa</li>
            <li>
              Contact: {site.contact.email} · {site.contact.phoneDisplay}
            </li>
          </ul>

          <h2>What we sell</h2>
          <p>
            Cotton and cotton-blend clothing carrying the Okuhle emblem — golf tees, t-shirts, baggy
            tees, sweaters and hoodies, in sizes S to XXL. Each product page lists that item&apos;s
            fabric, fit and care instructions. Everything is made to order in the colour and size you
            choose.
          </p>

          <h2>Prices</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{formatRand(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Prices are in South African Rand and include VAT where we are liable for it. Delivery is
            charged separately at a flat national rate, which we quote you in writing before you pay
            — you will always see the full amount, including delivery, before any payment is taken.
            Local collection in {site.contact.location} is free.
          </p>

          <h2>Placing an order</h2>
          <p>
            An order is confirmed once we have agreed the item, colour, size and total with you and
            payment (or a lay-by deposit) has been received. We confirm in writing. If we cannot
            fulfil an order we will tell you and refund you in full.
          </p>
          <p>
            If a price is displayed incorrectly through an obvious error, we will contact you before
            making the item, and you may cancel for a full refund rather than pay the corrected
            price.
          </p>

          <h2>Payment</h2>
          <p>
            We accept EFT, instant transfer and card payment. Card payments are processed by our
            payment provider over a secure connection; we do not see or store your card details.
          </p>

          <h2>Making and delivering your order</h2>
          <p>
            Production takes 2–3 working days, because each piece is made after you order it.
            Delivery then takes 1–2 working days in Pietermaritzburg and Durban, 2–4 to Gauteng and
            other metros, and 3–7 to outlying areas. These are good-faith estimates, not guarantees —
            couriers occasionally run late and that part is outside our control.
          </p>
          <p>
            Tell us within 48 hours if your parcel arrives damaged, with photos. If a parcel is lost
            in transit we take it up with the courier and remake or refund your order.
          </p>

          <h2>Lay-by</h2>
          <p>
            Lay-by lets you pay an item off over {layBy.months} months with no interest and no admin
            fee — the {products[0].name} at {formatRand(products[0].price)} works out to{" "}
            {formatRand(layByMonthly(products[0].price))} a month. A deposit starts production, and
            the item ships once the final payment clears.
          </p>
          <p>
            If payments stop: <Outstanding>what happens on default — to be confirmed</Outstanding>.
            This must be stated plainly, including whether payments already made are refundable and
            within what period, before lay-by is offered in writing.
          </p>

          <h2>Returns, exchanges and refunds</h2>
          <p>
            <strong>Faulty or incorrect items.</strong> If what arrives is defective, is not what you
            ordered, or is not of the quality described, tell us within 7 days and we will repair,
            replace or refund it. This is your right under the Consumer Protection Act, and nothing
            in these terms limits it. No &ldquo;all sales final&rdquo; wording applies to defects.
          </p>
          <p>
            <strong>Size exchanges.</strong> Wrong size? Message us within 14 days. If the item is
            unworn, unwashed and still has its tags, we will exchange it for a different size. We
            choose to offer this over and above what the law requires.
          </p>
          <p>
            <strong>Change of mind.</strong> ECTA section 44 gives online shoppers a 7-day
            cooling-off right, but section 42(2)(f) excludes goods made to the consumer&apos;s
            specifications. Because every Okuhle piece is made to order in a colour and size you
            choose, that exclusion may apply here.{" "}
            <Outstanding>
              Position to be confirmed by a South African attorney before it is relied on
            </Outstanding>
            . Until then, talk to us — we would rather sort something out than argue about it.
          </p>

          <h2>Bulk orders</h2>
          <p>
            Bulk pricing is available on multiples and is quoted per order. The quoted total,
            including delivery, is what you pay.
          </p>

          <h2>Rewards</h2>
          <p>
            Rewards are free — there is no subscription or fee. You earn 1 point per{" "}
            {formatRand(loyalty.randPerPoint)} spent, rounded down, and {loyalty.redeemPoints} points
            redeems {formatRand(loyalty.redeemValueRand)} off a future order. Points carry no cash
            value, cannot be transferred, and lapse after {loyalty.expiryMonths} months with no
            activity on your account. We may change the earn or redemption rate for future orders,
            but never retroactively on points already earned.
          </p>

          <h2>Our designs</h2>
          <p>
            The {site.name} name, emblem and designs belong to us. Buying a piece does not give you
            the right to reproduce them commercially.
          </p>

          <h2>Disputes</h2>
          <p>
            Talk to us first — most things get sorted out in a WhatsApp message. Failing that, you
            may refer a consumer complaint to the National Consumer Commission or an accredited
            consumer goods ombud. These terms are governed by South African law, and the South
            African courts have jurisdiction.
          </p>

          <h2>Changes</h2>
          <p>
            The terms that apply to your order are the ones published when you placed it. Current
            version: {legal.termsVersion}.
          </p>
        </LegalBody>
      </Container>
    </>
  );
}
