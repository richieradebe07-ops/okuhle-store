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
