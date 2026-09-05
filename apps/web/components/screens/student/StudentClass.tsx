"use client";

import { useEffect, useState } from "react";
import { Icon, Button } from "@/components/ui";
import { Chip, EmptyState, ClassShell, Panel } from "@/components/layout";
import { StudentGradesTable } from "./StudentGradesTable";
import { StudentTaskList } from "@/components/student/StudentTaskList";
import { ModuleResourceGrid } from "@/components/modules/ModuleResourceGrid";
import { ModuleSessions } from "@/components/modules/ModuleSessions";
import { UnitDescription } from "@/components/modules/UnitDescription";
import { ActivityPill } from "@/components/activities/ActivityPill";
import { DebateBoard } from "@/components/activities/DebateBoard";
import { ActivityDetailModal } from "@/components/modals/ActivityDetailModal";
import { ABOUT_UNIT, AboutRailItem, ClassAbout, RAIL_DIVIDER } from "@/components/classes/ClassAbout";
import { ClassChatPanel } from "@/components/classes/ClassChatPanel";
import { ClassIdentityPanel, StudentUnitProgressPanel } from "@/components/classes/ClassSidePanels";
import { useActivities, useModules, useMyGrades } from "@/lib/api/classwork";
import { useSettings } from "@/components/settings/SettingsContext";
import { buildUnits, NONE_UNIT } from "@/lib/units";
import { studentTaskBadge, isDelivered } from "@/lib/student-task";
import { PAGE_SIZE } from "@/lib/pagination";
import type { Activity, ClassInfo, StudentTaskDto } from "@/lib/types";

function modParts(title: string): [string, string] {
  const ix = title.indexOf("·");
  return ix === -1 ? [title, ""] : [title.slice(0, ix).trim(), title.slice(ix + 1).trim()];
}

const SECTION_LABEL: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 };

export interface StudentClassProps {
  klass: ClassInfo;
  onBack: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export function StudentClass({ klass, onBack, onProfile, onLogout }: StudentClassProps) {
  const { role } = useSettings();
  const c = klass;
  const { data: activities } = useActivities(c.id);
  const { data: modulesData } = useModules(c.id);
  const { data: mySubs } = useMyGrades(c.id);
  const modules = modulesData ?? [];
  const { units, actsOf } = buildUnits(modules, activities ?? []);
  const subByActivity = new Map((mySubs ?? []).map((s) => [s.activityId, s]));
  const delivered = new Set((mySubs ?? []).filter(isDelivered).map((s) => s.activityId));
  const published = activities ?? [];
  const progressRatio = published.length ? published.filter((a) => delivered.has(a.id)).length / published.length : 0;
  const unitsForStudent = units.map((m) => {
    const own = actsOf(m.id);
    return { ...m, done: own.length > 0 && own.every((a) => delivered.has(a.id)) };
  });
  const classTasks: StudentTaskDto[] = (activities ?? []).map((a) => ({
    ...a,
    className: c.name,
    mySubmission: subByActivity.get(a.id) ?? null,
  }));
  const debates = (activities ?? []).filter((a) => a.type === "Debate");
  const [tab, setTab] = useState("contenido");
  const [debateId, setDebateId] = useState<string>("");
  const currentDebate = debates.find((a) => a.id === debateId) ?? debates[0];
  // El temario abre por «Sobre el curso»: la ficha del curso con portada y descripción.
  const [selMod, setSelMod] = useState<string>(ABOUT_UNIT);
  const [detail, setDetail] = useState<Activity | null>(null);
  useEffect(() => {
    if (selMod !== ABOUT_UNIT && !units.some((m) => m.id === selMod)) setSelMod(units.length ? units[0].id : ABOUT_UNIT);
  }, [units, selMod]);
  const showAbout = selMod === ABOUT_UNIT;
  const curMod = showAbout ? undefined : unitsForStudent.find((m) => m.id === selMod) || unitsForStudent[0];

  const progress = (
    <div key="prog" style={{ minWidth: 180 }}>
      <div style={{ fontSize: 12.5, color: "var(--header-muted)", marginBottom: 6 }}>Tu progreso · {Math.round(progressRatio * 100)}%</div>
      <div style={{ height: 8, background: "var(--header-btn-bg)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: progressRatio * 100 + "%", height: "100%", background: "var(--header-fg)", borderRadius: 999 }} />
      </div>
    </div>
  );

  return (
    <ClassShell
      klass={c}
      role={role}
      onBack={onBack}
      onProfile={onProfile}
      onLogout={onLogout}
      // Distintivo y datos de la clase bajan a la ficha de la columna lateral.
      showIcon={false}
      rightExtra={progress}
      tab={tab}
      onTab={setTab}
      tabs={[{ label: "Contenido", value: "contenido" }, { label: "Tareas", value: "tareas" }, { label: "Notas", value: "notas" }, { label: "Foro", value: "foro" }]}
    >
      {tab === "contenido" ? (
        <div className="atria-2col atria-modules" style={{ display: "grid", gridTemplateColumns: "256px minmax(0, 1fr) 320px", gap: 0, alignItems: "start", background: "var(--surface-card)", boxShadow: "var(--ring-hairline), var(--shadow-md)", borderRadius: "var(--radius-xl)", padding: "24px 28px" }}>
          <div className="atria-modules-rail" style={{ display: "flex", flexDirection: "column", paddingRight: 28, borderRight: "1px solid var(--border-subtle)", position: "sticky", top: 0 }}>
            <AboutRailItem active={showAbout} onSelect={() => setSelMod(ABOUT_UNIT)} />
            <div style={RAIL_DIVIDER} />
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 8px 12px" }}>Unidades</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {unitsForStudent.map((m) => {
                const active = m.id === curMod?.id;
                const [lead, sub] = modParts(m.title);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelMod(m.id)}
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
          </div>

          {showAbout ? (
            <div className="atria-modmain" style={{ paddingLeft: 28 }}>
              <ClassAbout c={c} embedded />
            </div>
          ) : curMod ? (
            <div key={curMod.id} className="atria-modmain" style={{ paddingLeft: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: curMod.done ? "var(--success-100)" : "var(--surface-soft)", color: curMod.done ? "var(--success-600)" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={curMod.done ? "check" : "book-open"} size={18} />
                </span>
                <h3 style={{ fontSize: 18, margin: 0, flex: 1 }}>{curMod.title}</h3>
                {curMod.id !== NONE_UNIT ? <Chip>{curMod.items.length} recursos</Chip> : null}
              </div>
              <UnitDescription text={curMod.description} coverUrl={curMod.coverUrl} />
              {curMod.id !== NONE_UNIT && curMod.sessions.length ? (
                <>
                  <div style={SECTION_LABEL}>Sesión online</div>
                  <div style={{ marginBottom: 22 }}>
                    <ModuleSessions classId={c.id} moduleId={curMod.id} sessions={curMod.sessions} />
                  </div>
                </>
              ) : null}
              {curMod.id !== NONE_UNIT ? (
                <>
                  <div style={SECTION_LABEL}>Recursos</div>
                  <ModuleResourceGrid classId={c.id} items={curMod.items} />
                </>
              ) : null}
              <div style={{ marginTop: 22 }}>
                <div style={SECTION_LABEL}>Actividades</div>
                {actsOf(curMod.id).length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {actsOf(curMod.id).map((a) => <ActivityPill key={a.id} activity={a} onOpen={() => setDetail(a)} badge={studentTaskBadge(subByActivity.get(a.id))} />)}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No hay actividades en esta unidad.</div>
                )}
              </div>
            </div>
          ) : (
            // Hueco vacío: sin él la columna del chat ocuparía la del temario.
            <div />
          )}

          {/* El recuento de alumnos se queda fuera: es información del docente. */}
          <div className="atria-modaside" style={{ paddingLeft: 28, borderLeft: "1px solid rgb(237, 236, 236)", position: "sticky", top: 0 }}>
            <div className="atria-modaside-card">
              <ClassIdentityPanel c={c} role="alumno" />
              <StudentUnitProgressPanel classId={c.id} onReview={() => setTab("tareas")} />
              <ClassChatPanel classId={c.id} />
            </div>
          </div>
        </div>
      ) : tab === "notas" ? (
        <StudentGradesTable rows={mySubs ?? []} />
      ) : tab === "tareas" ? (
        classTasks.length ? (
          <Panel pad={0}>
            <StudentTaskList tasks={classTasks} onOpen={setDetail} showClass={false} pageSize={PAGE_SIZE} />
          </Panel>
        ) : (
          <EmptyState
            illo="empty-submissions"
            title="No tienes tareas abiertas"
            text="Cuando tu profesora publique una actividad aparecerá aquí."
          />
        )
      ) : debates.length ? (
        currentDebate ? (
          <DebateBoard
            activity={currentDebate}
            role="alumno"
            debates={debates}
            onSelectDebate={setDebateId}
          />
        ) : null
      ) : (
        <EmptyState
          illo="empty-messages"
          title="El foro está tranquilo"
          text="Cuando tu profesora abra un debate aparecerá aquí para que participes."
        />
      )}
      {detail ? (
        <ActivityDetailModal
          activity={detail}
          role="alumno"
          classId={c.id}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </ClassShell>
  );
}
