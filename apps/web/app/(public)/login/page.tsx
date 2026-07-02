"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { useSettings } from "@/components/settings/SettingsContext";
import { login as apiLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onLogin = async (email: string, password: string) => {
    setPending(true);
    setError(null);
    try {
      await apiLogin({ email, password });
      refreshSession();
      router.push("/");
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
