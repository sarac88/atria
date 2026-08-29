"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Icon, Pagination } from "@/components/ui";
import { activityTypeMeta } from "@/lib/activity-meta";
import { paginate } from "@/lib/pagination";
import { studentTaskBadge } from "@/lib/student-task";
import type { StudentTaskDto } from "@/lib/types";

/** Shared list of a student's tasks, used both inside a class ("Tareas" tab) and on the global "Tareas" page. */
export function StudentTaskList({
  tasks,
  onOpen,
  showClass = true,
  pageSize,
}: {
  tasks: StudentTaskDto[];
  onOpen: (task: StudentTaskDto) => void;
  showClass?: boolean;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [tasks.length, pageSize]);
  const paged = pageSize ? paginate(tasks, page, pageSize) : null;
  const visible = paged?.items ?? tasks;

  return (
    <>
      {visible.map((task, i) => {
        const [icon, color] = activityTypeMeta(task.type);
        const badge = studentTaskBadge(task.mySubmission);
        const submitted = !!task.mySubmission;
        return (
          <div
            key={task.id}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < visible.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
          >
            <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${color} 16%, var(--surface-card))`, color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, fontSize: 12.5, color: "var(--text-muted)" }}>
                {showClass ? <span>{task.className}</span> : null}
                {showClass && task.type ? <span>·</span> : null}
                <span style={{ fontWeight: 600, color }}>{task.type}</span>
                {task.due ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>· <Icon name="calendar" size={13} /> {task.due}</span> : null}
              </div>
            </div>
            {badge ? <Badge color={badge.color}>{badge.label}</Badge> : null}
            <Button size="small" variant={submitted ? "outline" : "accent"} onClick={() => onOpen(task)}>
              {submitted ? "Ver" : "Entregar"}
            </Button>
          </div>
        );
      })}
      {paged && paged.total > paged.pageSize ? (
        <Pagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          pageSize={paged.pageSize}
          onChange={setPage}
        />
      ) : null}
    </>
  );
}
