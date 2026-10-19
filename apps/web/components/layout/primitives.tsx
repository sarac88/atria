"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/ui";
import { Illustration, type IllustrationProps } from "./Illustration";
import { EmptyArt, isEmptyArt, type EmptyArtName } from "./EmptyArt";

export function Page({ children, width = 1180 }: { children?: ReactNode; width?: number }) {
  return <div style={{ maxWidth: width, margin: "0 auto", width: "100%" }}>{children}</div>;
}

export function PageHead({ title, subtitle, actions }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; icon?: string }) {
  return (
    <div style={{ display: "flex", alignItems: subtitle ? "flex-end" : "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: "calc(22px * var(--d,1))" }}>
      <div>
        <h2 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", margin: 0 }}>{title}</h2>
        {subtitle ? <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "6px 0 0" }}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div> : null}
    </div>
  );
}

/** Full-bleed white form layout: edge-to-edge, optional sticky aside. */
export function FormPage({
  children,
  aside,
  title,
  subtitle,
  onBack,
  backLabel = "Volver",
}: {
  children?: ReactNode;
  aside?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}) {
  const pad = "clamp(16px, 2.5vw, 28px)";
  return (
    <div style={{ background: "var(--light)", margin: `calc(-1 * ${pad})`, minHeight: `calc(100% + 2 * ${pad})`, padding: "clamp(20px, 2.4vw, 30px) clamp(22px, 3.4vw, 52px) clamp(40px, 5vw, 72px)" }}>
      {onBack ? (
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: "var(--text-link)", cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 16, padding: 0 }}>
          <Icon name="chevron-left" size={16} />
          {backLabel}
        </button>
      ) : null}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: "calc(22px * var(--d,1))" }}>
        <div>
          <h2 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", margin: 0 }}>{title}</h2>
          {subtitle ? <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "6px 0 0" }}>{subtitle}</p> : null}
        </div>
      </div>
      <div
        className={aside ? "atria-2col" : undefined}
        style={{
          display: "grid",
          gridTemplateColumns: aside ? "minmax(0, 1fr) 300px" : "1fr",
          gap: "clamp(28px, 3.4vw, 56px)",
          alignItems: "start",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--ring-hairline), var(--shadow-md)",
          padding: "clamp(20px, 2.4vw, 32px) clamp(22px, 2.8vw, 36px) clamp(26px, 3vw, 40px)",
        }}
      >
        <div className="atria-formcard" style={{ minWidth: 0 }}>{children}</div>
        {aside ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 0, paddingLeft: "clamp(20px, 2.4vw, 32px)", borderLeft: "1px solid var(--border-subtle)" }}>{aside}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Labelled form section with hairline divider — replaces cards inside FormPage. */
export function FormSection({ label, hint, children, columns, first }: { label?: ReactNode; hint?: ReactNode; children?: ReactNode; columns?: string; first?: boolean }) {
  return (
    <section style={first ? {} : { paddingTop: 26, marginTop: 26 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, margin: 0, color: "var(--text-strong)" }}>{label}</h3>
        {hint ? <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>{hint}</p> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: columns || "1fr", gap: 18 }}>{children}</div>
    </section>
  );
}

/** Generic white card / panel. Con `scroll` y una altura fija en `style`, el cuerpo hace scroll bajo el título. */
export function Panel({ children, title, action, pad = 20, style = {}, scroll = false }: { children?: ReactNode; title?: ReactNode; action?: ReactNode; pad?: number; style?: CSSProperties; scroll?: boolean }) {
  return (
    <section style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", overflow: "hidden", display: "flex", flexDirection: "column", ...style }}>
      {title ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 20px", padding: "14px 0", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0, height: 55, boxSizing: "border-box" }}>
          <h3 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>{title}</h3>
          {action || null}
        </div>
      ) : null}
      {scroll ? (
        // El padding queda fuera de la zona que hace scroll: un margen blanco fijo que el contenido no pisa.
        <div style={{ padding: pad, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{children}</div>
        </div>
      ) : (
        <div style={{ padding: pad, flex: 1 }}>{children}</div>
      )}
    </section>
  );
}

export function StatTile({ icon, value, label, tint, fg, delta }: { icon: string; value: ReactNode; label: ReactNode; tint: string; fg: string; delta?: string }) {
  return (
    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)", padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: tint, color: fg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={24} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-strong)", lineHeight: 1 }}>{value}</div>
          {delta ? <span style={{ fontSize: 12, fontWeight: 700, color: delta[0] === "-" ? "var(--status-error)" : "var(--status-success)" }}>{delta}</span> : null}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 5 }}>{label}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, color = "var(--brand-primary)", height = 8, showLabel = false }: { value: number; color?: string; height?: number; showLabel?: boolean }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ flex: 1, height, background: "var(--surface-sunken)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999, transition: "width .4s ease" }} />
      </div>
      {showLabel ? <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", width: 38, textAlign: "right" }}>{pct + "%"}</span> : null}
    </div>
  );
}

/**
 * `plain` quita la tarjeta, para usarlo dentro de un panel que ya la tiene;
 * `compact` (implica `plain`) es la versión pequeña para paneles estrechos.
 */
export function EmptyState({ illo = "learning", title, text, action, plain = false, compact = false, artSize }: { illo?: IllustrationProps["name"] | EmptyArtName; title?: ReactNode; text?: ReactNode; action?: ReactNode; plain?: boolean; compact?: boolean; artSize?: number }) {
  const card: CSSProperties = plain || compact ? {} : { background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-md)" };
  return (
    <div style={{ ...card, padding: compact ? "8px 16px 16px" : "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: compact ? 8 : 16 }}>
      {isEmptyArt(illo) ? <EmptyArt name={illo} size={artSize ?? (compact ? 170 : 180)} /> : <Illustration name={illo} size={compact ? 150 : 160} />}
      <div>
        {title ? <h3 style={{ fontSize: compact ? 15 : 19, margin: 0 }}>{title}</h3> : null}
        {text ? <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "8px auto 0", maxWidth: 380 }}>{text}</p> : null}
      </div>
      {action || null}
    </div>
  );
}

export function Modal({ title, children, onClose, footer, width = 520 }: { title?: ReactNode; children?: ReactNode; onClose?: () => void; footer?: ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,18,38,.45)", backdropFilter: "blur(2px)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-2xl)", width: "100%", maxWidth: width, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: 19, margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex" }}>
            <Icon name="x" size={22} />
          </button>
        </div>
        <div style={{ padding: 22, overflow: "auto" }}>{children}</div>
        {footer ? <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: "1px solid var(--border-subtle)" }}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function Chip({ icon, children, color = "var(--text-muted)" }: { icon?: string; children?: ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color }}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children?: ReactNode }) {
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{children}</span>;
}
