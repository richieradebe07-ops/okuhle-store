import React from "react";

export function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 clamp(1rem, 4vw, 3rem)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  eyebrow,
  title,
  lead,
  background,
  id,
}: {
  children?: React.ReactNode;
  eyebrow?: string;
  title?: string;
  lead?: string;
  background?: string;
  id?: string;
}) {
  return (
    <section id={id} style={{ padding: "clamp(3rem, 8vw, 6rem) 0", background }}>
      <Container>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && (
          <h2 style={{ fontSize: "clamp(1.9rem, 5vw, 3rem)", margin: "0.75rem 0 0" }}>{title}</h2>
        )}
        {lead && (
          <p
            style={{
              color: "var(--fg-muted)",
              maxWidth: "42rem",
              margin: "1rem 0 0",
              fontSize: "1rem",
            }}
          >
            {lead}
          </p>
        )}
        {children && <div style={{ marginTop: title || lead ? "2.5rem" : 0 }}>{children}</div>}
      </Container>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <header
      style={{
        padding: "clamp(3rem, 7vw, 5rem) 0 clamp(1.5rem, 4vw, 3rem)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Container>
        <p className="eyebrow">{eyebrow}</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)", margin: "0.75rem 0 0" }}>{title}</h1>
        {lead && (
          <p
            style={{
              color: "var(--fg-muted)",
              maxWidth: "42rem",
              margin: "1rem 0 0",
            }}
          >
            {lead}
          </p>
        )}
      </Container>
    </header>
  );
}
