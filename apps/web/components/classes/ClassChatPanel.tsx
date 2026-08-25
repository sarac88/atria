"use client";

// Chat de la clase para la columna lateral de Módulos.
//
// Siempre son hilos 1:1: el docente elige a qué alumno escribe y el alumno solo
// tiene el hilo con su docente, así que los alumnos no se escriben entre ellos.
// El panel lateral es solo el listado; la conversación se abre en un modal, que
// da sitio de sobra para leer y escribir. La conversación no existe hasta el
// primer mensaje: al enviar se pide el hilo a la API y después ya viaja por el
// socket.

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Icon } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useSocket } from "@/components/messaging/SocketProvider";
import { useClassChat, useMessages, useOpenClassThread } from "@/lib/api/messaging";
import type { ClassChatThreadDto } from "@/lib/types";

// Vive dentro del bloque blanco de Módulos: el recuadro lo pone .atria-modaside.
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
function ThreadList({ threads, onOpen }: { threads: ClassChatThreadDto[]; onOpen: (t: ClassChatThreadDto) => void }) {
  if (threads.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
        Todavía no hay alumnos en la clase. Cuando acepten la invitación podrás escribirles desde aquí.
      </p>
    );
  }
  return (
    // Los márgenes negativos dejan que el realce del hover llegue al borde del recuadro.
    <div style={{ maxHeight: 380, overflowY: "auto", margin: "0 -14px" }}>
      {threads.map((t) => (
        <button
          key={t.userId}
          type="button"
          onClick={() => onOpen(t)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: "none", borderRadius: "var(--radius-sm)", background: "transparent", cursor: "pointer", padding: "11px 14px", transition: "background .15s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--state-hover-tint)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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
      ))}
    </div>
  );
}

/** Conversación 1:1 en modal: historial arriba y el redactor fijo en el pie. */
function ClassChatModal({ classId, thread, onClose }: { classId: string; thread: ClassChatThreadDto; onClose: () => void }) {
  const qc = useQueryClient();
  const { sendMessage } = useSocket();
  const openThread = useOpenClassThread(classId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // El hilo puede nacer al enviar el primer mensaje, así que se guarda aquí para
  // no perder la conversación recién creada mientras el modal sigue abierto.
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
  }, [msgs]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    // La conversación nace aquí si es el primer mensaje del hilo.
    const id = conversationId ?? (await openThread.mutateAsync(thread.userId)).conversationId;
    setConversationId(id);
    sendMessage(id, body);
  };

  const title = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar name={thread.name} size="sm" />
      <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{thread.name}</span>
    </span>
  );

  const composer = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 44, padding: "0 6px 0 14px", borderRadius: "var(--radius-md)", boxShadow: "inset 0 0 0 1px var(--border-default)", background: "var(--surface-card)" }}>
      <input
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void onSend(); }}
        placeholder={`Escribe a ${firstName(thread.name)}…`}
        aria-label={`Escribe a ${thread.name}`}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}
      />
      <button
        type="button"
        aria-label="Enviar mensaje"
        disabled={!draft.trim()}
        onClick={() => void onSend()}
        style={{ width: 34, height: 34, flexShrink: 0, border: "none", borderRadius: "var(--radius-sm)", background: draft.trim() ? "var(--brand-primary)" : "var(--surface-sunken)", color: draft.trim() ? "#fff" : "var(--text-muted)", cursor: draft.trim() ? "pointer" : "default", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .15s ease" }}
      >
        <Icon name="arrow-right" size={18} />
      </button>
    </div>
  );

  return (
    <Modal title={title} onClose={onClose} footer={composer} width={560}>
      <div
        ref={scrollRef}
        style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 220, maxHeight: "min(52vh, 440px)", overflowY: "auto" }}
      >
        {(msgs ?? []).length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            Aún no hay mensajes. Escribe el primero.
          </p>
        ) : null}
        {(msgs ?? []).map((m) => {
          const mine = m.from === "me";
          return (
            <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: mine ? "row-reverse" : "row" }}>
              {mine ? null : <Avatar name={thread.name} size={26} />}
              <div style={{ maxWidth: "78%" }}>
                <div
                  style={{
                    padding: "9px 13px",
                    borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: mine ? "var(--primary-100)" : "var(--surface-soft)",
                    color: "var(--text-body)",
                    fontSize: 13.5,
                    lineHeight: 1.45,
                  }}
                >
                  {m.text}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, textAlign: mine ? "right" : "left" }}>{m.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export function ClassChatPanel({ classId }: { classId: string }) {
  const { data } = useClassChat(classId);
  const [peerId, setPeerId] = useState<string | null>(null);

  const threads = data?.threads ?? [];
  const active = threads.find((t) => t.userId === peerId);

  return (
    <section style={SECTION}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, marginBottom: 4 }}>
        <Icon name="chat" size={20} color="var(--text-muted)" />
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Chat de la clase
        </h3>
        <UnreadDot count={data?.unread ?? 0} />
      </div>

      <ThreadList threads={threads} onOpen={(t) => setPeerId(t.userId)} />

      {active ? <ClassChatModal classId={classId} thread={active} onClose={() => setPeerId(null)} /> : null}
    </section>
  );
}
