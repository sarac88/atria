"use client";

// Full-page class workspace navbar (no sidebar). Header color follows the
// class thumbnail, or the chosen color + icon pair.

import type { CSSProperties, ReactNode } from "react";
import { Icon, Badge } from "@/components/ui";
import { ClassThumb } from "@/components/classes/ClassThumb";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { AccountMenu } from "./AccountMenu";
import { classHeaderTheme, classThumbPreset } from "@/lib/class-thumbs";
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
  const c = klass || {};
  const crumb = backLabel || (role === "alumno" ? "Mis cursos" : "Mis clases");
  const preset = classThumbPreset(c.thumb);
  const theme = classHeaderTheme(c.thumb, c.color);

  const headerStyle: CSSProperties = {
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: theme.ink,
    color: "#fff",
    padding: "0 clamp(16px, 3vw, 32px)",
    ["--header-fg" as string]: "#fff",
    ["--header-muted" as string]: "rgba(255,255,255,0.68)",
    ["--header-btn-bg" as string]: "rgba(255,255,255,0.12)",
    ["--header-btn-bg-hover" as string]: "rgba(255,255,255,0.22)",
    ["--header-btn-danger-hover" as string]: "rgba(239,68,68,0.35)",
    ["--header-danger-fg" as string]: "#fecaca",
    ["--header-tab" as string]: theme.tint,
  };

  const backBtnBg = "rgba(255,255,255,0.10)";
  const backBtnHover = "rgba(255,255,255,0.18)";

  const contentLayer: CSSProperties = { position: "relative", zIndex: 1 };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface-page)", fontFamily: "var(--font-sans)" }}>
      <header style={headerStyle}>
        {preset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preset.headerSrc}
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", top: 16, right: "calc(clamp(16px, 3vw, 32px) + 220px)", height: "calc(100% - 32px)", width: "auto", maxWidth: "36%", objectFit: "contain", objectPosition: "right center", pointerEvents: "none", userSelect: "none" }}
          />
        ) : null}
        <div style={{ ...contentLayer, display: "flex", alignItems: "center", gap: 14, height: 60 }}>
          <button
            onClick={onBack}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: backBtnBg, color: "var(--header-fg)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, padding: "8px 14px 8px 11px", borderRadius: "var(--radius-pill)", transition: "background .15s ease" }}
            onMouseEnter={(ev) => { ev.currentTarget.style.background = backBtnHover; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.background = backBtnBg; }}
          >
            <Icon name="chevron-left" size={18} />
            {crumb}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/markLight.svg" alt="Atria" style={{ width: 30, height: 30, marginLeft: 4 }} />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationsBell tone="onDark" />
            <AccountMenu tone="onDark" onProfile={onProfile} onLogout={onLogout} />
          </div>
        </div>

        <div style={{ ...contentLayer, display: "flex", alignItems: "center", gap: 18, padding: "4px 0 18px", flexWrap: "wrap" }}>
          {showIcon ? (
            <span style={{ width: 52, height: 52, borderRadius: "var(--radius-lg)", overflow: "hidden", display: "inline-flex", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }}>
              <ClassThumb thumb={c.thumb} color={c.color} icon={c.icon} name={c.name} iconSize={28} />
            </span>
          ) : null}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ color: "var(--header-fg)", fontSize: 24, margin: 0 }}>{c.name || "Clase"}</h2>
              {badge ? <Badge color={badge[1]}>{badge[0]}</Badge> : null}
              {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
            </div>
            {meta ? <p style={{ color: "var(--header-muted)", fontSize: 13.5, margin: "5px 0 0" }}>{meta}</p> : null}
          </div>
          {rightExtra || null}
        </div>

        {tabs.length ? (
          <div style={{ ...contentLayer, display: "flex", gap: 26, overflowX: "auto" }}>
            {tabs.map((tb) => {
              const on = tb.value === tab;
              return (
                <button
                  key={tb.value}
                  onClick={() => onTab?.(tb.value)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 2px 12px", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: on ? 700 : 600, whiteSpace: "nowrap", color: on ? "var(--header-fg)" : "var(--header-muted)", borderBottom: "3px solid " + (on ? "var(--header-tab)" : "transparent"), transition: "color .15s ease, border-color .15s ease" }}
                  onMouseEnter={(ev) => { if (!on) ev.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                  onMouseLeave={(ev) => { if (!on) ev.currentTarget.style.color = "var(--header-muted)"; }}
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
