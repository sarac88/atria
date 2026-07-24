"use client";

import { Icon, Input } from "@/components/ui";
import type { QuizQuestion } from "@/lib/types";

const TF_LABELS = ["Verdadero", "Falso"];

/** Option row shared by multiple-choice and true/false questions. */
function Option({
  label,
  selected,
  correct,
  wrong,
  readOnly,
  onSelect,
}: {
  label: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  readOnly: boolean;
  onSelect: () => void;
}) {
  const ring = correct
    ? "inset 0 0 0 2px var(--success-500)"
    : wrong
      ? "inset 0 0 0 2px var(--status-error)"
      : selected
        ? "inset 0 0 0 2px var(--brand-primary)"
        : "inset 0 0 0 1px var(--border-default)";
  const tint = correct
    ? "color-mix(in srgb, var(--success-500) 12%, transparent)"
    : wrong
      ? "color-mix(in srgb, var(--status-error) 10%, transparent)"
      : "transparent";

  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onSelect}
      disabled={readOnly}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        border: "none",
        background: tint,
        boxShadow: ring,
        cursor: readOnly ? "default" : "pointer",
        fontSize: 14,
        color: "var(--text-body)",
        transition: "box-shadow .15s ease, background .15s ease",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          borderRadius: "50%",
          boxShadow: selected ? "inset 0 0 0 6px var(--brand-primary)" : "inset 0 0 0 2px var(--border-strong)",
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {correct ? <Icon name="check" size={16} color="var(--success-600)" /> : null}
    </button>
  );
}

/**
 * Quiz questions, in two modes: answerable (student before submitting) and
 * read-only. `showCorrect` marks the right option — never pass it while a
 * student is still answering.
 */
export function QuizQuestions({
  questions,
  answers,
  onAnswer,
  showCorrect = false,
}: {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  onAnswer?: (questionId: string, value: string) => void;
  showCorrect?: boolean;
}) {
  const readOnly = !onAnswer;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
      {questions.map((q, i) => {
        const given = answers[q.id] ?? "";
        const options = q.kind === "truefalse" ? TF_LABELS : (q.options ?? []).map((o) => o.text);

        return (
          <div key={q.id} style={{ padding: 16, borderRadius: "var(--radius-lg)", background: "var(--surface-card)", boxShadow: "var(--ring-hairline)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}.</span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: "var(--text-strong)" }}>{q.text || "Pregunta sin enunciado"}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{q.points} pt{q.points === 1 ? "" : "s"}</span>
            </div>

            {q.kind === "short" ? (
              readOnly ? (
                <div style={{ fontSize: 14, color: given ? "var(--text-body)" : "var(--text-muted)", whiteSpace: "pre-wrap" }}>
                  {given || "Sin responder"}
                </div>
              ) : (
                <Input placeholder="Escribe tu respuesta…" value={given} onChange={(e) => onAnswer(q.id, e.target.value)} />
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {options.map((label, oi) => {
                  const selected = given === String(oi);
                  const isCorrect = showCorrect && q.correct === oi;
                  return (
                    <Option
                      key={oi}
                      label={label || `Opción ${oi + 1}`}
                      selected={selected}
                      correct={isCorrect}
                      wrong={showCorrect && selected && q.correct !== oi}
                      readOnly={readOnly}
                      onSelect={() => onAnswer?.(q.id, String(oi))}
                    />
                  );
                })}
              </div>
            )}

            {showCorrect && q.kind === "short" && q.answer ? (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--success-600)" }}>Respuesta esperada: {q.answer}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
