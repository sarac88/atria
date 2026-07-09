"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { ResourceCard } from "./ResourceCard";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
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
  const [deleting, setDeleting] = useState<ModuleItem | null>(null);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {items.map((it) => (
          <ResourceCard
            key={it.id}
            item={it}
            canDelete={canDelete}
            onView={setViewing}
            onDelete={setDeleting}
            extra={renderExtra?.(it)}
          />
        ))}
      </div>

      {onAdd ? (
        <Button variant="ghost" size="small" iconLeft={<Icon name="plus" size={16} />} style={{ alignSelf: "flex-start", marginTop: 12 }} onClick={onAdd}>
          Añadir recurso
        </Button>
      ) : null}

      {viewing ? <ResourceViewerModal item={viewing} onClose={() => setViewing(null)} /> : null}

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
