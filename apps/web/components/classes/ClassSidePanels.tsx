"use client";

// Paneles de la columna lateral de Módulos: quién está matriculado y cómo van
// las entregas unidad a unidad. Todo sale de datos reales (roster y recuentos
// de entregas de cada actividad), no de la clase.

import { Avatar, Button, Icon } from "@/components/ui";
import { Eyebrow, ProgressBar } from "@/components/layout";
import { ClassThumb } from "./ClassThumb";
import { useActivities, useModules, useMyGrades, useRoster } from "@/lib/api/classwork";
import { isDelivered } from "@/lib/student-task";
import type { Activity, ClassInfo, Module, Role } from "@/lib/types";

// Son secciones de la tarjeta única de la columna: el recuadro y los hairlines
// que las separan los pone .atria-modaside-card.
const SECTION: React.CSSProperties = { display: "flex", flexDirection: "column", minWidth: 0 };

/** Los títulos son "Unidad 1 · Límites"; en la lista basta la primera mitad. */
function unitLead(title: string): string {
  const ix = title.indexOf("·");
  return ix === -1 ? title : title.slice(0, ix).trim();
}

/** Verde cuando casi todo está entregado, ámbar a medias, naranja si va flojo. */
function barColor(ratio: number): string {
  if (ratio >= 0.8) return "var(--success-600)";
  if (ratio >= 0.5) return "var(--yellow-500)";
  return "var(--warning-500)";
}

/** Pila de iniciales con el resto contado al final, como en la lista de alumnos. */
function AvatarStack({ names, max = 5 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex" }}>
        {shown.map((name, i) => (
          <Avatar key={name + i} name={name} size={34} style={{ marginLeft: i ? -10 : 0, boxShadow: "0 0 0 2px var(--surface-card)" }} />
        ))}
      </div>
      {rest > 0 ? <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>+{rest}</span> : null}
    </div>
  );
}

/**
 * Ficha de la clase: el distintivo y los datos que antes iban en la cabecera
 * (código, aula, actividades), fusionados con el recuento de alumnos.
 * El número de matriculados es el de «Alumnos», así que no se repite arriba.
 * El alumno ve la misma ficha sin el recuento (es información del docente) y
 * con el nombre de quien imparte, que en su cabecera iba junto al código.
 */
export function ClassIdentityPanel({ c, role = "docente" }: { c: ClassInfo; role?: Role }) {
  const isTeacher = role !== "alumno";
  // El alumno no pide el roster: no es suyo y la ficha no lo muestra.
  const { data: roster } = useRoster(isTeacher ? c.id : "");
  const students = roster ?? [];
  const active = students.filter((s) => s.submitted > 0).length;
  const teacherLine = !isTeacher && c.teacher ? c.teacher : "";

  return (
    <section style={SECTION}>
      <span style={{ width: "100%", height: 96, borderRadius: "var(--radius-lg)", overflow: "hidden", display: "inline-flex", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}>
        <ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={40} />
      </span>

      {teacherLine ? (
        <div style={{ textAlign: "center", fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", marginTop: 12 }}>{teacherLine}</div>
      ) : null}

      {/* Los tres datos en una fila; sin iconos, que no caben a esta anchura. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: teacherLine ? 6 : 12, fontSize: 13, color: "var(--text-muted)" }}>
        {[c.code, c.room, `${c.openActivities} actividades`].filter(Boolean).map((d, i) => (
          <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {i ? <span aria-hidden="true" style={{ width: 1, height: 13, background: "var(--border-default)" }} /> : null}
            <span style={{ whiteSpace: "nowrap" }}>{d}</span>
          </span>
        ))}
      </div>

      {isTeacher ? (
        <>
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "16px 0 14px" }} />

          <Eyebrow>Alumnos</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "10px 0 14px" }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1 }}>{students.length}</span>
            <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>matriculados</span>
          </div>
          {students.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Invita a tus alumnos desde la pestaña «Alumnos» y aparecerán aquí.
            </p>
          ) : (
            <>
              <AvatarStack names={students.map((s) => s.name)} />
              <p style={{ fontSize: 13, color: "var(--text-body)", margin: "14px 0 8px", lineHeight: 1.45 }}>
                <strong style={{ color: "var(--text-strong)" }}>{active} de {students.length}</strong> han entregado alguna actividad.
              </p>
              <ProgressBar value={active / students.length} />
            </>
          )}
        </>
      ) : null}
    </section>
  );
}

interface UnitRow {
  id: string;
  label: string;
  done: number;
  expected: number;
}

/** Barras por unidad; el significado de done/expected lo pone cada panel. */
function UnitProgressPanel({
  title,
  rows,
  empty,
  actionLabel,
  onAction,
}: {
  title: string;
  rows: UnitRow[];
  empty: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <section style={SECTION}>
      <Eyebrow>{title}</Eyebrow>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "12px 0 0", lineHeight: 1.5 }}>{empty}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
          {rows.map((r) => {
            const ratio = r.expected ? r.done / r.expected : 0;
            return (
              <div key={r.id}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
                    {r.expected ? `${r.done}/${r.expected}` : "Sin actividades"}
                  </span>
                </div>
                <ProgressBar value={ratio} color={barColor(ratio)} />
              </div>
            );
          })}
        </div>
      )}
      {onAction ? (
        <Button
          variant="ghost"
          size="small"
          onClick={onAction}
          iconLeft={<Icon name="clipboard-check" size={16} />}
          style={{ marginTop: 16, marginLeft: -10, alignSelf: "flex-start" }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}

/** Vista del docente: entregas recibidas frente a las esperadas en cada unidad. */
export function ClassUnitProgressPanel({ classId, onReview }: { classId: string; onReview?: () => void }) {
  const { data: modules } = useModules(classId);
  const { data: activities } = useActivities(classId);
  const acts: Activity[] = activities ?? [];

  const rows = (modules ?? []).map((m: Module) => {
    const own = acts.filter((a) => a.moduleId === m.id);
    // total de cada actividad = alumnos matriculados, así que la suma es lo esperado.
    const expected = own.reduce((sum, a) => sum + a.total, 0);
    const done = own.reduce((sum, a) => sum + a.submitted, 0);
    return { id: m.id, label: unitLead(m.title), done, expected };
  });

  return (
    <UnitProgressPanel
      title="Entregas por unidad"
      rows={rows}
      empty="Crea una unidad y sus actividades para seguir aquí las entregas."
      actionLabel="Revisar entregas"
      onAction={onReview}
    />
  );
}

/** Vista del alumno: cuántas actividades de cada unidad ha entregado él. */
export function StudentUnitProgressPanel({ classId, onReview }: { classId: string; onReview?: () => void }) {
  const { data: modules } = useModules(classId);
  const { data: activities } = useActivities(classId);
  const { data: mySubs } = useMyGrades(classId);
  const acts: Activity[] = activities ?? [];
  const delivered = new Set((mySubs ?? []).filter(isDelivered).map((s) => s.activityId));

  const rows = (modules ?? []).map((m: Module) => {
    const own = acts.filter((a) => a.moduleId === m.id);
    return {
      id: m.id,
      label: unitLead(m.title),
      done: own.filter((a) => delivered.has(a.id)).length,
      expected: own.length,
    };
  });

  return (
    <UnitProgressPanel
      title="Mis entregas por unidad"
      rows={rows}
      empty="Cuando tu profesora publique actividades verás aquí lo que llevas entregado."
      actionLabel="Ver mis tareas"
      onAction={onReview}
    />
  );
}
