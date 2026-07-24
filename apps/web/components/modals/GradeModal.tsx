"use client";

import { useState } from "react";
import { Button, Avatar, Badge, Icon, Textarea, IconButton } from "@/components/ui";
import { Modal, Eyebrow } from "@/components/layout";
import { QuizQuestions } from "@/components/activities/QuizQuestions";
import { fileExtLabel, filePreviewUrl } from "@/lib/resources";
import { resourceUrl } from "@/lib/api/client";
import type { DebatePostDto, QuizQuestion, SubmissionDto } from "@/lib/types";

const FALLBACK: SubmissionDto = { id: "0", studentId: "0", student: "Alba García", activityId: "a1", activity: "Explica tu idea: límites", date: "12 / 10 / 2022", status: "Entregado", grade: "—", feedback: "", late: false };
/** Grades are typed or dragged: whole numbers stay whole, halves keep one decimal. */
function formatGrade(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function GradeModal({
  submission,
  questions,
  debatePosts,
  onClose,
  onSave,
}: {
  submission?: SubmissionDto | null;
  /** Quiz questions of the activity, so the answers can be shown next to the right ones. */
  questions?: QuizQuestion[];
  /** Debate thread of the activity; only this student's contributions are shown. */
  debatePosts?: DebatePostDto[];
  onClose: () => void;
  onSave?: (score: number, feedback: string) => Promise<void>;
}) {
  const s = submission || FALLBACK;
  const [grade, setGrade] = useState(s.grade && s.grade !== "—" ? s.grade : "");
  const [feedback, setFeedback] = useState(s.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const parsed = parseFloat(grade.replace(",", "."));
  const sliderValue = Number.isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed));
  const isQuiz = !!questions?.length;
  const isDebate = !!debatePosts;
  // Sus intervenciones: raíces propias y respuestas propias colgadas de otros.
  const myRoots = (debatePosts ?? []).filter((p) => p.authorId === s.studentId);
  const myReplies = (debatePosts ?? [])
    .flatMap((p) => p.replies.map((r) => ({ reply: r, to: p.author })))
    .filter(({ reply }) => reply.authorId === s.studentId);
  const fileHref = s.fileUrl ? resourceUrl(s.fileUrl) : "";
  const preview = s.fileUrl ? filePreviewUrl(s.fileUrl) : null;

  const save = async () => {
    const score = parseFloat(grade.replace(",", "."));
    if (!onSave || Number.isNaN(score)) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(score, feedback);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Saltar</Button>
      <Button variant="accent" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar nota"}</Button>
    </>
  );

  return (
    <Modal title="Calificar entrega" onClose={onClose} footer={footer} width={980}>
      <div className="atria-2col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={s.student} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)" }}>{s.student}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{s.activity} · entregado el {s.date}</div>
            </div>
            <Badge color={s.status === "Atrasado" ? "error" : s.status === "Pendiente" ? "warning" : "success"}>{s.status}</Badge>
          </div>

          {s.comment ? (
            <div>
              <Eyebrow>Comentario del alumno</Eyebrow>
              <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.7, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{s.comment}</p>
            </div>
          ) : null}

          <div>
            <Eyebrow>{isQuiz ? "Respuestas del alumno" : isDebate ? "Intervenciones en el debate" : "Entrega del alumno"}</Eyebrow>
            {isQuiz ? (
              <QuizQuestions questions={questions ?? []} answers={s.answers ?? {}} showCorrect />
            ) : isDebate ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {myRoots.length} intervención{myRoots.length === 1 ? "" : "es"} · {myReplies.length} respuesta{myReplies.length === 1 ? "" : "s"} a compañeros
                </div>
                {myRoots.map((p) => (
                  <div key={p.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-soft)", boxShadow: "var(--ring-hairline)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Intervención · {p.date}</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{p.body}</p>
                  </div>
                ))}
                {myReplies.map(({ reply, to }) => (
                  <div key={reply.id} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-border)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>En respuesta a {to} · {reply.date}</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{reply.body}</p>
                  </div>
                ))}
                {!myRoots.length && !myReplies.length ? (
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)" }}>Este alumno todavía no ha participado en el debate.</p>
                ) : null}
              </div>
            ) : fileHref ? (
              <>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-border)" }}>
                  <Icon name="document-text" size={20} color="var(--primary-600)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", wordBreak: "break-word" }}>{s.fileName ?? "Archivo"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fileExtLabel(s.fileUrl ?? "") || "Archivo"}{s.late ? " · entregado tarde" : ""}</div>
                  </div>
                  <a href={fileHref} target="_blank" rel="noopener noreferrer" download style={{ display: "inline-flex" }}>
                    <IconButton size="small" variant="ghost" label="Descargar" icon={<Icon name="download" size={18} />} />
                  </a>
                </div>
                {preview ? (
                  <iframe
                    src={preview}
                    title={s.fileName ?? "Entrega"}
                    style={{ width: "100%", height: "min(58vh, 440px)", marginTop: 12, border: "none", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", boxShadow: "var(--ring-hairline)" }}
                  />
                ) : (
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                    Este formato no se puede previsualizar aquí. Descarga el archivo para revisarlo.
                  </p>
                )}
              </>
            ) : (
              <p style={{ margin: "12px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>
                {s.comment ? "El alumno no ha adjuntado ningún archivo." : "Sin entrega: el alumno no ha subido archivo ni comentario."}
              </p>
            )}
          </div>
        </div>

        <div style={{ borderLeft: "1px solid var(--border-subtle)", paddingLeft: 24 }}>
          <Eyebrow>Nota</Eyebrow>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "8px 0 14px" }}>
            <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="0.0" style={{ width: 96, fontSize: 40, fontWeight: 700, color: "var(--brand-primary)", border: "none", outline: "none", background: "transparent", textAlign: "center", fontFamily: "var(--font-sans)" }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>/ 10</span>
          </div>
          <input
            className="atria-grade-slider"
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={sliderValue}
            aria-label="Nota sobre 10"
            onChange={(e) => setGrade(formatGrade(parseFloat(e.target.value)))}
            style={{ ["--fill" as string]: `${sliderValue * 10}%` }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)", margin: "4px 0 20px" }}>
            <span>0</span>
            <span>10</span>
          </div>
          <Textarea label="Comentario para el alumno" rows={5} placeholder="Buen trabajo, has explicado…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      </div>

      <style jsx global>{`
        .atria-grade-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--brand-primary) var(--fill),
            var(--surface-sunken) var(--fill)
          );
          outline: none;
          cursor: pointer;
        }
        .atria-grade-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--surface-card);
          border: 3px solid var(--brand-primary);
          cursor: grab;
          box-shadow: var(--shadow-sm);
        }
        .atria-grade-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
        }
        .atria-grade-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--surface-card);
          border: 3px solid var(--brand-primary);
          cursor: grab;
        }
        .atria-grade-slider:focus-visible {
          box-shadow: var(--focus-ring);
        }
      `}</style>
    </Modal>
  );
}
