"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/settings/SettingsContext";
import { useClasses } from "@/lib/api/classes";
import { ClassList } from "@/components/screens/teacher/ClassList";
import { StudentCourses } from "@/components/screens/student/StudentCourses";
import { AdminClasses } from "@/components/screens/admin/AdminClasses";
import { CreateClassModal } from "@/components/modals/CreateClassModal";
import type { ClassInfo } from "@/lib/types";

export default function ClassesPage() {
  const router = useRouter();
  const { role } = useSettings();
  const { data: classes } = useClasses();
  const [createOpen, setCreateOpen] = useState(false);

  const openClass = (c: ClassInfo) => router.push(`/clase/${c.id}`);
  const list = classes ?? [];

  return (
    <>
      {role === "docente" && <ClassList classes={list} onOpenClass={openClass} onCreate={() => setCreateOpen(true)} />}
      {role === "alumno" && <StudentCourses classes={list} onOpenClass={openClass} />}
      {role === "admin" && <AdminClasses classes={list} onOpenClass={openClass} />}
      {createOpen && <CreateClassModal onClose={() => setCreateOpen(false)} onDone={() => setCreateOpen(false)} />}
    </>
  );
}
