"use client";

// Selector de emojis de los redactores del chat.
//
// Escribe directamente en el input que se le pasa por referencia: inserta en la
// posición del cursor en lugar de añadir al final, y devuelve el foco con el
// cursor detrás del emoji para poder seguir escribiendo. El panel se queda
// abierto tras cada elección, que casi nunca se pone uno solo.

import { useEffect, useRef, useState, type RefObject } from "react";
import { Icon } from "@/components/ui";

const GROUPS: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "caras",
    label: "Caras",
    emojis: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🙂", "😉", "😊", "😍",
      "😘", "😎", "🤓", "🤔", "😴", "😌", "😢", "😭", "😥", "😳",
      "😬", "🙄", "😤", "😱", "🤯", "🥳", "🤗", "😇", "🙃", "😶",
    ],
  },
  {
    id: "gestos",
    label: "Gestos",
    emojis: [
      "👍", "👎", "👏", "🙌", "🙏", "👋", "🤝", "✌️", "🤞", "💪",
      "👌", "🫡", "🤙", "☝️", "✍️", "👀",
    ],
  },
  {
    id: "clase",
    label: "Clase",
    emojis: [
      "📚", "📖", "📝", "✏️", "📐", "📊", "📅", "🗓️", "⏰", "📌",
      "📎", "🎓", "🏫", "🔬", "🧪", "🧮", "💻", "🖥️", "📁", "📤",
    ],
  },
  {
    id: "animo",
    label: "Ánimo",
    emojis: [
      "✅", "❌", "⭐", "🌟", "🔥", "🎉", "🎯", "💡", "❤️", "🧡",
      "💜", "💚", "☀️", "🌱", "🚀", "🏆", "👑", "🍀", "⚡", "✨",
    ],
  },
  {
    id: "avisos",
    label: "Avisos",
    emojis: ["⚠️", "❗", "❓", "🔔", "📣", "🔒", "🕒", "➡️", "🔁", "💬"],
  },
];

export function EmojiPicker({
  inputRef,
  setValue,
  disabled = false,
}: {
  inputRef: RefObject<HTMLInputElement>;
  setValue: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(GROUPS[0].id);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera o con Escape, como el resto de menús flotantes.
  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setValue(emoji);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    setValue(el.value.slice(0, start) + emoji + el.value.slice(end));
    const caret = start + emoji.length;
    // El valor lo pinta React en el siguiente frame: hasta entonces no hay
    // dónde poner el cursor.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const emojis = GROUPS.find((g) => g.id === group)?.emojis ?? [];

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <button
        type="button"
        disabled={disabled}
        aria-label="Insertar emoji"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 30,
          height: 30,
          border: "none",
          borderRadius: "50%",
          background: open ? "var(--state-hover-tint)" : "transparent",
          color: open ? "var(--text-strong)" : "var(--text-muted)",
          cursor: disabled ? "default" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background .15s ease, color .15s ease",
        }}
      >
        <Icon name="face-smile" size={20} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Emojis"
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            // Anclado a la derecha: el botón vive al final del redactor y un
            // panel centrado se saldría de la pantalla.
            right: 0,
            width: 300,
            background: "var(--surface-card)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--ring-hairline), var(--shadow-2xl)",
            padding: 10,
            zIndex: 90,
          }}
        >
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroup(g.id)}
                style={{
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 7px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  background: g.id === group ? "var(--primary-100)" : "transparent",
                  color: g.id === group ? "var(--primary-700)" : "var(--text-muted)",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: 2,
              maxHeight: 168,
              overflowY: "auto",
            }}
          >
            {emojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                type="button"
                onClick={() => pick(emoji)}
                aria-label={`Insertar ${emoji}`}
                style={{
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 19,
                  lineHeight: 1,
                  height: 30,
                  cursor: "pointer",
                }}
                onMouseEnter={(ev) => { ev.currentTarget.style.background = "var(--state-hover-tint)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Mensajes que son sólo emojis: se pintan en grande y sin burbuja, como en cualquier chat. */
const EMOJI_ONLY = /^(?:[\p{Extended_Pictographic}\p{Emoji_Component}\uFE0F\u200D]|\s)+$/u;

export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 12) return false;
  return EMOJI_ONLY.test(trimmed);
}
