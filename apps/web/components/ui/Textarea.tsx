"use client";

import { useId, useState, type CSSProperties, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  label?: string;
  error?: string;
  helper?: string;
  style?: CSSProperties;
}

/** Atria multi-line text area. Shares Input's label / error treatment. */
export function Textarea({
  label,
  value,
  defaultValue,
  placeholder = "Placeholder",
  error,
  helper,
  disabled = false,
  rows = 4,
  onChange,
  id,
  style = {},
  ...rest
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const reactId = useId();
  const inputId = id || reactId;
  const borderColor = error ? "var(--status-error)" : focused ? "var(--border-focus)" : "var(--border-default)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }}>
      {label ? (
        <label htmlFor={inputId} style={{ fontFamily: "var(--font-sans)", fontWeight: "var(--weight-medium)" as unknown as number, fontSize: 14, lineHeight: 1, color: "var(--text-strong)" }}>
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          resize: "vertical",
          padding: "12px 16px",
          background: disabled ? "var(--gray-100)" : "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          outline: "none",
          boxShadow: `inset 0 0 0 ${focused && !error ? "1.5px" : "1px"} ${borderColor}${focused && !error ? ", var(--focus-ring)" : ""}`,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--text-strong)",
          transition: "box-shadow .15s ease",
        }}
        {...rest}
      />
      {error ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--status-error)" }}>{error}</span>
      ) : helper ? (
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{helper}</span>
      ) : null}
    </div>
  );
}
