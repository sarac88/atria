"use client";

// Menú de los tres puntos de la cabecera del hilo.
//
// Las dos acciones son personales: vaciar deja la conversación en blanco para
// quien la pide y eliminar la saca además de su lista, pero el otro conserva su
// copia entera. Se avisa de ello en la confirmación, porque «eliminar» invita a
// pensar que desaparece para los dos.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useClearConversation, useDeleteConversation } from "@/lib/api/messaging";

type Pending = "clear" | "delete" | null;

function MenuItem({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const color = danger ? "var(--status-error)" : "var(--text-strong)";
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 10px",
        border: "none",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        fontWeight: 600,
        color,
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? "var(--status-error-soft)" : "var(--surface-soft)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon name={icon} size={16} color={danger ? "var(--status-error)" : "var(--text-muted)"} />
      {label}
    </button>
  );
}

export function ConversationMenu({
  conversationId,
  name,
  /** Se avisa al eliminar para que la pantalla suelte el hilo abierto. */
  onDeleted,
}: {
  conversationId: string;
  name: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const clear = useClearConversation();
  const remove = useDeleteConversation();

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const choose = (what: Exclude<Pending, null>) => {
    setOpen(false);
    setPending(what);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Opciones de la conversación con ${name}`}
        title="Opciones de la conversación"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          border: "none",
          borderRadius: "var(--radius-sm)",
          background: open ? "var(--state-hover-tint)" : "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--state-hover-tint)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <Icon name="ellipsis-vertical" size={20} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popRef}
              role="menu"
              style={{
                position: "fixed",
                top: pos.top,
                right: pos.right,
                zIndex: 200,
                minWidth: 228,
                background: "var(--surface-card)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--border-subtle)",
                padding: 6,
                display: "grid",
                gap: 3,
              }}
            >
              <MenuItem icon="x-circle" label="Vaciar conversación" onClick={() => choose("clear")} />
              <MenuItem icon="trash" label="Eliminar chat" danger onClick={() => choose("delete")} />
            </div>,
            document.body,
          )
        : null}

      {pending === "clear" ? (
        <ConfirmDialog
          title="Vaciar conversación"
          message={
            <>
              Se borrarán de tu vista todos los mensajes con <strong>{name}</strong>. El hilo se queda en la lista y
              podréis seguir escribiéndoos, pero {name.split(" ")[0] || name} conservará su copia de lo hablado.
            </>
          }
          confirmLabel="Vaciar"
          busyLabel="Vaciando…"
          onConfirm={async () => {
            await clear.mutateAsync(conversationId);
            setPending(null);
          }}
          onClose={() => setPending(null)}
        />
      ) : null}

      {pending === "delete" ? (
        <ConfirmDialog
          title="Eliminar chat"
          message={
            <>
              La conversación con <strong>{name}</strong> desaparecerá de tu lista de mensajes. Volverá a aparecer, con
              los mensajes nuevos, si {name.split(" ")[0] || name} te vuelve a escribir; su copia no se toca.
            </>
          }
          confirmLabel="Eliminar"
          onConfirm={async () => {
            await remove.mutateAsync(conversationId);
            setPending(null);
            onDeleted?.();
          }}
          onClose={() => setPending(null)}
        />
      ) : null}
    </>
  );
}
