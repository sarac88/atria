"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";

export interface MultiSelectOption {
  label: string;
  value: string;
}
type OptionInput = string | MultiSelectOption;

export interface MultiSelectProps {
  label?: string;
  options?: OptionInput[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

/** Atria MultiSelect. Selected values appear as removable navy-soft chips. */
export function MultiSelect({ label, options = [], value, defaultValue = [], onChange, placeholder = "Select", disabled = false, id, style = {} }: MultiSelectProps) {
  const reactId = useId();
  const msId = id || reactId;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const opts: MultiSelectOption[] = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const set = (next: string[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  const toggle = (v: string) => (current.includes(v) ? set(current.filter((x) => x !== v)) : set([...current, v]));
  const remove = (v: string, e: MouseEvent) => {
    e.stopPropagation();
    set(current.filter((x) => x !== v));
  };
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", position: "relative", ...style }}>
      {label ? (
        <label htmlFor={msId} style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-medium)" as unknown as number, fontSize: 14, color: "var(--text-strong)" }}>
          {label}
        </label>
      ) : null}
      <div
        id={msId}
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          minHeight: 41,
          padding: current.length ? "6px 12px" : "0 16px",
          width: "100%",
          background: disabled ? "var(--gray-100)" : "#fff",
          borderRadius: "var(--radius-sm)",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: `inset 0 0 0 ${open ? "1.5px var(--border-focus)" : "1px var(--border-default)"}`,
        }}
      >
        {current.length === 0 ? (
          <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)" }}>{placeholder}</span>
        ) : (
          current.map((v) => {
            const o = opts.find((x) => x.value === v);
            return (
              <span
                key={v}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 6px 3px 10px",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--primary-100)",
                  color: "var(--primary-700)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {o ? o.label : v}
                <button
                  onClick={(e) => remove(v, e)}
                  aria-label={`Remove ${o ? o.label : v}`}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "inline-flex", color: "var(--primary-500)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            );
          })
        )}
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>
          <path d="M5 7.5L10 12.5L15 7.5" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open ? (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 30, background: "#fff", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-xl)", padding: 6 }}>
          {opts.map((o) => {
            const on = current.includes(o.value);
            return (
              <div
                key={o.value}
                onClick={() => toggle(o.value)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: on ? "var(--brand-primary)" : "#fff",
                    boxShadow: on ? "none" : "inset 0 0 0 1.5px var(--border-strong)",
                  }}
                >
                  {on ? (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}>{o.label}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
