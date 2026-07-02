"use client";

import { useId, useState, type ChangeEvent, type CSSProperties } from "react";

export interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

/** Atria radio — navy ring + filled dot when selected. */
export function Radio({ checked, defaultChecked, onChange, label, name, value, disabled = false, id, style = {} }: RadioProps) {
  const reactId = useId();
  const rId = id || reactId;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internal;
  const toggle = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) setInternal(true);
    onChange?.(e);
  };
  return (
    <label
      htmlFor={rId}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}
    >
      <input
        id={rId}
        type="radio"
        name={name}
        value={value}
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
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          boxShadow: isChecked ? "inset 0 0 0 1.5px var(--brand-primary)" : "inset 0 0 0 1.5px var(--border-strong)",
          transition: "box-shadow .12s ease",
        }}
      >
        {isChecked ? <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--brand-primary)" }} /> : null}
      </span>
      {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}>{label}</span> : null}
    </label>
  );
}
