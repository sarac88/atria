"use client";

// Auth gate for the authenticated area. Redirects to /login when there is no
// active session (GET /users/me failed). Waits for the session query to resolve
// before deciding, to avoid a redirect flash on refresh.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authed, authLoading } = useSettings();

  useEffect(() => {
    if (!authLoading && !authed) router.replace("/login");
  }, [authed, authLoading, router]);

  if (authLoading) return <div style={{ minHeight: "100vh", background: "var(--surface-page)" }} />;
  if (!authed) return null;
  return <>{children}</>;
}
