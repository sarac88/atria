import type { ModuleItem } from "@/lib/types";
import { resourceUrl } from "@/lib/api/client";

export type ResourceKind = "youtube" | "vimeo" | "pdf" | "office" | "web" | "none";

const OFFICE_EXT = new Set(["doc", "docx"]);

function extFromUrl(url: string): string {
  const path = url.split("?")[0] ?? "";
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot + 1).toLowerCase();
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=))([\w-]{11})/);
  return m?.[1] ?? null;
}

export function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

export function resourceKind(item: ModuleItem): ResourceKind {
  if (item.type === "youtube") return "youtube";
  if (item.type === "vimeo") return "vimeo";
  if (item.type === "web") return "web";
  if (!item.url) return "none";

  const ext = extFromUrl(item.url);
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXT.has(ext)) return "office";

  if (youtubeId(item.url)) return "youtube";
  if (vimeoId(item.url)) return "vimeo";
  if (/^https?:\/\//i.test(item.url)) return "web";

  return "none";
}

export function embedUrl(kind: ResourceKind, url: string): string | null {
  if (kind === "youtube") {
    const id = youtubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (kind === "vimeo") {
    const id = vimeoId(url);
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (kind === "pdf") return resourceUrl(url);
  return null;
}

export function openResource(item: ModuleItem, onView: (item: ModuleItem) => void): void {
  const kind = resourceKind(item);
  const href = item.url ? resourceUrl(item.url) : "";

  if (kind === "web" || kind === "office") {
    if (href) window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  if (kind === "youtube" || kind === "vimeo" || kind === "pdf") {
    onView(item);
    return;
  }
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
