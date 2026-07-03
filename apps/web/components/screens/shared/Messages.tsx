"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Icon } from "@/components/ui";
import { Page, PageHead } from "@/components/layout";
import { useConversations, useMessages } from "@/lib/api/messaging";
import { useSocket } from "@/components/messaging/SocketProvider";

export function Messages({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const { sendMessage } = useSocket();
  const { data: conversations } = useConversations();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
                </div>
                {m.unread ? <span style={{ alignSelf: "center", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: on ? "var(--brand-primary)" : "var(--brand-accent)", color: on ? "#fff" : "var(--primary-700)", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{m.unread}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <Avatar name={activeConv?.name ?? ""} size="sm" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{activeConv?.name ?? ""}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{activeConv?.role ?? ""}</div>
          </div>
          <Icon name="ellipsis-vertical" size={20} color="var(--text-muted)" />
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-page)" }}>
          {(msgs ?? []).map((c) => (
            <div key={c.id} style={{ alignSelf: c.from === "me" ? "flex-end" : "flex-start", maxWidth: "70%" }}>
              <div style={{ padding: "11px 15px", borderRadius: c.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: c.from === "me" ? "var(--brand-primary)" : "var(--surface-card)", color: c.from === "me" ? "#fff" : "var(--text-body)", fontSize: 14, lineHeight: 1.5, boxShadow: c.from === "me" ? "none" : "var(--ring-hairline)" }}>{c.text}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: c.from === "me" ? "right" : "left" }}>{c.time}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", background: "var(--surface-page)", borderRadius: "var(--radius-pill)" }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
              placeholder="Escribe un mensaje…"
              style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}
            />
          </div>
          <button onClick={onSend} aria-label="Enviar" style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="arrow-right" size={20} /></button>
        </div>
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
