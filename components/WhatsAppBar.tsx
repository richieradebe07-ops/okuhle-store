import { site, whatsappLink } from "@/lib/site";

export function WhatsAppBar() {
  return (
    <a
      href={whatsappLink(
        `Hi ${site.name}! I'd like to order — can you help me with sizing and availability?`
      )}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.6rem",
        padding: "1.05rem 1rem",
        background: "var(--accent)",
        color: "var(--accent-fg)",
        textDecoration: "none",
        fontSize: "0.78rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      <span aria-hidden>💬</span> Order via WhatsApp
    </a>
  );
}
