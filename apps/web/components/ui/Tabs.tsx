"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

export interface TabItem {
  label: string;
  value: string;
  icon?: ReactNode;
  /** Optional count shown next to the label (e.g. activities in a module). */
  count?: number;
}
type TabInput = string | TabItem;

interface TabsProps {
  tabs?: TabInput[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
  "aria-label"?: string;
}

function normalize(tabs: TabInput[]): TabItem[] {
  return tabs.map((t) => (typeof t === "string" ? { label: t, value: t } : t));
}

/** Underline navigation. Active tab gets a yellow accent underline. */
export function HorizontalTabs({ tabs = [], value, defaultValue, onChange, style = {}, "aria-label": ariaLabel }: TabsProps) {
  const items = normalize(tabs);
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const select = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--border-subtle)", overflowX: "auto", scrollbarWidth: "thin", ...style }}>
      {items.map((t) => {
        const active = t.value === current;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(t.value)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "0 2px 12px",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--brand-primary)" : "var(--text-muted)",
              whiteSpace: "nowrap",
              transition: "color .15s ease",
            }}
          >
            {t.label}
            {t.count != null ? (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: active ? "var(--primary-100)" : "var(--surface-soft)",
                  color: active ? "var(--primary-600)" : "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {t.count}
              </span>
            ) : null}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -1,
                height: 3,
                borderRadius: 3,
                background: active ? "var(--brand-accent)" : "transparent",
                transition: "background .15s ease",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Stacked navigation with a yellow accent bar on the active item. */
export function VerticalTabs({ tabs = [], value, defaultValue, onChange, style = {} }: TabsProps) {
  const items = normalize(tabs);
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const select = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      {items.map((t) => {
        const active = t.value === current;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => select(t.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textAlign: "left",
              border: "none",
              cursor: "pointer",
              padding: "10px 16px",
              borderLeft: `3px solid ${active ? "var(--brand-accent)" : "var(--border-subtle)"}`,
              background: active ? "var(--surface-soft)" : "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--brand-primary)" : "var(--text-muted)",
              transition: "all .15s ease",
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-soft)"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
          >
            {t.icon ? <span style={{ display: "inline-flex", width: 18, height: 18 }}>{t.icon}</span> : null}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
