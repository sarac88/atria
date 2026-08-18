"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { Modal } from "@/components/layout";
import { MEETING_BRAND } from "@/components/icons/brand-glyphs";
import { useAddOnlineSession, useUpdateOnlineSession } from "@/lib/api/classwork";
import { fromLocalInput, toLocalInput } from "@/lib/online-sessions";
import { detectMeetingProvider, MEETING_PROVIDER_LABEL, type OnlineSessionDto } from "@/lib/types";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  border: "none",
  outline: "none",
  borderRadius: "var(--radius-lg)",
  background: "var(--gray-100)",
  boxShadow: "inset 0 0 0 2px var(--border-default)",
  fontSize: 14.5,
  color: "var(--text-strong)",
  fontFamily: "var(--font-sans)",
};

const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 6 };

/**
 * Alta y edición de un enlace de videollamada de la unidad. La plataforma se
 * deduce del enlace (no se pregunta) y la fecha es opcional: sin fecha, el
 * enlace queda como sala permanente.
 */
export function OnlineSessionModal({
  classId,
  moduleId,
  moduleTitle,
  session,
  onClose,
}: {
  classId: string;
  moduleId: string;
  moduleTitle?: string;
  session?: OnlineSessionDto;
  onClose: () => void;
}) {
  const addSession = useAddOnlineSession(classId);
  const updateSession = useUpdateOnlineSession(classId);
  const [label, setLabel] = useState(session?.label ?? "");
  const [url, setUrl] = useState(session?.url ?? "");
  const [startsAt, setStartsAt] = useState(() => toLocalInput(session?.startsAt ?? null));
  const [error, setError] = useState<string | null>(null);

  const busy = addSession.isPending || updateSession.isPending;
  const trimmedUrl = url.trim();
  const provider = detectMeetingProvider(trimmedUrl);
  const brand = MEETING_BRAND[provider];
  const canSubmit = trimmedUrl.length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setError(null);
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError("Introduce un enlace válido (empieza por http:// o https://).");
      return;
    }
    const body = {
      label: label.trim() || MEETING_PROVIDER_LABEL[provider],
      url: trimmedUrl,
      startsAt: fromLocalInput(startsAt),
    };
    try {
      if (session) await updateSession.mutateAsync({ sessionId: session.id, ...body });
      else await addSession.mutateAsync({ moduleId, ...body });
      onClose();
    } catch {
      setError("No se pudo guardar la sesión. Inténtalo de nuevo.");
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
      <Button variant="accent" onClick={submit} disabled={!canSubmit || busy}>
        {busy ? "Guardando…" : session ? "Guardar cambios" : "Añadir sesión"}
      </Button>
    </>
  );

  return (
    <Modal
      title={session ? "Editar sesión online" : "Nueva sesión online"}
      onClose={onClose}
      footer={footer}
      width={540}
    >
      {!session && moduleTitle ? (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 18px" }}>
          El enlace se añade a «{moduleTitle}» y tus alumnos lo verán en la unidad.
        </p>
      ) : null}

      <label style={{ display: "block" }}>
        <span style={labelStyle}>Enlace de la videollamada</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, ...fieldStyle }}>
          <span style={{ color: brand?.color ?? "var(--text-muted)", display: "inline-flex", flexShrink: 0 }}>
            {brand ? brand.glyph(22) : <Icon name="video-camera" size={22} />}
          </span>
          <input
            value={url}
            autoFocus
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="https://meet.google.com/abc-defg-hij"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}
          />
        </div>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>
          {trimmedUrl
            ? `Detectado: ${MEETING_PROVIDER_LABEL[provider]}`
            : "Zoom, Google Meet, Microsoft Teams o cualquier otra sala."}
        </span>
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        <span style={labelStyle}>Título</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={MEETING_PROVIDER_LABEL[provider]}
          style={fieldStyle}
        />
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        <span style={labelStyle}>Fecha y hora (opcional)</span>
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={fieldStyle}
        />
        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>
          Déjalo vacío si es una sala permanente, siempre disponible.
        </span>
      </label>

      {error ? (
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>
          {error}
        </div>
      ) : null}
    </Modal>
  );
}
