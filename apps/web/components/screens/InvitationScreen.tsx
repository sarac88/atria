"use client";

import { useState, type ReactNode } from "react";
import { Button, Icon, Input } from "@/components/ui";
import { PASSWORD_MIN_LENGTH, type AcceptInvitationInput, type InvitationPreviewDto } from "@/lib/types";

/** Tarjeta centrada con la marca: marco común de todos los estados de la invitación. */
function InvitationCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100%", height: "100%", overflowY: "auto", background: "var(--surface-page)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", boxShadow: "var(--ring-hairline), var(--shadow-lg)", padding: "36px 36px 32px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wordmark.svg" alt="Atria" style={{ height: 30 }} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Message({ icon, title, text, action }: { icon: string; title: string; text: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-600)" }}>
        <Icon name={icon} size={26} />
      </span>
      <h2 style={{ fontSize: 21, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: 0 }}>{text}</p>
      {action ? <div style={{ marginTop: 8, width: "100%" }}>{action}</div> : null}
    </div>
  );
}

/** Cabecera con la clase a la que se ha invitado y quién invita. */
function ClassHeading({ preview }: { preview: InvitationPreviewDto }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 26 }}>
      <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: "0 0 6px" }}>
        {preview.teacherName} te invita a su clase
      </p>
      <h2 style={{ fontSize: 24, margin: 0 }}>{preview.className}</h2>
      {preview.classSubject ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0" }}>{preview.classSubject}</p>
      ) : null}
    </div>
  );
}

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: "var(--status-error)", background: "var(--status-error-soft)", borderRadius: "var(--radius-sm)", padding: "9px 12px" }}>
      {children}
    </div>
  );
}

export function InvitationScreen({
  preview,
  sessionEmail,
  pending,
  error,
  onAccept,
  onGoToLogin,
}: {
  preview: InvitationPreviewDto;
  /** Correo de la sesión abierta, o null si nadie ha iniciado sesión. */
  sessionEmail: string | null;
  pending: boolean;
  error: string | null;
  onAccept: (input: AcceptInvitationInput) => void;
  onGoToLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (preview.status === "accepted") {
    return (
      <InvitationCard>
        <Message
          icon="check-circle"
          title="Ya has aceptado esta invitación"
          text={<>Ya formas parte de <strong>{preview.className}</strong>. Inicia sesión para entrar en la clase.</>}
          action={<Button variant="accent" style={{ width: "100%" }} onClick={onGoToLogin}>Iniciar sesión</Button>}
        />
      </InvitationCard>
    );
  }

  if (preview.status === "expired") {
    return (
      <InvitationCard>
        <Message
          icon="clock"
          title="El enlace ha caducado"
          text={<>Pide a {preview.teacherName} que te reenvíe la invitación a <strong>{preview.email}</strong>.</>}
        />
      </InvitationCard>
    );
  }

  // Ya tiene cuenta: la invitación se acepta desde su propia sesión.
  if (!preview.needsAccount) {
    const sameUser = sessionEmail === preview.email;
    return (
      <InvitationCard>
        <ClassHeading preview={preview} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
            {sameUser ? (
              <>Te unirás con tu cuenta <strong>{preview.email}</strong>.</>
            ) : sessionEmail ? (
              <>La invitación es para <strong>{preview.email}</strong>, pero tienes la sesión de {sessionEmail}. Entra con la cuenta invitada para aceptarla.</>
            ) : (
              <>Ya tienes cuenta en Atria con <strong>{preview.email}</strong>. Inicia sesión para unirte a la clase.</>
            )}
          </p>
          {error ? <ErrorBanner>{error}</ErrorBanner> : null}
          {sameUser ? (
            <Button variant="accent" style={{ width: "100%" }} disabled={pending} onClick={() => onAccept({})}>
              {pending ? "Uniéndote…" : "Unirme a la clase"}
            </Button>
          ) : (
            <Button variant="accent" style={{ width: "100%" }} onClick={onGoToLogin}>Iniciar sesión</Button>
          )}
        </div>
      </InvitationCard>
    );
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Escribe tu nombre y apellidos.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setFormError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }
    setFormError(null);
    onAccept({ name: name.trim(), password });
  };

  return (
    <InvitationCard>
      <ClassHeading preview={preview} />
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Input label="Correo electrónico" value={preview.email} disabled readOnly helper="Es el correo al que se ha enviado la invitación." />
        <Input label="Nombre y apellidos" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre y apellidos" />
        <Input
          label="Contraseña"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          helper={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
        />
        {formError || error ? <ErrorBanner>{formError ?? error}</ErrorBanner> : null}
        <Button variant="accent" type="submit" style={{ width: "100%" }} disabled={pending}>
          {pending ? "Creando tu cuenta…" : "Crear cuenta y unirme"}
        </Button>
      </form>
    </InvitationCard>
  );
}
