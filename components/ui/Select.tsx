"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export interface SelectOption {
  label: string;
  value: string;
}
type OptionInput = string | SelectOption;

export interface SelectProps {
  label?: string;
  options?: OptionInput[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>
      <path d="M5 7.5L10 12.5L15 7.5" stroke="var(--text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Atria Select / Dropdown. Box matches Input; opens a shadowed menu. */
export function Select({ label, options = [], value, defaultValue, placeholder = "Select an option", onChange, error, disabled = false, id, style = {} }: SelectProps) {
  const reactId = useId();
  const selId = id || reactId;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const opts: SelectOption[] = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const selected = opts.find((o) => o.value === current);
  const pick = (o: SelectOption) => {
    if (!isControlled) setInternal(o.value);
    onChange?.(o.value);
    setOpen(false);
  };
  const borderColor = error ? "var(--status-error)" : open ? "var(--border-focus)" : "var(--border-default)";
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", position: "relative", ...style }}>
      {label ? (
        <label htmlFor={selId} style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-medium)" as unknown as number, fontSize: 14, color: "var(--text-strong)" }}>
          {label}
        </label>
      ) : null}
      <button
        id={selId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          height: 41,
          padding: "0 16px",
          width: "100%",
          textAlign: "left",
          background: disabled ? "var(--gray-100)" : "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: `inset 0 0 0 ${open && !error ? "1.5px" : "1px"} ${borderColor}`,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: selected ? "var(--text-strong)" : "var(--text-muted)",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "#fff",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            boxShadow: "var(--shadow-xl)",
            padding: 6,
          }}
        >
          {opts.map((o) => {
            const active = o.value === current;
            return (
              <div
                key={o.value}
                onClick={() => pick(o)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = active ? "var(--primary-100)" : "transparent")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: active ? "var(--primary-100)" : "transparent",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  color: "var(--text-strong)",
                }}
              >
                <span>{o.label}</span>
                {active ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {error ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--status-error)" }}>{error}</span> : null}
    </div>
  );
}
