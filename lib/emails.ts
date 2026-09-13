import { sendEmail, emailConfig, type SendResult } from "./email";
import { formatRand, site } from "./site";
import { membership } from "./membership";
import type { Order } from "./orders";

/**
 * The transactional emails, one typed function each.
 *
 * All of them swallow failures — a notification that doesn't send must never
 * roll back a payment that did. Callers are expected to log the result and
 * carry on.
 */

const DELIVERY_TIMES = [
  "Pietermaritzburg & Durban — 1–2 working days",
  "Gauteng & other metros — 2–4 working days",
  "Outlying areas — 3–7 working days",
];

function footer() {
  return [
    "",
    "—",
    `${site.name} · ${site.contact.address}`,
    `${site.contact.phoneDisplay} · ${site.contact.email}`,
    "Made to order in KwaZulu-Natal.",
  ].join("\n");
}

/** 1. Order confirmation → customer */
export async function sendOrderConfirmation(order: Order): Promise<SendResult> {
  if (!order.buyerEmail) return { ok: false, error: "order has no email" };

  return sendEmail({
    to: order.buyerEmail,
    subject: `Order ${order.id} confirmed — ${site.name}`,
    text: [
      `Thanks — we've got your order and your payment has cleared.`,
      "",
      `Order number: ${order.id}`,
      `${order.productName} — ${order.colour}, size ${order.size}`,
      `Paid: ${formatRand(order.amount)}`,
      "",
      "WHAT HAPPENS NOW",
      "1. We make your piece. Everything is made to order, so allow 2–3 working days.",
      "2. We hand it to the courier and send you the tracking number on WhatsApp.",
      "3. It arrives:",
      ...DELIVERY_TIMES.map((d) => `   • ${d}`),
      "",
      "Those delivery times are estimates, not guarantees — couriers occasionally run late.",
      "",
      `Anything wrong, or need to change a size? Message us on WhatsApp with your order`,
      `number and a person will answer.`,
      footer(),
    ].join("\n"),
  });
}

/**
 * 2. New order alert → owner.
 * The subject has to be readable on a phone lock screen, so the money and the
 * item come first and nothing else competes with them.
 */
export async function sendOwnerOrderAlert(
  order: Order,
  buyer?: { name?: string; phone?: string; address?: string }
): Promise<SendResult> {
  const { ownerEmail } = emailConfig();
  const who = buyer?.name ?? order.buyerEmail ?? "unknown buyer";

  return sendEmail({
    to: ownerEmail,
    subject: `New order — ${formatRand(order.amount)} ${order.productName} (${order.colour}, ${order.size}) — ${who}`,
    text: [
      `NEW ORDER — ${formatRand(order.amount)} paid`,
      "",
      `Item:     ${order.productName}`,
      `Colour:   ${order.colour}`,
      `Size:     ${order.size}`,
      `Order no: ${order.id}`,
      `PayFast:  ${order.pfPaymentId ?? "—"}`,
      "",
      "CUSTOMER",
      `Name:     ${buyer?.name ?? "—"}`,
      `Email:    ${order.buyerEmail ?? "—"}`,
      `Phone:    ${buyer?.phone ?? "—"}`,
      `Address:  ${buyer?.address ?? "— (confirm on WhatsApp)"}`,
      "",
      `Paid at:  ${order.paidAt ?? new Date().toISOString()}`,
      "",
      "Make it within 2–3 working days.",
    ].join("\n"),
    replyTo: order.buyerEmail,
  });
}

/** 3. Member welcome → customer */
export async function sendMemberWelcome(input: {
  email: string;
  memberNumber: number;
  expiresAt: string;
  groupLink?: string;
}): Promise<SendResult> {
  return sendEmail({
    to: input.email,
    subject: `You're Okuhle+ member #${String(input.memberNumber).padStart(3, "0")}`,
    text: [
      `Welcome in. You're member #${String(input.memberNumber).padStart(3, "0")} — that number is`,
      `yours permanently.`,
      "",
      "WHAT YOU NOW GET",
      "• Member-only pieces the public can't buy — a new one every quarter",
      "• Guaranteed allocation on limited drops. You won't miss one.",
      `• ${membership.earlyAccessHours}-hour early access to everything`,
      "• A say in what we make next",
      "• Priority production and free size exchanges",
      `• ${membership.discountPercent}% off everything, free delivery from ${formatRand(membership.freeDeliveryThresholdRand)}`,
      "",
      "YOUR WELCOME PACK",
      "Your member card, patch and stickers ship with your next order rather than",
      "separately — it saves a shipment and gets it to you faster.",
      "",
      "THE MEMBERS' GROUP",
      input.groupLink
        ? `Join here: ${input.groupLink}`
        : "We'll send you the members' WhatsApp group link shortly.",
      "",
      `Your membership runs to ${new Date(input.expiresAt).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}.`,
      `It does not auto-renew — we'll remind you ${membership.renewalReminderDaysBefore} days before,`,
      `and renewing members keep the price they joined at.`,
      footer(),
    ].join("\n"),
  });
}

/** 4. New member alert → owner */
export async function sendOwnerMemberAlert(input: {
  memberNumber: number;
  email: string;
  name?: string;
  pricePaid: number;
}): Promise<SendResult> {
  const { ownerEmail } = emailConfig();
  const num = String(input.memberNumber).padStart(3, "0");

  return sendEmail({
    to: ownerEmail,
    subject: `New Okuhle+ member #${num} — ${input.name ?? input.email} — ${formatRand(input.pricePaid)}`,
    text: [
      `NEW OKUHLE+ MEMBER`,
      "",
      `Member:  #${num}`,
      `Name:    ${input.name ?? "—"}`,
      `Email:   ${input.email}`,
      `Paid:    ${formatRand(input.pricePaid)} for the year`,
      "",
      "TO DO",
      `• Prepare welcome pack for #${num} (card, patch, stickers)`,
      "• Send it with their next order, not separately",
      "• Add them to the members' WhatsApp group",
    ].join("\n"),
    replyTo: input.email,
  });
}

/** 5. Renewal reminder → customer, 14 days out */
export async function sendRenewalReminder(input: {
  email: string;
  memberNumber: number;
  expiresAt: string;
  pricePaid: number;
  renewUrl: string;
}): Promise<SendResult> {
  const expires = new Date(input.expiresAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
  });

  return sendEmail({
    to: input.email,
    subject: `Your Okuhle+ year ends ${expires}`,
    text: [
      `Member #${String(input.memberNumber).padStart(3, "0")} — your year with us ends on ${expires}.`,
      "",
      `Renewing keeps your member number and your price: ${formatRand(input.pricePaid)}, even when`,
      `the price goes up for new members.`,
      "",
      `Renew here: ${input.renewUrl}`,
      "",
      "If you'd rather not, nothing happens — there's no automatic charge. You'll just",
      "go back to standard pricing and lose the early access.",
      footer(),
    ].join("\n"),
  });
}

/** 6. Password reset → customer */
export async function sendPasswordReset(input: {
  email: string;
  resetUrl: string;
  expiresInMinutes?: number;
}): Promise<SendResult> {
  const mins = input.expiresInMinutes ?? 60;

  return sendEmail({
    to: input.email,
    subject: `Reset your ${site.name} password`,
    text: [
      `Someone asked to reset the password for this email address.`,
      "",
      `Reset it here: ${input.resetUrl}`,
      "",
      `That link works for ${mins} minutes and can only be used once.`,
      "",
      `If this wasn't you, ignore this email — nothing has changed and your password`,
      `still works.`,
      footer(),
    ].join("\n"),
  });
}

/** 7. Confirm your email address → new account */
export async function sendEmailVerification(input: {
  email: string;
  confirmUrl: string;
  firstName?: string | null;
}): Promise<SendResult> {
  const greeting = input.firstName ? `${input.firstName},` : "Hi,";

  return sendEmail({
    to: input.email,
    subject: `Confirm your ${site.name} account`,
    text: [
      greeting,
      "",
      `One tap and your account is live:`,
      "",
      input.confirmUrl,
      "",
      "WHAT AN ACCOUNT GETS YOU",
      "• Your order history and tracking in one place",
      "• Points on every order — 1 point per R100, 10 points is R100 off",
      "• First notice when a sold-out size is back",
      "",
      "No fee, and nothing is charged for having an account.",
      "",
      `If you didn't sign up, ignore this — the account stays unconfirmed and we`,
      `delete it. Nobody can use it without clicking that link.`,
      footer(),
    ].join("\n"),
  });
}

/**
 * 8. Someone tried to sign up with an address that already has an account.
 *
 * The signup form answers identically whether or not the address is already
 * registered, so a stranger cannot use it to find out who shops here. This
 * email is what stops that costing the real owner of the address anything:
 * they get told which situation they are actually in.
 */
export async function sendDuplicateSignupNotice(input: {
  email: string;
  loginUrl: string;
  resetUrl: string;
}): Promise<SendResult> {
  return sendEmail({
    to: input.email,
    subject: `You already have an ${site.name} account`,
    text: [
      `Someone just tried to create an account with this email address — and`,
      `there's already one here, so we didn't make a second.`,
      "",
      `If that was you: log in instead — ${input.loginUrl}`,
      `Forgotten the password? Reset it — ${input.resetUrl}`,
      "",
      `If it wasn't you, there's nothing to do. Your account hasn't changed and`,
      `nobody got access to it. Your password still works.`,
      footer(),
    ].join("\n"),
  });
}

/** 9. Your data, as requested → customer (POPIA section 23) */
export async function sendAccountDeleted(input: {
  email: string;
  ordersKept: number;
}): Promise<SendResult> {
  return sendEmail({
    to: input.email,
    subject: `Your ${site.name} account has been deleted`,
    text: [
      `Your account is gone. Your login, your points and your saved details have`,
      `been deleted and can't be recovered.`,
      "",
      input.ordersKept > 0
        ? [
            `WHAT WE STILL HAVE, AND WHY`,
            `${input.ordersKept} paid order record${input.ordersKept === 1 ? "" : "s"}. South African tax law`,
            `requires us to keep records of sales for five years, so those stay — but they`,
            `are no longer linked to an account, and nobody can log in to see them.`,
            "",
          ].join("\n")
        : "You had no completed orders, so there is nothing we're required to keep.\n",
      `You're also off the marketing list.`,
      "",
      `You're welcome back any time — you'd just start a new account.`,
      footer(),
    ].join("\n"),
  });
}

/**
 * 10. New review awaiting moderation → owner.
 *
 * Nothing appears on the site until this is actioned, so the alert leads with
 * the words themselves rather than making the owner click through to find out
 * whether it needs attention.
 */
export async function sendOwnerReviewAlert(input: {
  displayName: string;
  rating: number | null;
  body: string;
  productName: string | null;
  verifiedPurchase: boolean;
  moderationUrl: string;
}): Promise<SendResult> {
  const { ownerEmail } = emailConfig();
  const stars = input.rating ? `${"★".repeat(input.rating)}${"☆".repeat(5 - input.rating)}` : "no rating";
  const about = input.productName ?? "the brand";

  return sendEmail({
    to: ownerEmail,
    subject: `New review — ${stars} on ${about}${input.verifiedPurchase ? " (verified buyer)" : ""}`,
    text: [
      `${input.displayName} left a review of ${about}.`,
      "",
      input.rating ? `Rating:   ${stars} (${input.rating}/5)` : "Rating:   none given",
      `Verified: ${input.verifiedPurchase ? "yes — matched to a paid order" : "no — we could not match a purchase"}`,
      "",
      "WHAT THEY WROTE",
      input.body,
      "",
      "———",
      `This is NOT on the site yet. Nothing publishes without you:`,
      input.moderationUrl,
      "",
      `A review you reject is kept, not deleted, so there is a record of what`,
      `was said and what you decided.`,
      footer(),
    ].join("\n"),
  });
}
