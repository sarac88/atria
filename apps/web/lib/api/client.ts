// Typed fetch wrapper for the Atria API. Sends the httpOnly session cookies
// (credentials: "include") and transparently retries once through
// /auth/refresh when the access token has expired.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/** API origin without the /api/v1 prefix — used to resolve static uploads. */
export const API_ORIGIN = BASE.replace(/\/api\/v1\/?$/, "");

/** Resolve a resource url: external links pass through; /uploads paths get the API origin. */
export function resourceUrl(url: string): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function raw(path: string, opts?: RequestInit): Promise<Response> {
  // For FormData (file uploads) let the browser set the multipart boundary.
  const isForm = typeof FormData !== "undefined" && opts?.body instanceof FormData;
  const base: Record<string, string> = isForm ? {} : { "Content-Type": "application/json" };
  return fetch(`${BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers: { ...base, ...((opts?.headers as Record<string, string>) ?? {}) },
  });
}

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  let res = await raw(path, opts);

  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await raw("/auth/refresh", { method: "POST" });
    if (refreshed.ok) res = await raw(path, opts);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
