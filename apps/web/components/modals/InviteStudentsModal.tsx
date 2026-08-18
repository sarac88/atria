"use client";

import { useState, type KeyboardEvent } from "react";
import { Button, CopyButton, Icon, Input } from "@/components/ui";
import { Modal } from "@/components/layout";
import { useInviteStudents } from "@/lib/api/invitations";
import type { ClassInvitationDto, InviteStudentsResultDto } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Separadores admitidos al escribir o pegar una lista de correos. */
const SPLIT_RE = /[\s,;]+/;

export function InviteStudentsModal({ classId, className, onClose }: { classId: string; className: string; onClose: () => void }) {
  const invite = useInviteStudents(classId);
  const [draft, setDraft] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteStudentsResultDto | null>(null);

  /** Convierte lo escrito en fichas; devuelve false si algún correo no es válido. */
  const commitDraft = (text: string): boolean => {
    const parts = text.split(SPLIT_RE).filter(Boolean);
    if (parts.length === 0) return true;
    const invalid = parts.filter((p) => !EMAIL_RE.test(p));
    if (invalid.length > 0) {
      setError(`${invalid[0]} no es un correo válido.`);
      return false;
    }
    setEmails((prev) => [...new Set([...prev, ...parts.map((p) => p.toLowerCase())])]);
    setDraft("");
    setError(null);
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
      e.preventDefault();
      commitDraft(draft);
    } else if (e.key === "Backspace" && !draft && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  };

  const submit = async () => {
    if (!commitDraft(draft)) return;
    const pending = [...new Set([...emails, ...draft.split(SPLIT_RE).filter(Boolean).map((p) => p.toLowerCase())])];
    if (pending.length === 0) {
      setError("Añade al menos un correo.");
      return;
    }
    setError(null);
    try {
      const res = await invite.mutateAsync(pending);
      setResult(res);
      setEmails([]);
      setDraft("");
    } catch {
      setError("No se pudieron enviar las invitaciones. Inténtalo de nuevo.");
    }
  };

  const again = () => {
    setResult(null);
    setError(null);
  };

  const footer = result ? (
    <>
      <Button variant="outline" onClick={again}>Invitar a más</Button>
      <Button variant="accent" onClick={onClose}>Hecho</Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button variant="accent" onClick={submit} disabled={invite.isPending}>
        {invite.isPending ? "Invitando…" : "Crear invitaciones"}
      </Button>
    </>
  );

  return (
    <Modal title={`Invitar alumnos · ${className}`} onClose={onClose} footer={footer} width={640}>
      {result ? (
        <InviteResult result={result} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Cada alumno recibirá un correo con su propio enlace para unirse a la clase. Si ya tiene
            cuenta en Atria, además le llegará un aviso en la aplicación; si no la tiene, podrá crearla
            desde el enlace.
          </p>

          {emails.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {emails.map((email) => (
                <span key={email} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--primary-100)", color: "var(--primary-700)", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>
                  {email}
                  <button
                    type="button"
                    aria-label={`Quitar ${email}`}
                    onClick={() => setEmails((prev) => prev.filter((e) => e !== email))}
                    style={{ display: "inline-flex", border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0 }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <Input
            label="Correos de los alumnos"
            type="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="alumno@centro.edu"
            error={error ?? undefined}
            helper="Pulsa Intro para añadir cada correo. También puedes pegar una lista separada por comas."
            iconRight={<Icon name="envelope" size={18} color="var(--text-muted)" />}
          />
        </div>
      )}
    </Modal>
  );
}

function InviteResult({ result }: { result: InviteStudentsResultDto }) {
  const { invitations, skipped } = result;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {invitations.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15 }}>
              {invitations.length === 1 ? "1 invitación lista" : `${invitations.length} invitaciones listas`}
            </h4>
            {invitations.length > 1 ? (
              <CopyButton
                size="small"
                variant="outline"
                value={invitations.map((i) => `${i.email}: ${i.url}`).join("\n")}
                label="Copiar todos"
                copiedLabel="Copiados"
              />
            ) : null}
          </div>
          {invitations.map((inv) => (
            <InvitationRow key={inv.id} invitation={inv} />
          ))}
        </div>
      ) : null}

      {skipped.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--warning-200)", color: "var(--warning-600)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
          <strong style={{ fontSize: 13.5 }}>No se han invitado:</strong>
          {skipped.map((s) => (
            <span key={s.email} style={{ fontSize: 13 }}>{s.email} — {s.reason}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: ClassInvitationDto }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: "var(--radius-md)", boxShadow: "var(--ring-hairline)", background: "var(--surface-card)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{invitation.email}</span>
        {invitation.emailSentAt ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--success-600)" }}>
            <Icon name="check" size={14} />Correo enviado
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--warning-600)" }}>Sin correo · comparte el enlace</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <code style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "var(--text-muted)", background: "var(--gray-100)", borderRadius: "var(--radius-sm)", padding: "8px 10px" }}>
          {invitation.url}
        </code>
        <CopyButton size="small" variant="outline" value={invitation.url} label="Copiar enlace" />
      </div>
    </div>
  );
}
