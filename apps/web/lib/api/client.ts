// Typed fetch wrapper for the Atria API. Sends the httpOnly session cookies
// (credentials: "include") and transparently retries once through
// /auth/refresh when the access token has expired.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function raw(path: string, opts?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
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
