"use client";

import { useState, type CSSProperties } from "react";
import { Avatar, Badge } from "@/components/ui";
import { EmptyState } from "@/components/layout";
import type { GradebookDto } from "@/lib/types";

const thS: CSSProperties = { padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "var(--text-strong)", height: 35, lineHeight: 1.3, boxSizing: "border-box" };
const tdS: CSSProperties = { padding: "13px 16px", verticalAlign: "middle" };
// Alumno y Media quedan fijas; las actividades se desplazan en horizontal entre ellas.
const stickyL: CSSProperties = { position: "sticky", left: 0, zIndex: 1, boxShadow: "inset -1px 0 0 var(--border-default)" };
const stickyR: CSSProperties = { position: "sticky", right: 0, zIndex: 1, boxShadow: "inset 1px 0 0 var(--border-default)" };

const gColor = (g: number | null) => (g == null ? "var(--text-muted)" : g >= 9 ? "var(--success-600)" : g >= 7 ? "var(--text-strong)" : g >= 5 ? "var(--warning-600)" : "var(--status-error)");
const gBg = (g: number | null) => (g == null ? "transparent" : g >= 9 ? "var(--success-100)" : g >= 5 ? "transparent" : "var(--error-100)");

/** Grade matrix — driven by GET /classes/:id/gradebook. */
export function GradebookTable({ data, courseName = "" }: { data?: GradebookDto; courseName?: string }) {
  const columns = data?.columns ?? [];
  const rows = data?.rows ?? [];
  const [hovered, setHovered] = useState<string | null>(null);
  // Las celdas fijas tapan a las que pasan por debajo: fondo opaco, con el tinte de hover encima.
  const stickyBg = (id: string) => (hovered === id ? "linear-gradient(var(--state-hover-row), var(--state-hover-row)), var(--surface-card)" : "var(--surface-card)");
  return (
    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 24px", height: 55, boxSizing: "border-box" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>
          {courseName ? `Libro de calificaciones · ${courseName}` : "Libro de calificaciones"}
        </span>
      </div>
      {data && rows.length === 0 ? (
        <EmptyState plain illo="sin-alumnos" title="Todavía no hay alumnos en la clase" text="Cuando acepten la invitación verás aquí sus notas." />
      ) : data && columns.length === 0 ? (
        <EmptyState plain illo="sin-notas" title="Aún no hay nada que calificar" text="Crea una actividad y las notas de tus alumnos aparecerán aquí." />
      ) : (
        <div style={{ overflowX: "auto", margin: "4px 24px 24px", border: "1px solid var(--border-default)", borderRadius: 3 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-default)" }}>
                <th style={{ ...thS, ...stickyL, background: "var(--surface-sunken)", minWidth: 200 }}>Alumno</th>
                {columns.map((c) => <th key={c.id} style={{ ...thS, textAlign: "center", minWidth: 110 }}>{c.title}</th>)}
                <th style={{ ...thS, ...stickyR, background: "var(--surface-sunken)", textAlign: "center", minWidth: 90 }}>Media</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId} style={{ borderBottom: "1px solid var(--border-subtle)", background: hovered === r.studentId ? "var(--state-hover-row)" : "transparent" }}
                  onMouseEnter={() => setHovered(r.studentId)}
                  onMouseLeave={() => setHovered((h) => (h === r.studentId ? null : h))}>
                  <td style={{ ...tdS, ...stickyL, background: stickyBg(r.studentId) }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={r.student} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{r.student}</span>
                    </span>
                  </td>
                  {r.cells.map((g, ci) => (
                    <td key={ci} style={{ ...tdS, textAlign: "center" }}>
                      <span style={{ display: "inline-flex", minWidth: 40, justifyContent: "center", padding: "3px 8px", borderRadius: "var(--radius-xs)", fontWeight: 700, fontSize: 14, color: gColor(g), background: gBg(g) }}>
                        {g == null ? "—" : g.toFixed(1)}
                      </span>
                    </td>
                  ))}
                  <td style={{ ...tdS, ...stickyR, background: stickyBg(r.studentId), textAlign: "center" }}>
                    <Badge color={r.avg == null ? "default" : r.avg >= 9 ? "success" : r.avg >= 5 ? "info" : "error"}>{r.avg == null ? "—" : r.avg.toFixed(1)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
