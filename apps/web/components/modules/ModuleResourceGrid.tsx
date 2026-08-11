"use client";

import { useState } from "react";
import { ResourceCard } from "./ResourceCard";
import { AddResourceCard } from "./AddResourceCard";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { EditResourceModal } from "@/components/modals/EditResourceModal";
import { ResourceViewerModal } from "@/components/modals/ResourceViewerModal";
import { useDeleteResource } from "@/lib/api/classwork";
import type { ModuleItem } from "@/lib/types";

export function ModuleResourceGrid({
  classId,
  items,
  canDelete,
  onAdd,
  renderExtra,
}: {
  classId: string;
  items: ModuleItem[];
  canDelete?: boolean;
  onAdd?: () => void;
  renderExtra?: (item: ModuleItem) => React.ReactNode;
}) {
  const deleteResource = useDeleteResource(classId);
  const [viewing, setViewing] = useState<ModuleItem | null>(null);
  const [editing, setEditing] = useState<ModuleItem | null>(null);
  const [deleting, setDeleting] = useState<ModuleItem | null>(null);

  return (
    <>
      {items.length || onAdd ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {items.map((it) => (
            <ResourceCard
              key={it.id}
              item={it}
              canDelete={canDelete}
              onView={setViewing}
              onEdit={setEditing}
              onDelete={setDeleting}
              extra={renderExtra?.(it)}
            />
          ))}
          {onAdd ? <AddResourceCard onClick={onAdd} /> : null}
        </div>
      ) : null}

      {viewing ? <ResourceViewerModal item={viewing} onClose={() => setViewing(null)} /> : null}

      {editing ? <EditResourceModal classId={classId} item={editing} onClose={() => setEditing(null)} /> : null}

      {deleting ? (
        <ConfirmDialog
          title="Eliminar recurso"
          message={<>¿Seguro que quieres eliminar «{deleting.label}»? Esta acción no se puede deshacer.</>}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteResource.mutateAsync(deleting.id);
            setDeleting(null);
          }}
        />
      ) : null}
    </>
  );
}
