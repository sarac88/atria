/** Render de la primera página de un PDF a data URL, para las miniaturas. */

const cache = new Map<string, Promise<string | null>>();

const THUMB_WIDTH = 480;

async function render(url: string): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const doc = await pdfjs.getDocument({ url, withCredentials: true }).promise;
    const page = await doc.getPage(1);

    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const data = canvas.toDataURL("image/jpeg", 0.72);

    page.cleanup();
    await doc.destroy();
    return data;
  } catch {
    return null;
  }
}

export function pdfThumb(url: string): Promise<string | null> {
  const hit = cache.get(url);
  if (hit) return hit;
  const pending = render(url);
  cache.set(url, pending);
  return pending;
}
