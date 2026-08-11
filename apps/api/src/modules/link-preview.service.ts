import { BadRequestException, Injectable } from "@nestjs/common";
import { lookup } from "dns/promises";
import { isIP } from "net";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

interface Cached {
  image: string | null;
  at: number;
}

/** Rangos privados/locales: no queremos que la API haga de proxy hacia la red interna. */
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
    // IPv4 mapeada (::ffff:10.0.0.1)
    const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

@Injectable()
export class LinkPreviewService {
  private readonly cache = new Map<string, Cached>();

  /** Devuelve la imagen de portada (og:image) de una página, o null si no tiene. */
  async image(rawUrl: string): Promise<{ image: string | null }> {
    const url = (rawUrl ?? "").trim();
    if (!/^https?:\/\//i.test(url)) throw new BadRequestException("URL no válida.");

    const hit = this.cache.get(url);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { image: hit.image };

    let image: string | null = null;
    try {
      const page = await this.fetchHtml(url);
      if (page) image = this.extractImage(page.html, page.finalUrl);
    } catch {
      image = null;
    }

    this.cache.set(url, { image, at: Date.now() });
    return { image };
  }

  /** Sigue redirecciones a mano para poder validar el destino en cada salto. */
  private async fetchHtml(startUrl: string): Promise<{ html: string; finalUrl: string } | null> {
    let current = startUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await this.isSafe(current))) return null;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(current, {
          redirect: "manual",
          signal: controller.signal,
          headers: { "user-agent": "AtriaBot/1.0 (+link preview)", accept: "text/html,application/xhtml+xml" },
        });
      } finally {
        clearTimeout(timer);
      }

      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get("location");
        if (!next) return null;
        current = new URL(next, current).toString();
        continue;
      }
      if (!res.ok) return null;
      if (!(res.headers.get("content-type") ?? "").includes("html")) return null;

      return { html: await this.readCapped(res), finalUrl: current };
    }

    return null;
  }

  /** Lee como mucho MAX_HTML_BYTES: el <head> siempre llega en los primeros KB. */
  private async readCapped(res: Response): Promise<string> {
    const reader = res.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    let html = "";
    let read = 0;
    while (read < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      read += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    await reader.cancel().catch(() => undefined);
    return html;
  }

  private async isSafe(url: string): Promise<boolean> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return false;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const host = parsed.hostname;
    if (isIP(host)) return !isPrivateAddress(host);
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;

    try {
      const addrs = await lookup(host, { all: true });
      return addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address));
    } catch {
      return false;
    }
  }

  private extractImage(html: string, baseUrl: string): string | null {
    const patterns = [
      /<meta[^>]+(?:property|name)=["'](?:og:image:secure_url|og:image:url|og:image)["'][^>]*>/i,
      /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*>/i,
      /<link[^>]+rel=["']image_src["'][^>]*>/i,
    ];

    for (const pattern of patterns) {
      const tag = html.match(pattern)?.[0];
      const value = tag?.match(/(?:content|href)=["']([^"']+)["']/i)?.[1];
      if (!value) continue;
      try {
        const abs = new URL(value, baseUrl);
        if (abs.protocol === "http:" || abs.protocol === "https:") return abs.toString();
      } catch {
        // Ignoramos valores que no son URL.
      }
    }

    return null;
  }
}
