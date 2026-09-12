"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { quickReplies, productShortcuts, type Reply } from "@/lib/assistant";
import { site, whatsappLink } from "@/lib/site";

const DISMISSED_KEY = "okuhle_assistant_dismissed";

type Message = { from: "bot" | "user"; text: string; action?: Reply["action"] };

const GREETING: Message = {
  from: "bot",
  text: "Hi — I can help with sizing, delivery, lay-by and payment. Pick something below, or message us on WhatsApp and a person will answer.",
};

/**
 * Layer 1 assistant: scripted answers plus navigation. Never auto-opens, and
 * anything it can't answer from the shop's own data hands off to WhatsApp
 * rather than guessing.
 */
export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [showProducts, setShowProducts] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {
      // storage blocked — the widget simply stays closed until tapped
    }
  }, []);

  useEffect(() => {
    if (open) logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function ask(reply: Reply) {
    setMessages((m) => [
      ...m,
      { from: "user", text: reply.question },
      { from: "bot", text: reply.answer(), action: reply.action },
    ]);
    setShowProducts(false);
  }

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open help"
          style={{
            position: "fixed",
            right: "1rem",
            bottom: "4.5rem",
            zIndex: 45,
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            border: "none",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            fontSize: "1.1rem",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          }}
        >
          ?
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Help"
          aria-modal="false"
          style={{
            position: "fixed",
            right: 0,
            bottom: 0,
            zIndex: 60,
            width: "min(100vw, 26rem)",
            height: "min(100dvh, 34rem)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.28)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.9rem 1rem",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <strong style={{ fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Help
            </strong>
            <button
              onClick={close}
              aria-label="Close help"
              style={{
                background: "none",
                border: "none",
                color: "var(--fg-muted)",
                fontSize: "1.1rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </header>

          <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    maxWidth: "85%",
                    marginLeft: m.from === "user" ? "auto" : 0,
                    padding: "0.7rem 0.9rem",
                    fontSize: "0.88rem",
                    whiteSpace: "pre-wrap",
                    background: m.from === "user" ? "var(--accent)" : "var(--bg-raised)",
                    color: m.from === "user" ? "var(--accent-fg)" : "var(--fg)",
                    border: m.from === "user" ? "none" : "1px solid var(--line)",
                  }}
                >
                  {m.text}
                </div>
                {m.action && (
                  <Link
                    href={m.action.href}
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost"
                    style={{ marginTop: "0.6rem", fontSize: "0.7rem", padding: "0.55rem 1rem" }}
                  >
                    {m.action.label} →
                  </Link>
                )}
              </div>
            ))}

            {showProducts && (
              <div style={{ display: "grid", gap: "0.4rem", marginBottom: "1rem" }}>
                {productShortcuts.map((p) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    onClick={() => setOpen(false)}
                    style={{
                      padding: "0.6rem 0.8rem",
                      border: "1px solid var(--line)",
                      color: "var(--fg)",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                    }}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--line)", padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {quickReplies.map((r) => (
                <button
                  key={r.id}
                  onClick={() => ask(r)}
                  style={{
                    padding: "0.45rem 0.7rem",
                    fontSize: "0.74rem",
                    background: "transparent",
                    color: "var(--fg-muted)",
                    border: "1px solid var(--line)",
                    borderRadius: "999px",
                    cursor: "pointer",
                  }}
                >
                  {r.question}
                </button>
              ))}
              <button
                onClick={() => setShowProducts((v) => !v)}
                style={{
                  padding: "0.45rem 0.7rem",
                  fontSize: "0.74rem",
                  background: "transparent",
                  color: "var(--fg-muted)",
                  border: "1px solid var(--line)",
                  borderRadius: "999px",
                  cursor: "pointer",
                }}
              >
                Take me to a product
              </button>
            </div>

            <a
              className="btn"
              href={whatsappLink(`Hi ${site.name}! I have a question.`)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: "100%", fontSize: "0.72rem" }}
            >
              Chat to a person on WhatsApp
            </a>

            <p style={{ fontSize: "0.66rem", color: "var(--fg-muted)", margin: "0.7rem 0 0" }}>
              Answers here are pre-written from our own shop and shipping pages — nothing you type is
              stored. See our{" "}
              <Link href="/privacy" style={{ color: "var(--fg-muted)" }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}
