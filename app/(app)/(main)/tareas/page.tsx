"use client";

import { useState } from "react";
import { StudentTasks } from "@/components/screens/student/StudentTasks";
import { SubmitModal } from "@/components/modals/SubmitModal";

export default function TareasPage() {
  const [submitOpen, setSubmitOpen] = useState(false);
  return (
    <>
      <StudentTasks onSubmit={() => setSubmitOpen(true)} />
      {submitOpen && <SubmitModal onClose={() => setSubmitOpen(false)} onDone={() => setSubmitOpen(false)} />}
    </>
  );
}
