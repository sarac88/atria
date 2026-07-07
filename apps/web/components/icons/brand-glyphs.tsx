import type { ReactNode } from "react";

// Brand glyphs that are NOT part of the Atria DS icon set (YouTube, Vimeo, web).
// Copied from the design handoff (resource-modals.jsx). They use currentColor so
// the parent controls the tint.

export function YouTubeGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * (14 / 20)} viewBox="0 0 20 14" fill="none" aria-hidden="true">
      <rect x={0.5} y={0.5} width={19} height={13} rx={3.4} fill="currentColor" />
      <path d="M8 4.4 13 7l-5 2.6V4.4Z" fill="#fff" />
    </svg>
  );
}

export function VimeoGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 7.4c-.1 2.1-1.6 5-4.4 8.7-2.9 3.8-5.4 5.7-7.4 5.7-1.2 0-2.3-1.2-3.1-3.5-.6-2-1.1-4-1.7-6-.6-2.3-1.3-3.5-2-3.5-.2 0-.7.3-1.6 1L1 8.6c1-.9 2-1.8 3-2.7C5.3 4.7 6.3 4.2 7 4.1c1.6-.2 2.6.9 3 3.3.4 2.6.7 4.2.8 4.8.4 1.9.9 2.9 1.4 2.9.4 0 1-.6 1.8-1.9.8-1.3 1.2-2.2 1.3-2.9.1-1.2-.4-1.8-1.3-1.8-.5 0-.9.1-1.4.3 1-3.1 2.8-4.6 5.5-4.5 2 .05 2.95 1.4 2.9 4.05Z" />
    </svg>
  );
}

export function GlobeGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx={12} cy={12} r={8.5} />
      <path d="M3.5 12h17M12 3.5c2.3 2.3 3.4 5.3 3.4 8.5S14.3 18.2 12 20.5C9.7 18.2 8.6 15.2 8.6 12S9.7 5.8 12 3.5Z" />
    </svg>
  );
}

/** Resource `type` values that map to a brand glyph (instead of a DS icon). */
export const BRAND_RESOURCE: Record<string, { color: string; glyph: (size: number) => ReactNode }> = {
  youtube: { color: "#FF0000", glyph: (s) => <YouTubeGlyph size={s} /> },
  vimeo: { color: "#1AB7EA", glyph: (s) => <VimeoGlyph size={s} /> },
  web: { color: "var(--brand-accent)", glyph: (s) => <GlobeGlyph size={s} /> },
};
