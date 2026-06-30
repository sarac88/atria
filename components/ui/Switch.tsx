"use client";

import { useId, useState, type CSSProperties, type MouseEvent } from "react";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (next: boolean, e: MouseEvent | Event) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  style?: CSSProperties;
}

/** Atria toggle switch — navy track when on. */
export function Switch({ checked, defaultChecked, onChange, label, disabled = false, id, style = {} }: SwitchProps) {
  const reactId = useId();
  const sId = id || reactId;
  const [internal, setInternal] = useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on, e.nativeEvent);
  };
  return (
    <label
      htmlFor={sId}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}
    >
      <input
        id={sId}
        type="checkbox"
        checked={on}
        onChange={toggle}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          flexShrink: 0,
          background: on ? "var(--brand-primary)" : "var(--gray-300)",
          position: "relative",
          transition: "background .15s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 2px rgba(16,27,63,.3)",
            transition: "left .15s ease",
          }}
        />
      </span>
      {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}>{label}</span> : null}
    </label>
  );
}
