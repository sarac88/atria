"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { useSettings } from "@/components/settings/SettingsContext";
import { login as apiLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "var(--surface-page)" }} />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Sólo rutas internas, para que ?next= no pueda usarse como redirección abierta.
  const next = searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const onLogin = async (email: string, password: string) => {
    setPending(true);
    setError(null);
    try {
      await apiLogin({ email, password });
      refreshSession();
      router.push(target);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? "Correo o contraseña incorrectos."
          : "No se pudo conectar con el servidor.",
      );
      setPending(false);
    }
  };

  return (
    <div style={{ height: "100vh" }}>
      <LoginScreen onLogin={onLogin} error={error} pending={pending} />
    </div>
  );
}
