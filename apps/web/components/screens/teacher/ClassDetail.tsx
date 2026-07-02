"use client";

import { useEffect, useState } from "react";
import { DataTable, Badge, Button, Icon, Avatar, Select, type Column } from "@/components/ui";
import { Chip, Panel, EmptyState, ClassShell, ProgressBar } from "@/components/layout";
import { Donut } from "@/components/charts";
import { GradebookTable } from "./GradebookTable";
import { GradeModal } from "@/components/modals/GradeModal";
import { modules, students } from "@/lib/data";
import { useActivities, useGradebook, useGradeSubmission, useSubmissions } from "@/lib/api/classwork";
import { useSettings, type ModLayout } from "@/components/settings/SettingsContext";
import type { BadgeColor, ClassInfo, Module, ModuleItem, SubmissionDto } from "@/lib/types";

const statusMap: Record<string, BadgeColor> = { Entregado: "success", Pendiente: "warning", Atrasado: "error", Borrador: "default" };

const TYPE_META: Record<string, [string, string]> = {
  Tarea: ["document-text", "var(--success-500)"],
  Cuestionario: ["clipboard-check", "var(--info-500)"],
  Proyecto: ["folder", "var(--warning-500)"],
  Ensayo: ["document-text", "var(--primary-500)"],
  Debate: ["chat", "var(--primary-500)"],
};
const typeMeta = (t: string): [string, string] => TYPE_META[t] || ["document-text", "var(--primary-500)"];

function modParts(title: string): [string, string] {
  const ix = title.indexOf("·");
  return ix === -1 ? [title, ""] : [title.slice(0, ix).trim(), title.slice(ix + 1).trim()];
}
const MOD_BADGE: Record<string, BadgeColor> = { Nuevo: "new", Abierto: "info", Visto: "default", Completado: "success" };

function ModuleResource({ it }: { it: ModuleItem }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)" }}>
      <Icon name={it.type} size={20} color="var(--text-muted)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{it.label}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{it.meta}</div>
      </div>
      {it.state ? <Badge color={MOD_BADGE[it.state] || "default"}>{it.state}</Badge> : null}
    </div>
  );
}

function ModulesRailLayout({ flat }: { flat?: boolean }) {
  const [sel, setSel] = useState<string | null>(modules[0]?.id ?? null);
  const current = modules.find((m) => m.id === sel) || modules[0];
  const chrome = flat
    ? { background: "#fff", boxShadow: "none", borderRadius: 0, padding: "8px 0" }
    : { background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", padding: "24px 28px" };

  return (
    <div className="atria-2col atria-modules" style={{ display: "grid", gridTemplateColumns: "256px 1fr", gap: 0, alignItems: "start", ...chrome }}>
      <div className="atria-modules-rail" style={{ display: "flex", flexDirection: "column", paddingRight: 28, borderRight: "1px solid var(--border-subtle)", position: "sticky", top: 0, borderColor: "rgb(237, 236, 236)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 8px 12px" }}>Unidades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {modules.map((m) => {
            const active = m.id === current.id;
            const [lead, sub] = modParts(m.title);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSel(m.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", border: "none", cursor: "pointer", width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", background: active ? "var(--primary-100)" : "transparent", transition: "background .15s ease" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--state-hover-tint)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "50%", background: m.done ? "var(--success-100)" : "var(--surface-soft)", color: m.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={m.done ? "check" : "book-open"} size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: active ? "var(--brand-primary)" : "var(--text-strong)" }}>{lead}</span>
                  {sub ? <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{sub}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="small" iconLeft={<Icon name="plus" size={16} />} style={{ alignSelf: "flex-start", marginTop: 10 }}>Añadir unidad</Button>
      </div>

      {current ? (
        <div key={current.id} style={{ paddingLeft: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: current.done ? "var(--success-100)" : "var(--surface-soft)", color: current.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={current.done ? "check" : "book-open"} size={18} />
            </span>
            <h3 style={{ fontSize: 18, margin: 0, flex: 1 }}>{current.title}</h3>
            <Chip>{current.items.length} recursos</Chip>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {current.items.map((it, i) => <ModuleResource key={i} it={it} />)}
            <Button variant="ghost" size="small" iconLeft={<Icon name="plus" size={16} />} style={{ alignSelf: "flex-start", marginTop: 2 }}>Añadir recurso</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModulesAccordion() {
  const [open, setOpen] = useState<string | null>(modules[0]?.id ?? null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {modules.map((m) => {
        const expanded = m.id === open;
        const [lead, sub] = modParts(m.title);
        return (
          <div key={m.id} style={{ background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : m.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: "transparent", padding: "16px 20px", transition: "background .15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "50%", background: m.done ? "var(--success-100)" : "var(--surface-soft)", color: m.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={m.done ? "check" : "book-open"} size={18} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{lead}</span>
                {sub ? <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>{sub}</span> : null}
              </span>
              <Chip>{m.items.length} recursos</Chip>
              <span style={{ color: "var(--text-muted)", display: "inline-flex", transition: "transform .15s ease", transform: expanded ? "rotate(180deg)" : "none" }}>
                <Icon name="chevron-down" size={20} />
              </span>
            </button>
            {expanded ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px 18px", borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
                {m.items.map((it, i) => <ModuleResource key={i} it={it} />)}
                <Button variant="ghost" size="small" iconLeft={<Icon name="plus" size={16} />} style={{ alignSelf: "flex-start", marginTop: 2 }}>Añadir recurso</Button>
              </div>
            ) : null}
          </div>
        );
      })}
      <Button variant="ghost" size="small" iconLeft={<Icon name="plus" size={16} />} style={{ alignSelf: "flex-start" }}>Añadir unidad</Button>
    </div>
  );
}

function ClassModules({ layout }: { layout: ModLayout }) {
  if (layout === "plano") return <ModulesRailLayout flat />;
  if (layout === "acordeon") return <ModulesAccordion />;
  return <ModulesRailLayout />;
}

function ClassStudents() {
  const rows = students.slice(0, 8).map((s) => ({ ...s, avgStr: s.avg.toFixed(1) }));
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "name", label: "Alumno", render: (v) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={v as string} size="sm" /><span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span></span> },
    { key: "email", label: "Correo", render: (v) => <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{v as string}</span> },
    { key: "progress", label: "Progreso", render: (v) => <div style={{ width: 120 }}><ProgressBar value={v as number} showLabel /></div> },
    { key: "avgStr", label: "Media", render: (v) => <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{v as string}</span> },
  ];
  return <DataTable title="Alumnos · 32" rowKey="id" columns={cols} rows={rows} selectable={false} toolbar={<Button size="small" variant="outline" iconLeft={<Icon name="plus" size={16} />}>Invitar</Button>} />;
}

function ClassOverview({ c }: { c: ClassInfo }) {
  const { data: activities } = useActivities(c.id);
  const details = [
    { icon: "academic-cap", label: "Código", value: c.code, tint: "var(--primary-100)", fg: "var(--primary-600)" },
    { icon: "home", label: "Aula", value: c.room, tint: "var(--info-100)", fg: "var(--info-600)" },
    { icon: "users", label: "Alumnos", value: c.students, tint: "var(--success-100)", fg: "var(--success-600)" },
    { icon: "clipboard-check", label: "Entregas pendientes", value: c.pending, tint: "var(--yellow-200)", fg: "var(--yellow-700)" },
    { icon: "calendar", label: "Próxima sesión", value: c.nextSession, tint: "var(--info-100)", fg: "var(--info-600)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {details.map((x) => (
          <div key={x.label} style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: x.tint, color: x.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={x.icon} size={24} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.1 }}>{x.value}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>{x.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22, alignItems: "stretch" }} className="atria-2col">
        <Panel title="Actividades">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(activities ?? []).map((a) => {
              const [tIcon, tColor] = typeMeta(a.type);
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)" }}>
                  <span style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${tColor} 14%, #fff)`, color: tColor, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={tIcon} size={20} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{a.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{a.type} · {a.points} pts · vence {a.due}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{a.submitted}/{a.total}</span>
                    <Badge type="solid" color={a.status[1]}>{a.status[0]}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Progreso de la clase">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 20, height: "100%" }}>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>2 de 3 unidades completadas. Próxima sesión {c.nextSession}.</p>
            <Donut value={c.progress} size={200} stroke={18} color={c.color} sub="del temario" />
            <p style={{ fontSize: 13.5, color: "var(--text-body)", margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export interface ClassDetailProps {
  klass: ClassInfo;
  onBack: () => void;
  onProfile: () => void;
  onLogout: () => void;
  onNewActivity: (c: ClassInfo) => void;
}

export function ClassDetail({ klass, onBack, onProfile, onLogout, onNewActivity }: ClassDetailProps) {
  const { role, modLayout } = useSettings();
  const [tab, setTab] = useState("resumen");
  const [gradeSub, setGradeSub] = useState<SubmissionDto | null>(null);
  const c = klass;

  const { data: activities } = useActivities(c.id);
  const [activityId, setActivityId] = useState<string>("");
  useEffect(() => {
    if (!activityId && activities && activities.length) setActivityId(activities[0].id);
  }, [activities, activityId]);
  const { data: subs } = useSubmissions(activityId || undefined);
  const gradebook = useGradebook(c.id);
  const gradeMut = useGradeSubmission(activityId || undefined, c.id);

  const rows = subs ?? [];
  const pendientes = rows.filter((r) => r.status !== "Entregado").length;
  const selectedActivity = (activities ?? []).find((a) => a.id === activityId);

  const subCols: Column<SubmissionDto>[] = [
    { key: "student", label: "Alumno", render: (v) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Avatar name={v as string} size="sm" /> <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{v as string}</span></span> },
    { key: "date", label: "Entrega" },
    { key: "status", label: "Estado", render: (v) => <Badge color={statusMap[v as string]}>{v as string}</Badge> },
    { key: "grade", label: "Nota", render: (v) => <span style={{ fontWeight: 700, color: v === "—" ? "var(--text-muted)" : "var(--text-strong)" }}>{v as string}</span> },
    { key: "actions", label: "", sortable: false, align: "right", render: (_, r) => (r.id.startsWith("pending-") ? <span style={{ fontSize: 13, color: "var(--text-muted)" }}>—</span> : <Button size="small" variant={r.grade === "—" ? "accent" : "outline"} onClick={() => setGradeSub(r)}>{r.grade === "—" ? "Calificar" : "Revisar"}</Button>) },
  ];

  return (
    <>
      <ClassShell
        klass={c}
        role={role}
        onBack={onBack}
        onProfile={onProfile}
        onLogout={onLogout}
        meta={`${c.code} · ${c.room} · ${c.students} alumnos · ${c.openActivities} actividades abiertas`}
        badge={c.status}
        actions={<Button variant="accent" iconLeft={<Icon name="plus" />} onClick={() => onNewActivity(c)}>Nueva actividad</Button>}
        tab={tab}
        onTab={setTab}
        tabs={[
          { label: "Resumen", value: "resumen" },
          { label: "Módulos", value: "modulos" },
          { label: "Entregas", value: "entregas" },
          { label: "Calificaciones", value: "calificaciones" },
          { label: "Alumnos", value: "alumnos" },
          { label: "Foro", value: "foro" },
        ]}
      >
        {tab === "resumen" ? <ClassOverview c={c} /> : null}
        {tab === "modulos" ? <ClassModules layout={modLayout} /> : null}
        {tab === "entregas" ? (
          <DataTable
            title={`Entregas · ${selectedActivity?.title ?? "Actividad"}`}
            rowKey="id"
            columns={subCols}
            rows={rows}
            selectable={false}
            toolbar={
              <>
                <div className="atria-selectwrap" style={{ width: 240 }}>
                  <Select value={activityId} options={(activities ?? []).map((a) => ({ label: a.title, value: a.id }))} onChange={setActivityId} placeholder="Actividad" />
                </div>
                <Chip icon="clock">{pendientes} pendientes</Chip>
                <Button size="small" variant="outline" iconLeft={<Icon name="download" size={16} />}>Exportar</Button>
              </>
            }
          />
        ) : null}
        {tab === "calificaciones" ? <GradebookTable data={gradebook.data} /> : null}
        {tab === "alumnos" ? <ClassStudents /> : null}
        {tab === "foro" ? (
          <EmptyState illo="empty-messages" title="Aún no hay temas en el foro" text="Abre el primer hilo para que tus alumnos puedan plantear dudas y debatir." action={<Button variant="accent" iconLeft={<Icon name="plus" />}>Nuevo tema</Button>} />
        ) : null}
      </ClassShell>
      {gradeSub ? (
        <GradeModal
          submission={gradeSub}
          onClose={() => setGradeSub(null)}
          onSave={async (score, feedback) => {
            await gradeMut.mutateAsync({ id: gradeSub.id, score, feedback });
          }}
        />
      ) : null}
    </>
  );
}
