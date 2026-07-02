"use client";

import { useId, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  iconRight?: ReactNode;
  style?: CSSProperties;
}

function ErrorMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8.25" stroke="var(--status-error)" strokeWidth="1.5" />
      <path d="M10 6v5" stroke="var(--status-error)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.9" fill="var(--status-error)" />
    </svg>
  );
}

/** Atria text Input with label, optional error and helper text. */
export function Input({
  label,
  value,
  defaultValue,
  placeholder = "Placeholder",
  error,
  helper,
  disabled = false,
  required = false,
  type = "text",
  iconRight = null,
  onChange,
  id,
  style = {},
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const reactId = useId();
  const inputId = id || reactId;
  const borderColor = error ? "var(--status-error)" : focused ? "var(--border-focus)" : "var(--border-default)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label ? (
        <label htmlFor={inputId} style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-medium)" as unknown as number, fontSize: 14, lineHeight: 1, color: "var(--text-strong)" }}>
          {label}
          {required ? <span style={{ color: "var(--status-error)" }}> *</span> : null}
        </label>
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          height: 41,
          background: disabled ? "var(--gray-100)" : "#fff",
          borderRadius: "var(--radius-sm)",
          boxShadow: `inset 0 0 0 ${focused && !error ? "1.5px" : "1px"} ${borderColor}${focused && !error ? ", var(--focus-ring)" : ""}`,
          transition: "box-shadow .15s ease",
        }}
      >
        <input
          id={inputId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1, color: "var(--text-strong)", minWidth: 0 }}
          {...rest}
        />
        {error ? <ErrorMark /> : iconRight}
      </div>
      {error ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--status-error)" }}>{error}</span>
      ) : helper ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{helper}</span>
      ) : null}
    </div>
  );
}
