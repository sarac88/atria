"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useDeleteNotification, useMarkAllRead, useMarkRead, useNotifications } from "@/lib/api/notifications";
import type { NotificationDto, NotificationType } from "@/lib/types";

const TYPE_META: Record<NotificationType, { icon: string; tint: string; fg: string }> = {
  submission: { icon: "document-add", tint: "var(--info-100)", fg: "var(--info-600)" },
  grade: { icon: "star", tint: "var(--success-100)", fg: "var(--success-600)" },
  deadline: { icon: "clock", tint: "var(--warning-200)", fg: "var(--warning-600)" },
  system: { icon: "bell", tint: "var(--primary-100)", fg: "var(--primary-600)" },
};

export function NotificationsBell({ tone = "light" }: { tone?: "light" | "onDark" }) {
  const router = useRouter();
  const { data } = useNotifications();
  const markAll = useMarkAllRead();
  const markRead = useMarkRead();
  const removeNotif = useDeleteNotification();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const onDark = tone === "onDark";
  const dim = onDark ? 38 : 40;
  const btnBg = onDark ? "rgba(255,255,255,0.10)" : "var(--surface-page)";
  const iconColor = onDark ? "#fff" : "var(--text-strong)";
  const badgeBorder = onDark ? "var(--primary-500)" : "var(--surface-card)";

  // Position the fixed popover under the bell (portal → always on top, never clipped).
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 10, right: Math.max(8, window.innerWidth - r.right) });
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
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const onItem = (n: NotificationDto) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <>
      <button
        ref={btnRef}
        aria-label="Notificaciones"
        onClick={() => setOpen((v) => !v)}
        style={{ position: "relative", border: "none", background: btnBg, width: dim, height: dim, borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: iconColor }}
      >
        <Icon name="bell" size={onDark ? 19 : 20} color={iconColor} />
        {unread > 0 ? (
          <span style={{ position: "absolute", top: -2, right: -2, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 999, background: "var(--status-error)", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `2px solid ${badgeBorder}` }}>
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popRef}
              style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 200, width: 360, maxWidth: "92vw", background: "var(--surface-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-2xl)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>Notificaciones</span>
                {unread > 0 ? (
                  <button onClick={() => markAll.mutate()} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--text-link)" }}>
                    Marcar todas como leídas
                  </button>
                ) : null}
              </div>
              <div style={{ maxHeight: "min(60vh, 420px)", overflow: "auto" }}>
                {items.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13.5, color: "var(--text-muted)" }}>No tienes notificaciones.</div>
                ) : (
                  items.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.system;
                    return (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onItem(n)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onItem(n);
                          }
                        }}
                        style={{ display: "flex", gap: 12, width: "100%", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", background: n.read ? "transparent" : "var(--state-hover-tint)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--state-hover-row)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "var(--state-hover-tint)")}
                      >
                        <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "var(--radius-sm)", background: meta.tint, color: meta.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={meta.icon} size={18} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{n.title}</span>
                            <span style={{ fontSize: 11.5, color: "var(--text-muted)", flexShrink: 0 }}>{n.time}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: "var(--text-body)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {!n.read ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand-accent)" }} /> : null}
                          <button
                            type="button"
                            aria-label="Eliminar notificación"
                            title="Eliminar"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotif.mutate(n.id);
                            }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", padding: 4, borderRadius: "var(--radius-sm)", lineHeight: 0 }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--status-error)";
                              e.currentTarget.style.background = "var(--status-error-soft)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Icon name="x" size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
