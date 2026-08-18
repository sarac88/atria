"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import { InvitationScreen } from "@/components/screens/InvitationScreen";
import { useSettings } from "@/components/settings/SettingsContext";
import { errorMessage } from "@/lib/api/client";
import { acceptInvitation, useInvitation } from "@/lib/api/invitations";
import type { AcceptInvitationInput } from "@/lib/types";

export default function InvitationPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { data: preview, isLoading, isError } = useInvitation(token);
  const { user, refreshSession } = useSettings();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = `/login?next=${encodeURIComponent(`/invitacion/${token}`)}`;

  const onAccept = async (input: AcceptInvitationInput) => {
    setPending(true);
    setError(null);
    try {
      const result = await acceptInvitation(token, input);
      refreshSession();
      router.push(`/clase/${result.classId}`);
    } catch (e) {
      setError(errorMessage(e, "No se pudo aceptar la invitación. Inténtalo de nuevo."));
      setPending(false);
    }
  };

  if (isLoading) return <div style={{ height: "100vh", background: "var(--surface-page)" }} />;

  if (isError || !preview) {
    return (
      <div style={{ height: "100vh", background: "var(--surface-page)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 400, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ display: "inline-flex", color: "var(--status-error)" }}>
            <Icon name="x-circle" size={44} />
          </span>
          <h2 style={{ fontSize: 21, margin: 0 }}>Invitación no válida</h2>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: 0 }}>
            El enlace no existe o ha sido revocado. Pide al docente que te envíe uno nuevo.
          </p>
          <Button variant="outline" onClick={() => router.push("/login")} style={{ marginTop: 8 }}>
            Ir a Atria
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh" }}>
      <InvitationScreen
        preview={preview}
        sessionEmail={user?.email ?? null}
        pending={pending}
        error={error}
        onAccept={onAccept}
        onGoToLogin={() => router.push(loginHref)}
      />
    </div>
  );
}
