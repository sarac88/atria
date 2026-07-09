"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { BRAND_RESOURCE } from "@/components/icons/brand-glyphs";
import { resourceKind, youtubeThumb, type ResourceKind } from "@/lib/resources";
import type { ModuleItem } from "@/lib/types";
import { resourceUrl } from "@/lib/api/client";

const tint = (col: string, pct = 14) => `color-mix(in srgb, ${col} ${pct}%, var(--surface-card))`;

function Placeholder({ kind, type }: { kind: ResourceKind; type: string }) {
  const brand = BRAND_RESOURCE[type];
  const isPdf = kind === "pdf";
  const color = brand?.color ?? (isPdf ? "var(--primary-600)" : "var(--text-muted)");
  const glyph = brand?.glyph(isPdf ? 36 : 40) ?? <Icon name={isPdf ? "document-text" : type} size={36} color={color} />;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: tint(color, 16), color }}>
      {glyph}
    </div>
  );
}

export function ResourceThumb({ item }: { item: ModuleItem }) {
  const kind = resourceKind(item);
  const [vimeoThumb, setVimeoThumb] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (kind !== "vimeo" || !item.url) return;
    let cancelled = false;
    const href = resourceUrl(item.url);
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(href)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { thumbnail_url?: string } | null) => {
        if (!cancelled && data?.thumbnail_url) setVimeoThumb(data.thumbnail_url);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [kind, item.url]);

  const yt = kind === "youtube" ? youtubeThumb(item.url) : null;
  const src = !imgError ? (yt ?? vimeoThumb) : null;

  return (
    <div style={{ aspectRatio: "16 / 9", width: "100%", overflow: "hidden", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: "var(--surface-sunken)" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Placeholder kind={kind} type={item.type} />
      )}
    </div>
  );
}
