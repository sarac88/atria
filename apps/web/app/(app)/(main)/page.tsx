"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { useClasses } from "@/lib/api/classes";
import { TeacherDashboard } from "@/components/screens/teacher/TeacherDashboard";
import { StudentDashboard } from "@/components/screens/student/StudentDashboard";
import { AdminDashboard } from "@/components/screens/admin/AdminDashboard";
import { CreateClassModal } from "@/components/modals/CreateClassModal";
import type { ClassInfo } from "@/lib/types";

const NAV_PATHS: Record<string, string> = { clases: "/clases", usuarios: "/usuarios", tareas: "/tareas", calendario: "/calendario" };
const navPath = (key: string) => NAV_PATHS[key] ?? "/";

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useSettings();
  const { data: classes } = useClasses();
  const [createOpen, setCreateOpen] = useState(false);

  const openClass = (c: ClassInfo) => router.push(`/clase/${c.id}`);
  const onNav = (key: string) => router.push(navPath(key));
  const list = classes ?? [];

  return (
    <>
      {role === "docente" && <TeacherDashboard classes={list} onOpenClass={openClass} onCreate={() => setCreateOpen(true)} onNav={onNav} />}
      {role === "alumno" && <StudentDashboard classes={list} onOpenClass={openClass} onNav={onNav} />}
      {role === "admin" && <AdminDashboard onNav={onNav} />}
      {createOpen && <CreateClassModal onClose={() => setCreateOpen(false)} onDone={(id) => { setCreateOpen(false); router.push(`/clase/${id}`); }} />}
    </>
  );
}
