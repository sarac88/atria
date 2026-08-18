"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { Button, type ButtonProps } from "./Button";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children" | "iconLeft"> {
  value: string;
  label?: string;
  copiedLabel?: string;
}

/** navigator.clipboard sólo existe en contextos seguros; el textarea cubre el resto. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* sin permiso de portapapeles: probamos el método antiguo */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Copia un texto y confirma en el propio botón durante unos segundos. */
export function CopyButton({ value, label = "Copiar", copiedLabel = "Copiado", ...rest }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    if (!(await writeClipboard(value))) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button {...rest} onClick={copy} iconLeft={<Icon name={copied ? "check" : "clipboard"} size={16} />}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
