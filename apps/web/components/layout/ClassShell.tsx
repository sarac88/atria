"use client";

// Full-page class workspace navbar (no sidebar). Navy header with decorative
// orbs, identity row, and a tab strip. Adapted from the design export.

import type { ReactNode } from "react";
import { Icon, Avatar, Badge } from "@/components/ui";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { useSettings } from "@/components/settings/SettingsContext";
import { resourceUrl } from "@/lib/api/client";
import { displayName } from "@/lib/session";
import type { BadgeColor, ClassInfo, Role } from "@/lib/types";

interface ClassTab {
  label: string;
  value: string;
}

export interface ClassShellProps {
  klass?: Partial<ClassInfo>;
  role?: Role;
  onBack?: () => void;
  backLabel?: string;
  onProfile?: () => void;
  onLogout?: () => void;
  tab?: string;
  onTab?: (value: string) => void;
  tabs?: ClassTab[];
  meta?: ReactNode;
  /** El distintivo de la clase; el docente lo lleva en la columna lateral. */
  showIcon?: boolean;
  badge?: [string, BadgeColor];
  actions?: ReactNode;
  rightExtra?: ReactNode;
  children?: ReactNode;
}

type Orb = [number, number, number, string, number];
const W = "#ffffff";
const B2 = "var(--primary-200)";
const B4 = "var(--primary-400)";
const HEADER_DECOS: Orb[][] = [
  [[120, 30, 150, W, 0.045], [470, 150, 90, B4, 0.18], [760, 40, 130, B2, 0.10], [960, 150, 120, W, 0.05]],
  [[80, 150, 140, B2, 0.10], [360, 20, 120, W, 0.05], [640, 150, 150, B4, 0.16], [920, 30, 110, W, 0.045]],
  [[160, 160, 130, W, 0.05], [440, 10, 140, B4, 0.16], [720, 160, 100, B2, 0.11], [980, 40, 150, W, 0.045]],
  [[100, 40, 130, B4, 0.16], [400, 160, 150, W, 0.05], [700, 30, 110, B2, 0.10], [950, 160, 140, W, 0.05]],
];

export function ClassShell({
  klass,
  role = "docente",
  onBack,
  backLabel,
  onProfile,
  onLogout,
  tab,
  onTab,
  tabs = [],
  meta,
  showIcon = true,
  badge,
  actions,
  rightExtra,
  children,
}: ClassShellProps) {
  const { user } = useSettings();
  const meName = displayName(user);
  const meAvatar = user?.avatarUrl ? resourceUrl(user.avatarUrl) : undefined;
  const c = klass || {};
  const crumb = backLabel || (role === "alumno" ? "Mis cursos" : "Mis clases");
  const decoKey = (c.id || c.name || "").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const deco = HEADER_DECOS[decoKey % HEADER_DECOS.length];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface-page)", fontFamily: "var(--font-sans)" }}>
      <header style={{ position: "relative", overflow: "hidden", flexShrink: 0, background: "var(--primary-500)", color: "#fff", padding: "0 clamp(16px, 3vw, 32px)" }}>
        <svg viewBox="0 0 1000 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {deco.map((s, i) => (
            <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill={s[3]} opacity={s[4]} />
          ))}
        </svg>

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 14, height: 60 }}>
          <button
            onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "rgba(255,255,255,0.10)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, padding: "8px 14px 8px 11px", borderRadius: "var(--radius-pill)", transition: "background .15s ease" }}
            onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          >
            <Icon name="chevron-left" size={18} />
            {crumb}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/markLight.svg" alt="Atria" style={{ width: 30, height: 30, marginLeft: 4 }} />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationsBell tone="onDark" />
            <button onClick={onProfile} aria-label="Perfil" style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "inline-flex", borderRadius: "50%" }}>
              <Avatar name={meName} src={meAvatar} />
            </button>
            {onLogout ? (
              <button onClick={onLogout} aria-label="Salir" style={{ border: "none", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "inline-flex" }}>
                <Icon name="logout" size={18} />
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 18, padding: "4px 0 18px", flexWrap: "wrap" }}>
          {showIcon ? (
            <span style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", overflow: "hidden", display: "inline-flex", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}>
              <ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={28} />
            </span>
          ) : null}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ color: "#fff", fontSize: 24, margin: 0 }}>{c.name || "Clase"}</h2>
              {badge ? <Badge color={badge[1]}>{badge[0]}</Badge> : null}
              {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
            </div>
            {meta ? <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13.5, margin: "5px 0 0" }}>{meta}</p> : null}
          </div>
          {rightExtra || null}
        </div>

        {tabs.length ? (
          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 26, overflowX: "auto" }}>
            {tabs.map((tb) => {
              const on = tb.value === tab;
              return (
                <button
                  key={tb.value}
                  onClick={() => onTab?.(tb.value)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 2px 12px", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: on ? 700 : 600, whiteSpace: "nowrap", color: on ? "#fff" : "rgba(255,255,255,0.6)", borderBottom: "3px solid " + (on ? "var(--brand-accent)" : "transparent"), transition: "color .15s ease, border-color .15s ease" }}
                  onMouseEnter={(ev) => { if (!on) ev.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={(ev) => { if (!on) ev.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  {tb.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>
      <main style={{ flex: 1, overflow: "auto", padding: "clamp(16px, 2.5vw, 28px)" }}>{children}</main>
    </div>
  );
}
