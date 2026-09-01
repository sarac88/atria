"use client";

// Una burbuja del chat con sus acciones.
//
// Compartida por la pantalla de Mensajes y por el chat de la clase: cada una
// pasa el aspecto de su burbuja y aquí vive el comportamiento común. Editar y
// borrar son sólo para lo propio y mientras dure el plazo de rectificación
// (pasado el plazo las acciones desaparecen solas, de ahí useNowTick);
// reaccionar vale para cualquier mensaje y no caduca.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  MESSAGE_EDIT_WINDOW_MIN,
  QUICK_REACTIONS,
  withinEditWindow,
  type MessageActionAck,
  type MessageDto,
  type MessageReactionDto,
} from "@atria/types";
import { Icon } from "@/components/ui";
import { isEmojiOnly } from "./EmojiPicker";

/** Reloj compartido por la lista: un único intervalo para todas las burbujas. */
export function useNowTick(everyMs = 20_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

const META: CSSProperties = { fontSize: 11, color: "var(--text-muted)" };

/** Botón de texto plano de la confirmación de borrado. */
const textButton = (danger = false): CSSProperties => ({
  border: "none",
  background: "transparent",
  padding: 2,
  cursor: "pointer",
  display: "inline-flex",
  fontSize: 11.5,
  fontWeight: 700,
  fontFamily: "var(--font-sans)",
  color: danger ? "var(--status-error)" : "var(--text-muted)",
});

/**
 * Pastilla redonda blanca. Los iconos sueltos se perdían sobre el fondo del
 * hilo, así que van sobre un círculo con filete y sombra para que se vean.
 */
const CHIP: CSSProperties = {
  width: 26,
  height: 26,
  padding: 0,
  border: "none",
  borderRadius: "50%",
  background: "var(--surface-card)",
  boxShadow: "inset 0 0 0 1px var(--border-subtle), var(--shadow-sm)",
  color: "var(--text-body)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background .15s ease, color .15s ease",
};

/** El de borrar se tiñe de rojo al pasar por encima; el de editar, de gris. */
function chipHover(el: HTMLElement, on: boolean, danger = false) {
  el.style.background = on ? (danger ? "var(--status-error-soft)" : "var(--surface-sunken)") : "var(--surface-card)";
  el.style.color = on && danger ? "var(--status-error)" : "var(--text-body)";
}

/**
 * Atajo de reacción. Va en la propia fila de acciones, no en un globo flotante:
 * la fila cuelga bajo la burbuja, así que un globo hacia arriba taparía el
 * mensaje que estás valorando y hacia abajo lo recortaría el hilo.
 */
function QuickReactionBar({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        padding: "2px 4px",
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-card)",
        boxShadow: "inset 0 0 0 1px var(--border-subtle), var(--shadow-sm)",
      }}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={`Reaccionar con ${emoji}`}
          onClick={() => onPick(emoji)}
          style={{ border: "none", background: "transparent", borderRadius: "50%", width: 24, height: 24, fontSize: 15, lineHeight: 1, cursor: "pointer", padding: 0 }}
          onMouseEnter={(ev) => { ev.currentTarget.style.background = "var(--state-hover-tint)"; }}
          onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        aria-label="Cerrar reacciones"
        onClick={onClose}
        style={{ border: "none", background: "transparent", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}
      >
        <Icon name="x" size={13} />
      </button>
    </span>
  );
}

/** Recuento por emoji bajo la burbuja; se pulsa para sumarse o retirarse. */
function ReactionPills({
  reactions,
  mine,
  onToggle,
}: {
  reactions: MessageReactionDto[];
  mine: boolean;
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5, flexDirection: mine ? "row-reverse" : "row" }}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          title={`${r.names.join(", ")} reaccionó con ${r.emoji}`}
          aria-label={`${r.emoji} ${r.count}. ${r.mine ? "Retirar tu reacción" : "Sumarte a la reacción"}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            height: 22,
            padding: "0 8px",
            borderRadius: "var(--radius-pill)",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "var(--font-sans)",
            lineHeight: 1,
            background: r.mine ? "var(--primary-100)" : "var(--surface-card)",
            color: r.mine ? "var(--primary-700)" : "var(--text-muted)",
            fontWeight: r.mine ? 700 : 400,
            boxShadow: r.mine ? "inset 0 0 0 1px var(--primary-300)" : "inset 0 0 0 1px var(--border-subtle)",
          }}
        >
          <span style={{ fontSize: 13 }}>{r.emoji}</span>
          {r.count}
        </button>
      ))}
    </div>
  );
}

export function MessageRow({
  message,
  now,
  bubbleStyle,
  avatar,
  maxWidth = "78%",
  onEdit,
  onDelete,
  onReact,
}: {
  message: MessageDto;
  now: number;
  bubbleStyle: CSSProperties;
  /** Sólo se pinta en los mensajes del interlocutor. */
  avatar?: ReactNode;
  maxWidth?: string;
  onEdit: (messageId: string, body: string) => Promise<MessageActionAck>;
  onDelete: (messageId: string) => Promise<MessageActionAck>;
  onReact: (messageId: string, emoji: string) => Promise<MessageActionAck>;
}) {
  const mine = message.from === "me";
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [draft, setDraft] = useState(message.text);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const [reacting, setReacting] = useState(false);

  const editable = mine && withinEditWindow(message.createdAt, now);
  const showActions = mode === "view" && active;

  // Si el mensaje cambia por debajo (lo editaste en otra pestaña) el borrador
  // se queda desfasado.
  useEffect(() => {
    if (mode === "view") setDraft(message.text);
  }, [message.text, mode]);

  const save = async () => {
    const body = draft.trim();
    if (!body || body === message.text) {
      setMode("view");
      setDraft(message.text);
      return;
    }
    setBusy(true);
    const ack = await onEdit(message.id, body);
    setBusy(false);
    if (ack.ok) {
      setMode("view");
      setError("");
    } else {
      setError(ack.error ?? "No se ha podido editar.");
    }
  };

  const remove = async () => {
    setBusy(true);
    const ack = await onDelete(message.id);
    setBusy(false);
    if (!ack.ok) {
      setMode("view");
      setError(ack.error ?? "No se ha podido eliminar.");
    }
  };

  const react = async (emoji: string) => {
    setReacting(false);
    const ack = await onReact(message.id, emoji);
    if (!ack.ok) setError(ack.error ?? "No se ha podido reaccionar.");
  };

  const big = isEmojiOnly(message.text);

  return (
    <div
      // El avatar se ancla arriba: abajo bailaría según crezcan las reacciones.
      style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: mine ? "row-reverse" : "row" }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); setReacting(false); }}
      onFocus={() => setActive(true)}
      onBlur={(ev) => { if (!ev.currentTarget.contains(ev.relatedTarget as Node)) { setActive(false); setReacting(false); } }}
    >
      {mine ? null : avatar}
      <div style={{ maxWidth, minWidth: 0 }}>
        {mode === "edit" ? (
          <div style={{ ...bubbleStyle, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={draft}
              autoFocus
              rows={Math.min(6, Math.max(2, Math.ceil(draft.length / 42)))}
              onChange={(ev) => setDraft(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" && !ev.shiftKey) {
                  ev.preventDefault();
                  void save();
                }
                if (ev.key === "Escape") {
                  setMode("view");
                  setDraft(message.text);
                }
              }}
              aria-label="Editar mensaje"
              style={{
                border: "none",
                background: "var(--surface-card)",
                borderRadius: "var(--radius-sm)",
                outline: "none",
                resize: "none",
                padding: "7px 9px",
                fontSize: 13.5,
                lineHeight: 1.45,
                color: "var(--text-strong)",
                fontFamily: "var(--font-sans)",
                boxShadow: "inset 0 0 0 1px var(--border-default)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setMode("view"); setDraft(message.text); setError(""); }}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => void save()}
                style={{
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 12px",
                  cursor: busy || !draft.trim() ? "default" : "pointer",
                  fontSize: 12.5,
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  background: draft.trim() ? "var(--brand-primary)" : "var(--surface-sunken)",
                  color: draft.trim() ? "#fff" : "var(--text-muted)",
                }}
              >
                {busy ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={
              big
                ? { ...bubbleStyle, background: "transparent", boxShadow: "none", padding: 0, fontSize: 34, lineHeight: 1.2 }
                : bubbleStyle
            }
          >
            {message.text}
          </div>
        )}

        <ReactionPills reactions={message.reactions} mine={mine} onToggle={(emoji) => void react(emoji)} />

        {/* Alto fijo: las pastillas no deben empujar el hilo al aparecer. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexDirection: mine ? "row-reverse" : "row", minHeight: 26 }}>
          <span style={META}>{message.time}</span>
          {message.edited ? <span style={{ ...META, fontStyle: "italic" }}>editado</span> : null}

          {mode === "confirm" ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...META, color: "var(--text-body)" }}>¿Eliminar?</span>
              <button type="button" disabled={busy} onClick={() => void remove()} style={textButton(true)}>
                Sí
              </button>
              <button type="button" onClick={() => setMode("view")} style={textButton()}>
                No
              </button>
            </span>
          ) : null}

          {showActions && reacting ? (
            <QuickReactionBar onPick={(emoji) => void react(emoji)} onClose={() => setReacting(false)} />
          ) : null}

          {showActions && !reacting ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => setReacting(true)}
                aria-label="Reaccionar al mensaje"
                title="Reaccionar"
                style={CHIP}
                onMouseEnter={(ev) => chipHover(ev.currentTarget, true)}
                onMouseLeave={(ev) => chipHover(ev.currentTarget, false)}
              >
                <Icon name="face-smile" size={15} strokeWidth={1.7} />
              </button>
              {editable ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    aria-label="Editar mensaje"
                    title={`Puedes editarlo durante ${MESSAGE_EDIT_WINDOW_MIN} minutos`}
                    style={CHIP}
                    onMouseEnter={(ev) => chipHover(ev.currentTarget, true)}
                    onMouseLeave={(ev) => chipHover(ev.currentTarget, false)}
                  >
                    <Icon name="pencil" size={15} strokeWidth={1.7} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("confirm"); setError(""); }}
                    aria-label="Eliminar mensaje"
                    title="Eliminar mensaje"
                    style={CHIP}
                    onMouseEnter={(ev) => chipHover(ev.currentTarget, true, true)}
                    onMouseLeave={(ev) => chipHover(ev.currentTarget, false, true)}
                  >
                    <Icon name="trash" size={15} strokeWidth={1.7} />
                  </button>
                </>
              ) : null}
            </span>
          ) : null}
        </div>

        {error ? (
          <div style={{ ...META, color: "var(--status-error)", marginTop: 2, textAlign: mine ? "right" : "left" }}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
