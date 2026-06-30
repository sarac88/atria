"use client";

import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { useSettings } from "@/components/settings/SettingsContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSettings();
  return (
    <div style={{ height: "100vh" }}>
      <LoginScreen
        onLogin={() => {
          login();
          router.push("/");
        }}
      />
    </div>
  );
}
