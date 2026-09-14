import { sizeGuideFor } from "@/lib/sizeGuide";
import { whatsappLink, site } from "@/lib/site";
import type { CategoryId } from "@/lib/products";

/**
 * Expandable size guide, right next to the size selector. Uses a native
 * <details> rather than client-side state — no JS needed to open it, and it
 * works the same in a server-rendered product page as inside the (client)
 * ProductCard.
 */
export function SizeGuide({ category, productName }: { category: CategoryId; productName: string }) {
  const guide = sizeGuideFor(category);

  return (
    <details className="size-guide">
      <summary
        style={{
          cursor: "pointer",
          fontSize: "0.76rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
          listStyle: "none",
        }}
      >
        Size guide
      </summary>

      <div style={{ marginTop: "0.75rem" }}>
        {guide ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <Th>Size</Th>
                    <Th>Chest (cm)</Th>
                    <Th>Length (cm)</Th>
                    {guide.rows.some((r) => r.sleeveCm) && <Th>Sleeve (cm)</Th>}
                  </tr>
                </thead>
                <tbody>
                  {guide.rows.map((r) => (
                    <tr key={r.size} style={{ borderBottom: "1px solid var(--line)" }}>
                      <Td>{r.size}</Td>
                      <Td>{r.chestCm}</Td>
                      <Td>{r.lengthCm}</Td>
                      {guide.rows.some((row) => row.sleeveCm) && <Td>{r.sleeveCm ?? "—"}</Td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {guide.note && (
              <p style={{ color: "var(--fg-muted)", fontSize: "0.8rem", marginTop: "0.6rem" }}>
                {guide.note}
              </p>
            )}
          </>
        ) : (
          <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", margin: 0 }}>
            Size guide coming soon —{" "}
            <a
              href={whatsappLink(
                `Hi ${site.name}! Can you help me confirm fit for the ${productName}? My measurements are: `
              )}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}
            >
              DM us your measurements
            </a>{" "}
            and we&apos;ll confirm fit before anything is made.
          </p>
        )}
      </div>
    </details>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "0.4rem 0.6rem 0.4rem 0",
        fontSize: "0.68rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--fg-muted)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "0.4rem 0.6rem 0.4rem 0" }}>{children}</td>;
}
