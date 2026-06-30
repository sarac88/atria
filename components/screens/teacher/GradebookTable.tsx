"use client";

import type { CSSProperties } from "react";
import { Avatar, Badge, Button, Icon } from "@/components/ui";
import { students } from "@/lib/data";

const thS: CSSProperties = { padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "var(--text-strong)", height: 35, lineHeight: 1.3, boxSizing: "border-box" };
const tdS: CSSProperties = { padding: "13px 16px", verticalAlign: "middle" };

const cols = ["Ensayo límites", "Derivadas", "Cuestionario 4", "Proyecto"];
const grades: (number | null)[][] = [
  [9.0, 8.5, 9.5, null], [6.4, 5.0, 7.0, null], [7.8, 8.0, 8.5, null], [8.2, 7.5, 9.0, null],
  [null, 5.5, 6.0, null], [8.0, 7.0, 8.0, null], [9.2, 9.0, 9.5, null], [6.0, 6.5, null, null],
];

const gColor = (g: number | null) => (g == null ? "var(--text-muted)" : g >= 9 ? "var(--success-600)" : g >= 7 ? "var(--text-strong)" : g >= 5 ? "var(--warning-600)" : "var(--status-error)");
const gBg = (g: number | null) => (g == null ? "transparent" : g >= 9 ? "var(--success-100)" : g >= 5 ? "transparent" : "var(--error-100)");

/** Full grade matrix (used standalone and embedded in class detail). */
export function GradebookTable({ compact = false }: { compact?: boolean }) {
  const rows = students.slice(0, 8);
  return (
    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 24px", height: 55, boxSizing: "border-box" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>Libro de calificaciones · Cálculo II</span>
        <Button size="small" variant="outline" iconLeft={<Icon name="download" size={16} />}>Exportar</Button>
      </div>
      <div style={{ overflowX: "auto", margin: "4px 24px 24px", border: "1px solid var(--border-default)", borderRadius: 3 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
          <thead>
            <tr style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-default)" }}>
              <th style={{ ...thS, position: "sticky", left: 0, background: "var(--surface-sunken)", minWidth: 200 }}>Alumno</th>
              {cols.map((c) => <th key={c} style={{ ...thS, textAlign: "center", minWidth: 110 }}>{c}</th>)}
              <th style={{ ...thS, textAlign: "center", minWidth: 90 }}>Media</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, ri) => {
              const vals = grades[ri].filter((x): x is number => x != null);
              const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--state-hover-row)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdS, position: "sticky", left: 0, background: "inherit" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={s.name} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{s.name}</span>
                    </span>
                  </td>
                  {grades[ri].map((g, ci) => (
                    <td key={ci} style={{ ...tdS, textAlign: "center" }}>
                      <span style={{ display: "inline-flex", minWidth: 40, justifyContent: "center", padding: "3px 8px", borderRadius: "var(--radius-xs)", fontWeight: 700, fontSize: 14, color: gColor(g), background: gBg(g) }}>
                        {g == null ? "—" : g.toFixed(1)}
                      </span>
                    </td>
                  ))}
                  <td style={{ ...tdS, textAlign: "center" }}>
                    <Badge color={avg == null ? "default" : avg >= 9 ? "success" : avg >= 5 ? "info" : "error"}>{avg == null ? "—" : avg.toFixed(1)}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
