"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { TeacherDashboard } from "@/components/screens/teacher/TeacherDashboard";
import { StudentDashboard } from "@/components/screens/student/StudentDashboard";
import { AdminDashboard } from "@/components/screens/admin/AdminDashboard";
import { CreateClassModal } from "@/components/modals/CreateClassModal";
import type { ClassInfo } from "@/lib/types";

const navPath = (key: string) => (key === "clases" ? "/clases" : key === "usuarios" ? "/usuarios" : "/");

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useSettings();
  const [createOpen, setCreateOpen] = useState(false);

  const openClass = (c: ClassInfo) => router.push(`/clase/${c.id}`);
  const onNav = (key: string) => router.push(navPath(key));

  return (
    <>
      {role === "docente" && <TeacherDashboard onOpenClass={openClass} onCreate={() => setCreateOpen(true)} onNav={onNav} />}
      {role === "alumno" && <StudentDashboard onOpenClass={openClass} onNav={onNav} />}
      {role === "admin" && <AdminDashboard onNav={onNav} />}
      {createOpen && <CreateClassModal onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); router.push("/clases"); }} />}
    </>
  );
}
