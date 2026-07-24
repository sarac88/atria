"use client";

import { useRef, useState } from "react";
import { Button, Icon, Badge, Textarea } from "@/components/ui";
import { Modal, Eyebrow, ProgressBar } from "@/components/layout";
import { QuizQuestions } from "@/components/activities/QuizQuestions";
import { useMyGrades, useSubmitWork } from "@/lib/api/classwork";
import { resourceUrl } from "@/lib/api/client";
import { activityTypeMeta } from "@/lib/activity-meta";
import { studentTaskBadge } from "@/lib/student-task";
import type { Activity, Role } from "@/lib/types";

const HTML_RE = /<\/?[a-z][\s\S]*>/i;
const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx";
const ALLOWED_EXT = ["pdf", "doc", "docx"];

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/** Renders rich-text HTML (from the activity editor), or plain text with preserved line breaks for legacy content. */
function RichView({ html, lineHeight }: { html: string; lineHeight: number }) {
  if (!HTML_RE.test(html)) {
    return <p style={{ fontSize: 14, lineHeight, color: "var(--text-body)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{html}</p>;
  }
  return (
    <>
      <div
        className="atria-richview"
        style={{ fontSize: 14, lineHeight, color: "var(--text-body)", marginTop: 8 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style jsx global>{`
        .atria-richview > * {
          margin: 0 0 8px;
        }
        .atria-richview > *:last-child {
          margin-bottom: 0;
        }
        .atria-richview h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-strong);
        }
        .atria-richview ul,
        .atria-richview ol {
          padding-left: 22px;
        }
        .atria-richview ul {
          list-style: disc;
        }
        .atria-richview ol {
          list-style: decimal;
        }
        .atria-richview li {
          margin: 2px 0;
        }
        .atria-richview li > p {
          margin: 0;
        }
        .atria-richview a {
          color: var(--primary-600);
          text-decoration: underline;
        }
        .atria-richview img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-sm);
          margin: 4px 0;
        }
      `}</style>
    </>
  );
}

function configSummary(a: Activity): string | null {
  const c = a.config;
  if (!c) return null;
  if (a.type === "Cuestionario" && c.questions?.length) {
    const parts = [`${c.questions.length} pregunta${c.questions.length === 1 ? "" : "s"}`];
    if (c.quiz?.timeLimitMin) parts.push(`${c.quiz.timeLimitMin} min`);
    if (c.quiz?.attempts) parts.push(`${c.quiz.attempts} intento(s)`);
    return parts.join(" · ");
  }
  if (a.type === "Debate" && c.debate?.openingQuestion) return c.debate.openingQuestion;
  return null;
}

export function ActivityDetailModal({
  activity,
  role,
  classId,
  onClose,
  onGrade,
}: {
  activity: Activity;
  role: Role;
  classId?: string;
  onClose: () => void;
  onGrade?: (activityId: string) => void;
}) {
  const [icon, color] = activityTypeMeta(activity.type);
  const summary = configSummary(activity);
  const isTeacher = role !== "alumno";
  const pct = activity.total ? activity.submitted / activity.total : 0;

  const { data: mySubs } = useMyGrades(!isTeacher && classId ? classId : "");
  const submission = mySubs?.find((s) => s.activityId === activity.id) ?? null;
  const alreadySubmitted = !isTeacher && !!submission;
  const studentBadge = studentTaskBadge(submission);

  const questions = activity.type === "Cuestionario" ? (activity.config?.questions ?? []) : [];
  const isQuiz = questions.length > 0;
  const isDebate = activity.type === "Debate";

  const [showSubmit, setShowSubmit] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const submit = useSubmitWork(classId);

  const pickFile = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("Solo se admiten ficheros PDF, DOC o DOCX.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("El fichero supera el límite de 50 MB.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const revealSubmit = () => {
    setShowSubmit(true);
    requestAnimationFrame(() => submitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const onEntregar = async () => {
    if (!file) return;
    setError(null);
    try {
      if (classId) await submit.mutateAsync({ activityId: activity.id, file, comment });
      onClose();
    } catch {
      setError("No se pudo enviar la entrega. Inténtalo de nuevo.");
    }
  };

  const answered = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;

  const onEntregarQuiz = async () => {
    setError(null);
    try {
      if (classId) await submit.mutateAsync({ activityId: activity.id, answers, comment });
      onClose();
    } catch {
      setError("No se pudieron enviar tus respuestas. Inténtalo de nuevo.");
    }
  };

  const footer = isTeacher ? (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      {onGrade ? <Button variant="accent" iconLeft={<Icon name="clipboard-check" size={16} />} onClick={() => onGrade(activity.id)}>Ver entregas y calificar</Button> : null}
    </>
  ) : alreadySubmitted ? (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      <Button variant="accent" iconLeft={<Icon name="check" size={16} />} disabled>Entregado</Button>
    </>
  ) : isDebate ? (
    <Button variant="outline" onClick={onClose}>Cerrar</Button>
  ) : isQuiz ? (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      <Button variant="accent" iconLeft={<Icon name="check" size={16} />} disabled={answered < questions.length || submit.isPending} onClick={onEntregarQuiz}>
        {submit.isPending ? "Enviando…" : "Entregar respuestas"}
      </Button>
    </>
  ) : showSubmit ? (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      <Button variant="accent" iconLeft={<Icon name="upload" size={16} />} disabled={!file || submit.isPending} onClick={onEntregar}>{submit.isPending ? "Entregando…" : "Entregar tarea"}</Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={onClose}>Cerrar</Button>
      <Button variant="accent" iconLeft={<Icon name="upload" size={16} />} onClick={revealSubmit}>Entregar</Button>
    </>
  );

  return (
    <Modal title="Actividad" onClose={onClose} footer={footer} width={900}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${color} 14%, #fff)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={22} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>{activity.title}</h2>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
            {activity.type}{activity.points ? ` · ${activity.points} pts` : ""}{activity.due ? ` · vence ${activity.due}` : ""}
          </div>
        </div>
        {isTeacher ? (
          <Badge color={activity.status[1]}>{activity.status[0]}</Badge>
        ) : studentBadge ? (
          <Badge color={studentBadge.color}>{studentBadge.label}</Badge>
        ) : null}
      </div>

      {activity.desc ? (
        <div style={{ marginTop: 18 }}>
          <Eyebrow>Instrucciones</Eyebrow>
          <RichView html={activity.desc} lineHeight={1.6} />
        </div>
      ) : null}

      {summary ? (
        <div style={{ marginTop: 18 }}>
          <Eyebrow>{activity.type === "Debate" ? "Pregunta de apertura" : "Detalles"}</Eyebrow>
          <RichView html={summary} lineHeight={1.5} />
        </div>
      ) : null}

      {isDebate ? (
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", fontSize: 13.5, color: "var(--text-body)" }}>
          <Icon name="chat" size={18} color="var(--text-muted)" />
          {isTeacher
            ? "El hilo de este debate está en la pestaña Foro de la clase."
            : "Participa en este debate desde la pestaña Foro de la clase."}
        </div>
      ) : null}

      {isQuiz && (isTeacher || !alreadySubmitted) ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <Eyebrow>Preguntas</Eyebrow>
            {!isTeacher ? (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{answered} de {questions.length} respondidas</span>
            ) : null}
          </div>
          <QuizQuestions
            questions={questions}
            answers={answers}
            onAnswer={isTeacher ? undefined : (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
            showCorrect={isTeacher}
          />
          {!isTeacher ? (
            <>
              {error ? <div style={{ marginTop: 14, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
              <Textarea label="Comentario (opcional)" rows={3} placeholder="Añade una nota para tu profesora…" style={{ marginTop: 18 }} value={comment} onChange={(e) => setComment(e.target.value)} />
            </>
          ) : null}
        </div>
      ) : null}

      {isTeacher ? (
        <div style={{ marginTop: 20, padding: 16, borderRadius: "var(--radius-lg)", background: "var(--yellow-100)", boxShadow: "var(--ring-hairline)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <Eyebrow>Entregas</Eyebrow>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{activity.submitted} de {activity.total} entregadas</span>
          </div>
          <ProgressBar value={pct} />
        </div>
      ) : null}

      {alreadySubmitted && submission ? (
        <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border-default)" }}>
          <Eyebrow>Tu entrega</Eyebrow>
          {submission.fileName ? (
            <a
              href={submission.fileUrl ? resourceUrl(submission.fileUrl) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-border)", textDecoration: "none", color: "inherit", cursor: submission.fileUrl ? "pointer" : "default" }}
            >
              <Icon name="document-text" size={22} color="var(--primary-600)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", wordBreak: "break-word" }}>{submission.fileName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Entregado el {submission.date}{submission.late ? " · tarde" : ""}</div>
              </div>
              {submission.fileUrl ? <Icon name="download" size={18} color="var(--text-muted)" /> : null}
            </a>
          ) : (
            <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 10 }}>Entregado el {submission.date}{submission.late ? " · tarde" : ""}.</div>
          )}
          {isQuiz ? <QuizQuestions questions={questions} answers={submission.answers ?? {}} showCorrect /> : null}
          {submission.comment ? (
            <div style={{ marginTop: 14 }}>
              <Eyebrow>Tu comentario</Eyebrow>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-body)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{submission.comment}</p>
            </div>
          ) : null}
          {submission.feedback ? (
            <div style={{ marginTop: 16, padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", boxShadow: "var(--ring-hairline)" }}>
              <Eyebrow>Comentario del profesor</Eyebrow>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-body)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{submission.feedback}</p>
            </div>
          ) : null}
        </div>
      ) : !isTeacher && showSubmit ? (
        <div ref={submitRef} style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid var(--border-default)" }}>
          <Eyebrow>Tu entrega</Eyebrow>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0] ?? null); }}
            onClick={() => fileInput.current?.click()}
            style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 20px", borderRadius: "var(--radius-lg)", border: `2px dashed ${dragOver ? "var(--brand-primary)" : "var(--border-default)"}`, cursor: "pointer", textAlign: "center", background: "var(--surface-soft)", transition: "border-color .15s ease" }}
          >
            <span style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name={file ? "document-text" : "upload"} size={22} /></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>Arrastra tu archivo o haz clic para subir</span>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>PDF, DOC o DOCX · máx. 50 MB</span>
            <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
          </div>
          {file ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", boxShadow: "var(--ring-border)" }}>
              <Icon name="document-text" size={22} color="var(--primary-600)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", wordBreak: "break-word" }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{humanSize(file.size)}</div>
              </div>
              <button onClick={() => setFile(null)} aria-label="Quitar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}><Icon name="trash" size={18} /></button>
            </div>
          ) : null}
          {error ? <div style={{ marginTop: 14, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
          <Textarea label="Comentario (opcional)" rows={3} placeholder="Añade una nota para tu profesora…" style={{ marginTop: 18 }} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      ) : null}
    </Modal>
  );
}
