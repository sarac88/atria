"use client";

// Auth gate for the whole authenticated area. Mock only: redirects to /login
// when the SettingsContext has no active session.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authed } = useSettings();

  useEffect(() => {
    if (!authed) router.replace("/login");
  }, [authed, router]);

  if (!authed) return null;
  return <>{children}</>;
}
