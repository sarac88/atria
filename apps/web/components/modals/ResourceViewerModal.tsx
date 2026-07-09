"use client";

import { Button, Icon } from "@/components/ui";
import { Modal } from "@/components/layout";
import { embedUrl, resourceKind } from "@/lib/resources";
import { resourceUrl } from "@/lib/api/client";
import type { ModuleItem } from "@/lib/types";

export function ResourceViewerModal({ item, onClose }: { item: ModuleItem; onClose: () => void }) {
  const kind = resourceKind(item);
  const src = embedUrl(kind, item.url);
  const external = item.url ? resourceUrl(item.url) : "";

  const footer = external ? (
    <Button variant="outline" iconLeft={<Icon name="arrow-right" size={16} />} onClick={() => window.open(external, "_blank", "noopener,noreferrer")}>
      Abrir en pestaña nueva
    </Button>
  ) : undefined;

  return (
    <Modal title={item.label} onClose={onClose} footer={footer} width={880}>
      {src ? (
        <iframe
          src={src}
          title={item.label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "min(70vh, 520px)", border: "none", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)" }}
        />
      ) : (
        <div style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "40px 20px" }}>
          No se puede previsualizar este recurso.
        </div>
      )}
    </Modal>
  );
}
