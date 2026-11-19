"use client";

export class ApiError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

/** fetch() wrapper for the browser: JSON in/out, redirects to login on 401. */
export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, data.fields);
  return data as T;
}
