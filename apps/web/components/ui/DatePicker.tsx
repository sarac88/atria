"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export interface DatePickerProps {
  label?: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2.75" y="4" width="14.5" height="13.25" rx="2.5" stroke="var(--text-muted)" strokeWidth="1.5" />
      <path d="M2.75 8h14.5M6.5 2.5v3M13.5 2.5v3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NavBtn({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir}
      style={{ width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", background: "var(--surface-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ transform: dir === "next" ? "rotate(180deg)" : "none" }}>
        <path d="M12 5l-5 5 5 5" stroke="var(--brand-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Atria DatePicker. Field with calendar affordance + popover month grid (Monday-first). */
export function DatePicker({ label, value, defaultValue = null, onChange, placeholder = "__ / __ / ____", error, disabled = false, id, style = {} }: DatePickerProps) {
  const reactId = useId();
  const dpId = id || reactId;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<Date | null>(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : internal;
  const [view, setView] = useState<Date>(() => selected || new Date(2022, 9, 1));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const pick = (d: Date) => {
    if (!isControlled) setInternal(d);
    onChange?.(d);
    setOpen(false);
  };
  const fmt = (d: Date | null | undefined) =>
    d ? `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}` : "";
  const y = view.getFullYear();
  const m = view.getMonth();
  const first = new Date(y, m, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  const sameDay = (a: Date | null, b: Date | null | undefined) =>
    !!a && !!b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const borderColor = error ? "var(--status-error)" : open ? "var(--border-focus)" : "var(--border-default)";
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", position: "relative", ...style }}>
      {label ? (
        <label htmlFor={dpId} style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-medium)" as unknown as number, fontSize: 14, color: "var(--text-strong)" }}>
          {label}
        </label>
      ) : null}
      <button
        id={dpId}
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
        <span>{selected ? fmt(selected) : placeholder}</span>
        <CalendarIcon />
      </button>
      {open ? (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, width: 300, background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--brand-primary)" }}>
              {MONTHS[m]} {y}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DOW.map((d, i) => (
              <span key={i} style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", padding: "4px 0" }}>
                {d}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                disabled={!d}
                onClick={() => d && pick(d)}
                style={{
                  aspectRatio: "1",
                  border: "none",
                  borderRadius: "50%",
                  cursor: d ? "pointer" : "default",
                  background: sameDay(d, selected) ? "var(--brand-primary)" : "transparent",
                  color: sameDay(d, selected) ? "#fff" : d ? "var(--text-strong)" : "transparent",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: sameDay(d, selected) ? 700 : 400,
                  transition: "background .1s ease",
                }}
                onMouseEnter={(e) => { if (d && !sameDay(d, selected)) e.currentTarget.style.background = "var(--surface-soft)"; }}
                onMouseLeave={(e) => { if (!sameDay(d, selected)) e.currentTarget.style.background = "transparent"; }}
              >
                {d ? d.getDate() : ""}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <NavBtn dir="prev" onClick={() => setView(new Date(y, m - 1, 1))} />
            <NavBtn dir="next" onClick={() => setView(new Date(y, m + 1, 1))} />
          </div>
        </div>
      ) : null}
      {error ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--status-error)" }}>{error}</span> : null}
    </div>
  );
}
