"use client";

import { Fragment, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Input, RichText, Select, Button, Icon, Switch, IconButton } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useCreateActivity, useModules, useUpdateActivity } from "@/lib/api/classwork";
import { ApiError } from "@/lib/api/client";
import type { Activity, ClassInfo, CreateActivityInput, QuizQuestion } from "@/lib/types";

const types: [string, string, string][] = [
  ["document-text", "Tarea", "var(--success-500)"],
  ["clipboard-check", "Cuestionario", "var(--info-500)"],
  ["folder", "Proyecto", "var(--warning-500)"],
  ["chat", "Debate", "var(--primary-500)"],
];
const TYPE_ENUM: CreateActivityInput["type"][] = ["tarea", "cuestionario", "proyecto", "debate"];

const linkGlyph = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 15l6-6" />
    <path d="M11 6.5l1.2-1.2a3.5 3.5 0 0 1 5 5L17 11.5" />
    <path d="M13 17.5l-1.2 1.2a3.5 3.5 0 0 1-5-5L7 12.5" />
  </svg>
);

const QUIZ_ATTEMPTS = ["1 intento", "2 intentos", "3 intentos", "Ilimitados"];
const POINT_SCALES: { label: string; value: string }[] = [
  { label: "0 - 5", value: "5" },
  { label: "0 - 10", value: "10" },
  { label: "0 - 20", value: "20" },
  { label: "0 - 100", value: "100" },
  { label: "Personalizado", value: "custom" },
];

const uid = () => Math.random().toString(36).slice(2, 8);
const transition = "background .15s ease, box-shadow .15s ease, color .15s ease";

function typeIndexFromLabel(label: string): number {
  const map: Record<string, number> = { Tarea: 0, Ensayo: 0, Cuestionario: 1, Proyecto: 2, Debate: 3 };
  return map[label] ?? 0;
}

function SectionLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", display: "block" }}>{children}</label>
      {hint ? <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

function CorrectDot({ on, onClick, title }: { on: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        flex: "0 0 auto",
        width: 22,
        height: 22,
        borderRadius: "50%",
        cursor: "pointer",
        border: "none",
        background: on ? "var(--success-500)" : "transparent",
        boxShadow: on ? "none" : "inset 0 0 0 2px var(--border-default)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        transition,
      }}
    >
      {on ? <Icon name="check" size={14} /> : null}
    </button>
  );
}

function QuizBuilder({ questions, setQuestions }: { questions: QuizQuestion[]; setQuestions: Dispatch<SetStateAction<QuizQuestion[]>> }) {
  const kinds: Record<QuizQuestion["kind"], string> = {
    multiple: "Opción múltiple",
    truefalse: "Verdadero / Falso",
    short: "Respuesta corta",
  };

  const add = (kind: QuizQuestion["kind"]) => {
    const q: QuizQuestion = { id: uid(), kind, text: "", points: 1 };
    if (kind === "multiple") {
      q.options = [{ id: uid(), text: "" }, { id: uid(), text: "" }];
      q.correct = 0;
    } else if (kind === "truefalse") {
      q.correct = 0;
    } else if (kind === "short") {
      q.answer = "";
    }
    setQuestions((qs) => [...qs, q]);
  };

  const upd = (id: string, patch: Partial<QuizQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const del = (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id));

  const chip: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 700,
    padding: "7px 12px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition,
  };

  return (
    <div>
      <SectionLabel hint="Añade tantas preguntas como necesites y marca la respuesta correcta.">Preguntas</SectionLabel>

      {questions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "26px 16px",
            borderRadius: "var(--radius-lg)",
            border: "1.5px dashed var(--border-default)",
            background: "var(--light)",
            color: "var(--text-muted)",
          }}
        >
          <Icon name="clipboard-check" size={30} color="var(--info-500)" />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", marginTop: 8 }}>Aún no hay preguntas</div>
          <div style={{ fontSize: 13, marginTop: 2 }}>Elige un tipo de pregunta abajo para empezar.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((q, qi) => (
            <div
              key={q.id}
              style={{
                borderRadius: "var(--radius-lg)",
                background: "var(--light)",
                boxShadow: "inset 0 0 0 1px var(--ring-hairline, var(--border-subtle))",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 26,
                    height: 26,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--info-500)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {qi + 1}
                </span>
                <div className="atria-selectwrap" style={{ flex: 1, minWidth: 0 }}>
                  <Select
                    value={kinds[q.kind]}
                    options={Object.values(kinds)}
                    onChange={(v) => {
                      const kind = Object.keys(kinds).find((k) => kinds[k as QuizQuestion["kind"]] === v) as QuizQuestion["kind"];
                      const patch: Partial<QuizQuestion> = { kind };
                      if (kind === "multiple" && !q.options) {
                        patch.options = [{ id: uid(), text: "" }, { id: uid(), text: "" }];
                        patch.correct = 0;
                      }
                      if (kind === "truefalse") patch.correct = (q.correct ?? 0) > 1 ? 0 : (q.correct ?? 0);
                      upd(q.id, patch);
                    }}
                  />
                </div>
                <div style={{ width: 92, flex: "0 0 auto" }}>
                  <Input
                    value={String(q.points)}
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="pts"
                    iconRight={<span style={{ fontSize: 12, color: "var(--text-muted)" }}>pts</span>}
                    onChange={(e) => upd(q.id, { points: Number(e.target.value) || 0 })}
                  />
                </div>
                <IconButton
                  label="Eliminar pregunta"
                  variant="danger"
                  size="small"
                  onClick={() => del(q.id)}
                  icon={<Icon name="trash" size={18} />}
                />
              </div>

              <Input
                value={q.text}
                placeholder={`Escribe la pregunta ${qi + 1}…`}
                onChange={(e) => upd(q.id, { text: e.target.value })}
              />

              {q.kind === "multiple" && q.options ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((op, oi) => (
                    <div key={op.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CorrectDot on={q.correct === oi} onClick={() => upd(q.id, { correct: oi })} title="Marcar como correcta" />
                      <div style={{ flex: 1 }}>
                        <Input
                          value={op.text}
                          placeholder={`Opción ${oi + 1}`}
                          onChange={(e) =>
                            upd(q.id, {
                              options: q.options!.map((x) => (x.id === op.id ? { ...x, text: e.target.value } : x)),
                            })
                          }
                        />
                      </div>
                      {q.options!.length > 2 ? (
                        <IconButton
                          label="Quitar opción"
                          variant="ghost"
                          size="small"
                          onClick={() =>
                            upd(q.id, {
                              options: q.options!.filter((x) => x.id !== op.id),
                              correct: Math.max(0, (q.correct ?? 0) >= oi ? (q.correct ?? 0) - 1 : (q.correct ?? 0)),
                            })
                          }
                          icon={<Icon name="x" size={16} />}
                        />
                      ) : (
                        <span style={{ width: 30 }} />
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => upd(q.id, { options: [...q.options!, { id: uid(), text: "" }] })}
                    style={{
                      alignSelf: "flex-start",
                      marginTop: 2,
                      marginLeft: 32,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--primary-600)",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="plus" size={16} /> Añadir opción
                  </button>
                </div>
              ) : null}

              {q.kind === "truefalse" ? (
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  {["Verdadero", "Falso"].map((lb, oi) => (
                    <button
                      key={lb}
                      type="button"
                      onClick={() => upd(q.id, { correct: oi })}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        border: "none",
                        fontSize: 14,
                        fontWeight: 700,
                        background: q.correct === oi ? "color-mix(in srgb, var(--success-500) 14%, #fff)" : "var(--surface-card)",
                        boxShadow: q.correct === oi ? "inset 0 0 0 2px var(--success-500)" : "inset 0 0 0 1px var(--border-default)",
                        color: q.correct === oi ? "var(--success-600)" : "var(--text-muted)",
                        transition,
                      }}
                    >
                      <CorrectDot on={q.correct === oi} title={lb} onClick={() => upd(q.id, { correct: oi })} /> {lb}
                    </button>
                  ))}
                </div>
              ) : null}

              {q.kind === "short" ? (
                <div style={{ marginTop: 12 }}>
                  <Input
                    label="Respuesta esperada (opcional)"
                    value={q.answer || ""}
                    placeholder="Corrección automática si coincide"
                    onChange={(e) => upd(q.id, { answer: e.target.value })}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
        <button type="button" onClick={() => add("multiple")} style={{ ...chip, background: "var(--info-100)", color: "var(--info-600)" }}>
          <Icon name="clipboard-check" size={16} /> Opción múltiple
        </button>
        <button
          type="button"
          onClick={() => add("truefalse")}
          style={{ ...chip, background: "color-mix(in srgb, var(--success-500) 12%, #fff)", color: "var(--success-600)" }}
        >
          <Icon name="check-circle" size={16} /> Verdadero / Falso
        </button>
        <button type="button" onClick={() => add("short")} style={{ ...chip, background: "var(--primary-100)", color: "var(--primary-600)" }}>
          <Icon name="pencil" size={16} /> Respuesta corta
        </button>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = ["Tipo y título", "Detalles"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: -6 }}>
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const on = step === n;
        const done = step > n;
        return (
          <Fragment key={n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  flex: "0 0 auto",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  transition: "background .15s ease, color .15s ease",
                  background: on || done ? "var(--brand-primary)" : "var(--gray-100)",
                  color: on || done ? "var(--text-on-primary, #fff)" : "var(--text-muted)",
                }}
              >
                {done ? <Icon name="check" size={13} /> : n}
              </span>
              <span style={{ fontSize: 13, fontWeight: on ? 700 : 600, color: on ? "var(--text-strong)" : "var(--text-muted)" }}>{label}</span>
            </div>
            {i < steps.length - 1 ? (
              <span
                style={{
                  width: 24,
                  height: 2,
                  borderRadius: 1,
                  background: step > n ? "var(--brand-primary)" : "var(--border-default)",
                  transition: "background .15s ease",
                }}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

export function CreateActivityModal({ klass, activity, defaultModuleId, onClose, onDone }: { klass?: ClassInfo | null; activity?: Activity | null; defaultModuleId?: string; onClose: () => void; onDone: () => void }) {
  const editing = !!activity;
  const classId = klass?.id ?? activity?.classId ?? "";
  const { data: modules } = useModules(classId);
  const createActivity = useCreateActivity(classId);
  const updateActivity = useUpdateActivity(classId);
  const busy = createActivity.isPending || updateActivity.isPending;

  const [step, setStep] = useState<1 | 2>(1);
  const [ty, setTy] = useState(() => (activity ? typeIndexFromLabel(activity.type) : 0));
  const [fmt, setFmt] = useState(0);
  const [title, setTitle] = useState(activity?.title ?? "");
  const [moduleId, setModuleId] = useState(activity?.moduleId ?? defaultModuleId ?? "");
  const [instructions, setInstructions] = useState(activity?.desc ?? "");
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => activity?.config?.questions ?? []);
  const [timeLimit, setTimeLimit] = useState(() => (activity?.config?.quiz?.timeLimitMin ? String(activity.config.quiz.timeLimitMin) : ""));
  const [attempts, setAttempts] = useState(() => activity?.config?.quiz?.attempts ?? "1 intento");
  const [shuffle, setShuffle] = useState(() => activity?.config?.quiz?.shuffle ?? false);
  const [openingQuestion, setOpeningQuestion] = useState(() => activity?.config?.debate?.openingQuestion ?? "");
  const [minReplies, setMinReplies] = useState(() => (activity?.config?.debate?.minReplies != null ? String(activity.config.debate.minReplies) : ""));
  const [minWords, setMinWords] = useState(() => (activity?.config?.debate?.minWords != null ? String(activity.config.debate.minWords) : ""));
  const [postBeforeSee, setPostBeforeSee] = useState(() => activity?.config?.debate?.postBeforeSeeing ?? true);
  const [dueAt, setDueAt] = useState(activity?.due ?? "");
  const [points, setPoints] = useState(activity?.points ? String(activity.points) : "10");
  const [pointsScale, setPointsScale] = useState<string>(() => {
    const initial = activity?.points ? String(activity.points) : "10";
    return POINT_SCALES.some((s) => s.value === initial) ? initial : "custom";
  });
  const [allowLate, setAllowLate] = useState(activity?.allowLate ?? true);
  const [error, setError] = useState<string | null>(null);

  const formats: [ReactNode, string][] = [
    [<Icon key="f0" name="document-add" size={24} />, "Archivo"],
    [<Icon key="f1" name="pencil" size={24} />, "Texto"],
    [linkGlyph, "Enlace"],
    [<Icon key="f3" name="clipboard-check" size={24} />, "Examen"],
  ];
  const tint = (col: string) => `color-mix(in srgb, ${col} 14%, #fff)`;

  const isQuiz = ty === 1;
  const isDebate = ty === 3;
  const hasInstructions = ty === 0 || ty === 2;
  const quizPoints = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);
  const titleOk = title.trim().length > 0;

  const titlePlaceholder = isQuiz
    ? "Ej. Cuestionario 4 — Integrales"
    : isDebate
      ? "Ej. ¿Es el infinito un número?"
      : "Ej. Explica tu idea: límites";

  const submit = async (status: "live" | "draft") => {
    if (!classId) return;
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setError(null);
    try {
      const payload: CreateActivityInput = {
        type: TYPE_ENUM[ty],
        title: title.trim(),
        instructions: hasInstructions ? instructions.trim() : "",
        dueAt: dueAt.trim(),
        points: isQuiz ? quizPoints : parseInt(points, 10) || 0,
        format: hasInstructions ? formats[fmt][1] : "Archivo",
        status,
        moduleId: moduleId || undefined,
        allowLate: isQuiz ? true : allowLate,
      };

      if (isQuiz) {
        payload.questions = questions;
        payload.quiz = {
          timeLimitMin: parseInt(timeLimit, 10) || undefined,
          attempts,
          shuffle,
        };
      }

      if (isDebate) {
        payload.debate = {
          openingQuestion: openingQuestion.trim(),
          minReplies: parseInt(minReplies, 10) || undefined,
          minWords: parseInt(minWords, 10) || undefined,
          postBeforeSeeing: postBeforeSee,
        };
      }

      await (editing && activity
        ? updateActivity.mutateAsync({ id: activity.id, ...payload })
        : createActivity.mutateAsync(payload));
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.message) as { message?: string | string[] };
          const msg = parsed.message;
          setError(Array.isArray(msg) ? msg.join(". ") : msg || err.message);
        } catch {
          setError(err.message || (editing ? "No se pudo guardar la actividad." : "No se pudo crear la actividad."));
        }
      } else {
        setError(editing ? "No se pudo guardar la actividad." : "No se pudo crear la actividad.");
      }
    }
  };

  const footer =
    step === 1 ? (
      <>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="accent" disabled={!titleOk} onClick={() => titleOk && setStep(2)}>
          Siguiente
        </Button>
      </>
    ) : (
      <>
        {isQuiz ? (
          <span style={{ marginRight: "auto", fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
            <strong style={{ color: "var(--text-strong)" }}>{questions.length}</strong>{" "}
            {questions.length === 1 ? "pregunta" : "preguntas"} · <strong style={{ color: "var(--text-strong)" }}>{quizPoints}</strong> pts
          </span>
        ) : null}
        <Button variant="outline" onClick={() => setStep(1)}>
          Atrás
        </Button>
        <Button variant="outline" onClick={() => submit("draft")} disabled={busy}>
          Borrador
        </Button>
        <Button variant="accent" onClick={() => submit("live")} disabled={busy}>
          {busy ? (editing ? "Guardando…" : "Publicando…") : editing ? "Guardar cambios" : "Publicar"}
        </Button>
      </>
    );

  return (
    <Modal title={editing ? "Editar actividad" : "Nueva actividad"} onClose={onClose} footer={footer} width={isQuiz && step === 2 ? 780 : 640}>
      <div className="atria-formcard" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: -4 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{klass ? klass.name : ""}</div>
          <StepIndicator step={step} />
        </div>

        {error ? (
          <div
            style={{
              fontSize: 13,
              color: "var(--status-error)",
              background: "var(--status-error-soft)",
              borderRadius: "var(--radius-sm)",
              padding: "9px 12px",
            }}
          >
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <SectionLabel>Tipo de actividad</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {types.map(([ic, lb, col], i) => {
                  const on = ty === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTy(i)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        padding: "14px 8px",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        background: on ? tint(col) : "var(--gray-100)",
                        boxShadow: on ? `inset 0 0 0 2px ${col}` : "inset 0 0 0 2px var(--border-default)",
                        color: on ? col : "var(--text-muted)",
                        transition,
                      }}
                    >
                      <Icon name={ic} size={24} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{lb}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="atria-selectwrap">
              <Select
                label="Módulo"
                value={moduleId ? (modules ?? []).find((m) => m.id === moduleId)?.title ?? "" : ""}
                options={(modules ?? []).map((m) => m.title)}
                placeholder="Selecciona un módulo"
                onChange={(v) => setModuleId((modules ?? []).find((m) => m.title === v)?.id ?? "")}
              />
            </div>

            <Input
              label="Título"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
            />
          </>
        ) : (
          <>
            {hasInstructions ? (
              <RichText
                label="Instrucciones"
                minHeight={130}
                value={instructions}
                onChange={setInstructions}
                placeholder="Describe qué deben hacer los alumnos…"
              />
            ) : null}

            {isDebate ? (
              <RichText
                label="Pregunta de apertura"
                minHeight={100}
                value={openingQuestion}
                onChange={setOpeningQuestion}
                placeholder="Plantea el tema o la pregunta que abrirá el debate…"
              />
            ) : null}

            {isQuiz ? <QuizBuilder questions={questions} setQuestions={setQuestions} /> : null}

            {isQuiz ? (
              <div>
                <SectionLabel>Ajustes del cuestionario</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Input
                    label="Tiempo límite (min)"
                    placeholder="20"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    iconRight={<Icon name="clock" size={18} color="var(--text-muted)" />}
                  />
                  <div className="atria-selectwrap">
                    <Select
                      label="Intentos permitidos"
                      value={attempts}
                      options={QUIZ_ATTEMPTS}
                      placeholder="1 intento"
                      onChange={setAttempts}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Barajar preguntas</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Cada alumno las recibe en distinto orden.</div>
                  </div>
                  <Switch checked={shuffle} onChange={setShuffle} />
                </div>
              </div>
            ) : null}

            {hasInstructions ? (
              <div>
                <SectionLabel>Formato de entrega</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {formats.map(([glyph, lb], i) => {
                    const on = fmt === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFmt(i)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          padding: "14px 8px",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: on ? "var(--primary-100)" : "var(--gray-100)",
                          boxShadow: on ? "inset 0 0 0 2px var(--brand-primary)" : "inset 0 0 0 2px var(--border-default)",
                          color: on ? "var(--primary-700)" : "var(--text-muted)",
                          transition,
                        }}
                      >
                        {glyph}
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{lb}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isDebate ? (
              <div>
                <SectionLabel>Ajustes del debate</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Input
                    label="Réplicas mínimas"
                    placeholder="2"
                    type="number"
                    value={minReplies}
                    onChange={(e) => setMinReplies(e.target.value)}
                  />
                  <Input
                    label="Palabras mínimas"
                    placeholder="80"
                    type="number"
                    value={minWords}
                    onChange={(e) => setMinWords(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>Publicar antes de ver</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>El alumno responde antes de leer a los demás.</div>
                  </div>
                  <Switch checked={postBeforeSee} onChange={setPostBeforeSee} />
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Input label="Fecha límite" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              {isQuiz ? (
                <Input
                  label="Puntos totales"
                  value={String(quizPoints)}
                  readOnly
                  iconRight={<span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>auto</span>}
                />
              ) : (
                <div className="atria-selectwrap">
                  <Select
                    label="Puntos"
                    value={pointsScale}
                    options={POINT_SCALES}
                    onChange={(v) => {
                      setPointsScale(v);
                      if (v !== "custom") setPoints(v);
                    }}
                  />
                </div>
              )}
            </div>

            {!isQuiz && pointsScale === "custom" ? (
              <Input
                label="Puntos máximos"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="15"
                type="number"
              />
            ) : null}

            {!isQuiz ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
                    {isDebate ? "Permitir respuestas atrasadas" : "Permitir entregas atrasadas"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Se marcarán como «Atrasado».</div>
                </div>
                <Switch checked={allowLate} onChange={setAllowLate} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
