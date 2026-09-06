"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/layout";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Eliminar",
  busyLabel = "Eliminando…",
  cancelLabel = "Cancelar",
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  /** Texto mientras se completa, para las acciones que no son un borrado. */
  busyLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError("No se pudo completar la acción. Inténtalo de nuevo.");
      setBusy(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
      <Button variant={danger ? "danger" : "accent"} onClick={confirm} disabled={busy}>
        {busy ? busyLabel : confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal title={title} onClose={onClose} footer={footer} width={460}>
      <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-body)" }}>{message}</div>
      {error ? <div style={{ marginTop: 14, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>{error}</div> : null}
    </Modal>
  );
}
