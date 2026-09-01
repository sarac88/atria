"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Icon } from "@/components/ui";
import { Page, PageHead } from "@/components/layout";
import { useConversations, useMessages } from "@/lib/api/messaging";
import { EmojiPicker } from "@/components/messaging/EmojiPicker";
import { MessageRow, useNowTick } from "@/components/messaging/MessageRow";
import { useSocket } from "@/components/messaging/SocketProvider";
import type { ConversationOriginDto } from "@/lib/types";

/**
 * Etiqueta de la clase de la que salió el hilo. Aquí se mezclan conversaciones
 * de todas las clases, así que sin ella no se sabe a qué asignatura contestas.
 */
function OriginTag({ origin, tone }: { origin: ConversationOriginDto | null; tone: "light" | "dark" }) {
  if (!origin) return null;
  const onDark = tone === "dark";
  return (
    <span
      title={`Conversación de ${origin.className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        maxWidth: "100%",
        minWidth: 0,
        height: 18,
        padding: "0 8px",
        borderRadius: "var(--radius-pill)",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        background: onDark ? "rgba(255,255,255,.14)" : "var(--surface-sunken)",
        color: onDark ? "rgba(255,255,255,.85)" : "var(--text-body)",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: origin.color, flexShrink: 0 }} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{origin.className}</span>
    </span>
  );
}

export function Messages({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const { sendMessage, editMessage, deleteMessage, reactToMessage } = useSocket();
  const { data: conversations } = useConversations();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const now = useNowTick();

  useEffect(() => {
    if (!active && conversations && conversations.length) setActive(conversations[0].id);
  }, [conversations, active]);

  const { data: msgs } = useMessages(active ?? undefined);

  // Opening a conversation marks it read on the server; refresh the list to clear its badge.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => void qc.invalidateQueries({ queryKey: ["conversations"] }), 400);
    return () => clearTimeout(t);
  }, [active, qc, msgs]);

  // Keep the thread scrolled to the bottom as messages arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, active]);

  const activeConv = conversations?.find((c) => c.id === active);

  const onSend = () => {
    const body = draft.trim();
    if (active && body) {
      sendMessage(active, body);
      setDraft("");
    }
  };

  const card = (
    <div
      className="atria-msg"
      style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0, background: "var(--surface-card)", borderRadius: embedded ? 0 : "var(--radius-xl)", boxShadow: embedded ? "none" : "var(--ring-hairline), var(--shadow-md)", overflow: "hidden", height: embedded ? "100%" : 560 }}
    >
      <div style={{ borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", minHeight: 0, background: "var(--primary-500)" }}>
        <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", background: "rgba(255,255,255,.1)", borderRadius: "var(--radius-pill)" }}>
            <Icon name="search" size={16} color="rgba(255,255,255,.6)" />
            <input placeholder="Buscar conversación…" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13.5, width: "100%", color: "#fff", fontFamily: "var(--font-sans)" }} />
          </div>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {conversations && conversations.length === 0 ? (
            <p style={{ margin: 0, padding: "18px 16px", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.65)" }}>
              Todavía no tienes conversaciones. Escribe a un alumno desde el chat de su clase y el hilo aparecerá aquí.
            </p>
          ) : null}
          {(conversations ?? []).map((m) => {
            const on = m.id === active;
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                style={{ display: "flex", gap: 12, width: "100%", textAlign: "left", padding: "13px 16px", border: "none", borderBottom: "1px solid rgba(255,255,255,.1)", cursor: "pointer", background: on ? "var(--primary-100)" : "transparent", transition: "background .12s ease" }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ position: "relative" }}>
                  <Avatar name={m.name} size="md" />
                  {m.channel ? <span style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "var(--brand-accent)", color: "var(--primary-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--primary-500)" }}><Icon name="users" size={9} /></span> : null}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: on ? "var(--primary-700)" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                    <span style={{ fontSize: 11.5, color: on ? "var(--primary-600)" : "rgba(255,255,255,.5)", flexShrink: 0 }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: on ? "var(--primary-700)" : m.unread ? "#fff" : "rgba(255,255,255,.6)", fontWeight: m.unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{m.last}</div>
                  {m.origin ? (
                    <div style={{ marginTop: 5, display: "flex" }}>
                      <OriginTag origin={m.origin} tone={on ? "light" : "dark"} />
                    </div>
                  ) : null}
                </div>
                {m.unread ? <span style={{ alignSelf: "center", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: on ? "var(--brand-primary)" : "var(--brand-accent)", color: on ? "#fff" : "var(--primary-700)", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{m.unread}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "var(--surface-page)" }}>
        {activeConv ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
              <Avatar name={activeConv.name} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{activeConv.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{activeConv.role}</span>
                  <OriginTag origin={activeConv.origin} tone="light" />
                </div>
              </div>
              <Icon name="ellipsis-vertical" size={20} color="var(--text-muted)" />
            </div>
            <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              {msgs && msgs.length === 0 ? (
                <p style={{ margin: "auto", fontSize: 13.5, color: "var(--text-muted)" }}>Aún no hay mensajes. Escribe el primero.</p>
              ) : null}
              {(msgs ?? []).map((c) => (
                <MessageRow
                  key={c.id}
                  message={c}
                  now={now}
                  maxWidth="70%"
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReact={reactToMessage}
                  bubbleStyle={{
                    padding: "11px 15px",
                    borderRadius: c.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: c.from === "me" ? "var(--brand-primary)" : "var(--surface-card)",
                    color: c.from === "me" ? "#fff" : "var(--text-body)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: c.from === "me" ? "none" : "var(--ring-hairline)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                />
              ))}
            </div>
            {/* La barra del redactor deja ver el fondo del hilo: lo único blanco es el campo. */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "transparent" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 8px 0 16px", background: "var(--surface-card)", borderRadius: "var(--radius-pill)", boxShadow: "var(--ring-hairline)" }}>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
                  placeholder="Escribe un mensaje…"
                  style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}
                />
                <EmojiPicker inputRef={inputRef} setValue={setDraft} />
              </div>
              <button onClick={onSend} aria-label="Enviar" style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="arrow-right" size={20} /></button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 32, textAlign: "center" }}>
            <Icon name="chat" size={34} color="var(--text-muted)" />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>Ninguna conversación abierta</p>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)", maxWidth: 300, lineHeight: 1.5 }}>
              Elige un hilo de la lista, o empieza uno nuevo desde el chat de una clase.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return card;
  return (
    <Page width={1180}>
      <PageHead title="Mensajes" subtitle="Comunicación con alumnos y claustro" />
      {card}
    </Page>
  );
}
