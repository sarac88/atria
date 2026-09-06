"use client";

// Chat de la clase para la columna lateral de Módulos.
//
// Siempre son hilos 1:1: el docente elige a qué alumno escribe y el alumno solo
// tiene el hilo con su docente, así que los alumnos no se escriben entre ellos.
// El panel lateral es solo el listado; la conversación se abre en una ventana
// acoplada abajo a la derecha, que se puede plegar y deja seguir trabajando en
// la página, al contrario que un modal. La conversación no existe hasta el
// primer mensaje: al enviar se pide el hilo a la API y después ya viaja por el
// socket.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Icon } from "@/components/ui";
import { EmojiPicker } from "@/components/messaging/EmojiPicker";
import { MessageRow, useNowTick } from "@/components/messaging/MessageRow";
import { useSocket } from "@/components/messaging/SocketProvider";
import { useClassChat, useMessages, useOpenClassThread } from "@/lib/api/messaging";
import type { ClassChatThreadDto } from "@/lib/types";

// Es una sección de la tarjeta única de la columna: el recuadro lo pone
// .atria-modaside-card.
const SECTION: React.CSSProperties = { display: "flex", flexDirection: "column", minWidth: 0 };

const firstName = (name: string) => name.split(" ")[0] || name;

/** Insignia ámbar de no leídos del encabezado y de cada hilo. */
function UnreadDot({ count, tone = "accent" }: { count: number; tone?: "accent" | "solid" }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        minWidth: 22,
        height: 22,
        padding: "0 7px",
        borderRadius: 999,
        background: tone === "accent" ? "var(--brand-accent)" : "var(--brand-primary)",
        color: tone === "accent" ? "var(--primary-700)" : "#fff",
        fontSize: 12,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {count}
    </span>
  );
}

/** Lista de hilos: un interlocutor por fila. */
function ThreadList({
  threads,
  openIds,
  onOpen,
}: {
  threads: ClassChatThreadDto[];
  /** Hilos con ventana abierta, para resaltarlos en la lista. */
  openIds: string[];
  onOpen: (t: ClassChatThreadDto) => void;
}) {
  if (threads.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Todavía no hay alumnos en la clase. Cuando acepten la invitación podrás escribirles desde aquí.
      </p>
    );
  }
  return (
    <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
      {threads.map((t) => {
        const on = openIds.includes(t.userId);
        return (
        <button
          key={t.userId}
          type="button"
          onClick={() => onOpen(t)}
          aria-current={on}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: "none", borderRadius: "var(--radius-md)", background: on ? "var(--state-selected-tint)" : "transparent", cursor: "pointer", padding: "10px 12px", transition: "background .15s ease" }}
          onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--state-hover-tint)"; }}
          onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
        >
          <Avatar name={t.name} size="sm" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
              {t.time ? <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{t.time}</span> : null}
            </span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", fontWeight: t.unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
              {t.last || "Sin mensajes todavía"}
            </span>
          </span>
          <UnreadDot count={t.unread} />
        </button>
        );
      })}
    </div>
  );
}

/**
 * Cuántas ventanas caben a la vez. En pantallas estrechas se queda en una y en
 * las anchas se permiten tres: más allá se comerían la página que hay detrás.
 */
function useMaxDocks(): number {
  // Empieza en 1 porque la barra sólo se pinta ya montada en el cliente.
  const [max, setMax] = useState(1);
  useEffect(() => {
    const read = () => setMax(Math.min(3, Math.max(1, Math.floor((window.innerWidth - 48) / (DOCK_WIDTH + DOCK_GAP)))));
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return max;
}

const DOCK_WIDTH = 348;
const DOCK_GAP = 12;

/**
 * Conversación 1:1 acoplada abajo a la derecha, al estilo de las ventanitas de
 * mensajería: se pliega desde la cabecera y no tapa la página.
 */
function ClassChatDock({
  classId,
  thread,
  collapsed,
  onToggleCollapse,
  onClose,
}: {
  classId: string;
  thread: ClassChatThreadDto;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { sendMessage, editMessage, deleteMessage, reactToMessage } = useSocket();
  const openThread = useOpenClassThread(classId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const now = useNowTick();

  // El hilo puede nacer al enviar el primer mensaje, así que se guarda aquí para
  // no perder la conversación recién creada mientras la ventana sigue abierta.
  const [conversationId, setConversationId] = useState(thread.conversationId ?? undefined);
  const { data: msgs } = useMessages(conversationId);

  // Abrir el hilo lo marca leído en el servidor: refresca para limpiar la insignia.
  useEffect(() => {
    if (!conversationId) return;
    const t = setTimeout(() => void qc.invalidateQueries({ queryKey: ["classChat", classId] }), 400);
    return () => clearTimeout(t);
  }, [conversationId, msgs, qc, classId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, collapsed]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    // La conversación nace aquí si es el primer mensaje del hilo.
    const id = conversationId ?? (await openThread.mutateAsync(thread.userId)).conversationId;
    setConversationId(id);
    sendMessage(id, body);
  };

  const composer = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", height: 40, padding: "0 5px 0 12px", borderRadius: "var(--radius-md)", boxShadow: "inset 0 0 0 1px var(--border-default)", background: "var(--surface-card)" }}>
      <input
        ref={inputRef}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void onSend(); }}
        placeholder={`Escribe a ${firstName(thread.name)}…`}
        aria-label={`Escribe a ${thread.name}`}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}
      />
      <EmojiPicker inputRef={inputRef} setValue={setDraft} />
      <button
        type="button"
        aria-label="Enviar mensaje"
        disabled={!draft.trim()}
        onClick={() => void onSend()}
        style={{ width: 32, height: 32, flexShrink: 0, border: "none", borderRadius: "var(--radius-sm)", background: draft.trim() ? "var(--brand-primary)" : "var(--surface-sunken)", color: draft.trim() ? "#fff" : "var(--text-muted)", cursor: draft.trim() ? "pointer" : "default", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .15s ease" }}
      >
        <Icon name="arrow-right" size={17} />
      </button>
    </div>
  );

  const headerButton = (icon: string, label: string, onClick: () => void) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(ev) => { ev.stopPropagation(); onClick(); }}
      style={{ width: 26, height: 26, border: "none", borderRadius: "var(--radius-sm)", background: "transparent", color: "rgba(255,255,255,.8)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(255,255,255,.14)"; }}
      onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
    >
      <Icon name={icon} size={18} />
    </button>
  );

  return (
    <section
      aria-label={`Chat con ${thread.name}`}
      style={{
        width: `min(${DOCK_WIDTH}px, calc(100vw - 32px))`,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        boxShadow: "var(--shadow-2xl)",
        overflow: "hidden",
      }}
    >
      <header
        onClick={onToggleCollapse}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px 9px 12px", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", flexShrink: 0 }}
      >
        <Avatar name={thread.name} size={28} />
        {/* Sólo el nombre: el papel de cada uno ya se sabe dentro de la clase. */}
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {thread.name}
        </span>
        {collapsed ? <UnreadDot count={thread.unread} /> : null}
        {headerButton(collapsed ? "chevron-up" : "chevron-down", collapsed ? "Desplegar chat" : "Plegar chat", onToggleCollapse)}
        {headerButton("x", "Cerrar chat", onClose)}
      </header>

      {collapsed ? null : (
        <>
          <div
            ref={scrollRef}
            style={{ display: "flex", flexDirection: "column", gap: 12, height: "min(46vh, 360px)", overflowY: "auto", padding: "14px 12px", background: "var(--surface-page)" }}
          >
            {(msgs ?? []).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "auto", textAlign: "center", lineHeight: 1.5 }}>
                Aún no hay mensajes. Escribe el primero.
              </p>
            ) : null}
            {(msgs ?? []).map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                now={now}
                avatar={<Avatar name={thread.name} size={24} />}
                onEdit={editMessage}
                onDelete={deleteMessage}
                onReact={reactToMessage}
                bubbleStyle={{
                  padding: "8px 12px",
                  borderRadius: m.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.from === "me" ? "var(--primary-100)" : "var(--surface-card)",
                  color: "var(--text-body)",
                  fontSize: 13,
                  lineHeight: 1.45,
                  boxShadow: m.from === "me" ? "none" : "var(--ring-hairline)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              />
            ))}
          </div>
          <div style={{ padding: 10, borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>{composer}</div>
        </>
      )}
    </section>
  );
}

/**
 * Fila de ventanas del pie. Se pinta fuera del árbol de la página para que
 * ningún contenedor con overflow o transform se coma las ventanas, y en sentido
 * inverso para que las nuevas se apilen hacia la izquierda sin mover a las que
 * ya estaban abiertas.
 */
function ChatDockBar({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 0,
        zIndex: 70,
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "flex-end",
        gap: DOCK_GAP,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function ClassChatPanel({ classId }: { classId: string }) {
  const { data } = useClassChat(classId);
  // Se pueden llevar varias conversaciones a la vez, en orden de apertura.
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const maxDocks = useMaxDocks();

  // Al estrecharse la ventana sobran ventanas: se cierran las más antiguas.
  useEffect(() => {
    setOpenIds((ids) => (ids.length > maxDocks ? ids.slice(-maxDocks) : ids));
  }, [maxDocks]);

  const threads = data?.threads ?? [];
  const open = openIds.map((id) => threads.find((t) => t.userId === id)).filter((t): t is ClassChatThreadDto => !!t);

  const openWindow = (t: ClassChatThreadDto) => {
    // Si ya estaba abierta se despliega en vez de duplicarla.
    setCollapsedIds((ids) => ids.filter((id) => id !== t.userId));
    setOpenIds((ids) => (ids.includes(t.userId) ? ids : [...ids, t.userId].slice(-maxDocks)));
  };

  const closeWindow = (userId: string) => {
    setOpenIds((ids) => ids.filter((id) => id !== userId));
    setCollapsedIds((ids) => ids.filter((id) => id !== userId));
  };

  const toggleCollapse = (userId: string) => {
    setCollapsedIds((ids) => (ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]));
  };

  return (
    <section style={SECTION}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, marginBottom: 4 }}>
        <Icon name="chat" size={20} color="var(--text-muted)" />
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Chat de la clase
        </h3>
        <UnreadDot count={data?.unread ?? 0} />
      </div>

      <ThreadList threads={threads} openIds={openIds} onOpen={openWindow} />

      {open.length > 0 ? (
        <ChatDockBar>
          {open.map((t) => (
            <ClassChatDock
              key={t.userId}
              classId={classId}
              thread={t}
              collapsed={collapsedIds.includes(t.userId)}
              onToggleCollapse={() => toggleCollapse(t.userId)}
              onClose={() => closeWindow(t.userId)}
            />
          ))}
        </ChatDockBar>
      ) : null}
    </section>
  );
}
