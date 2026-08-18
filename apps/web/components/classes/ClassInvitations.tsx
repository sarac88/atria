"use client";

import { useState } from "react";
import { Badge, Button, CopyButton, DataTable, Icon, IconButton, type Column } from "@/components/ui";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useClassInvitations, useResendInvitation, useRevokeInvitation } from "@/lib/api/invitations";
import type { BadgeColor, ClassInvitationDto, InvitationStatus } from "@/lib/types";

const STATUS: Record<InvitationStatus, [string, BadgeColor]> = {
  pending: ["Pendiente", "warning"],
  expired: ["Caducada", "error"],
  accepted: ["Aceptada", "success"],
};

function expiryLabel(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "El enlace ya no sirve";
  if (days === 0) return "Caduca hoy";
  return days === 1 ? "Caduca mañana" : `Caduca en ${days} días`;
}

/**
 * Invitaciones enviadas y todavía sin aceptar. Se oculta cuando no hay ninguna:
 * en cuanto un alumno acepta, pasa a la tabla de alumnos.
 */
export function ClassInvitations({ classId }: { classId: string }) {
  const { data } = useClassInvitations(classId);
  const resend = useResendInvitation(classId);
  const revoke = useRevokeInvitation(classId);
  const [revoking, setRevoking] = useState<ClassInvitationDto | null>(null);

  const rows = data ?? [];
  if (rows.length === 0) return null;

  const cols: Column<ClassInvitationDto>[] = [
    {
      key: "email",
      label: "Correo",
      render: (v, row) => (
        <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{v as string}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {row.hasAccount ? "Ya tiene cuenta en Atria" : "Creará cuenta al aceptar"}
            {row.emailSentAt ? " · correo enviado" : " · sin enviar por correo"}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (v) => {
        const [label, color] = STATUS[v as InvitationStatus] ?? STATUS.pending;
        return <Badge color={color}>{label}</Badge>;
      },
    },
    {
      key: "expiresAt",
      label: "Caducidad",
      render: (v) => <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{expiryLabel(v as string)}</span>,
    },
    {
      key: "url",
      label: "Enlace",
      sortable: false,
      align: "right",
      render: (_v, row) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <CopyButton size="small" variant="outline" value={row.url} label="Copiar enlace" />
          <Button
            size="small"
            variant="ghost"
            disabled={resend.isPending}
            onClick={() => resend.mutate(row.id)}
            iconLeft={<Icon name="envelope" size={16} />}
          >
            Reenviar
          </Button>
          <IconButton
            size="small"
            variant="danger"
            label={`Revocar la invitación de ${row.email}`}
            icon={<Icon name="trash" size={16} />}
            onClick={() => setRevoking(row)}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title={`Invitaciones pendientes · ${rows.length}`}
        rowKey="id"
        columns={cols}
        rows={rows}
        selectable={false}
        toolbar={
          rows.length > 1 ? (
            <CopyButton
              size="small"
              variant="outline"
              value={rows.map((r) => `${r.email}: ${r.url}`).join("\n")}
              label="Copiar todos los enlaces"
              copiedLabel="Enlaces copiados"
            />
          ) : null
        }
      />
      {revoking ? (
        <ConfirmDialog
          title="Revocar invitación"
          message={
            <>
              El enlace enviado a <strong>{revoking.email}</strong> dejará de funcionar. Podrás volver a
              invitar a ese correo cuando quieras.
            </>
          }
          confirmLabel="Revocar"
          onConfirm={async () => {
            await revoke.mutateAsync(revoking.id);
            setRevoking(null);
          }}
          onClose={() => setRevoking(null)}
        />
      ) : null}
    </>
  );
}
