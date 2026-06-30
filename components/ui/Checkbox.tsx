"use client";

import { useId, useState, type ChangeEvent, type CSSProperties } from "react";

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

/** Atria checkbox — navy fill with white check when selected. */
export function Checkbox({ checked, defaultChecked, onChange, label, disabled = false, id, style = {} }: CheckboxProps) {
  const reactId = useId();
  const cbId = id || reactId;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internal;
  const toggle = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };
  return (
    <label
      htmlFor={cbId}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}
    >
      <input
        id={cbId}
        type="checkbox"
        checked={isChecked}
        onChange={toggle}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: 5,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: isChecked ? "var(--brand-primary)" : "#fff",
          boxShadow: isChecked ? "none" : "inset 0 0 0 1.5px var(--border-strong)",
          transition: "background .12s ease",
        }}
      >
        {isChecked ? (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}>{label}</span> : null}
    </label>
  );
}
