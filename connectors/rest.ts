import type { Connection, Query } from "../server/types";
import { applyQuery } from "./csvfile";

/** Execute a declared read against an internal JSON endpoint. */
export async function restQuery(c: Connection, q: Query): Promise<any[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (c.secret.header && c.secret.token) headers[c.secret.header] = c.secret.token;

  const path = String(q.doctype).replace(/^\/+/, "");
  const res = await fetch(`${c.base_url.replace(/\/+$/, "")}/${path}`, { headers });
  if (!res.ok) throw new Error(`upstream ${res.status} reading ${path}`);

  const body: any = await res.json();
  // Accept a bare array, or the common { data: [...] } / { results: [...] } envelopes.
  const rows: unknown = Array.isArray(body) ? body : body?.data ?? body?.results ?? body?.items;
  if (!Array.isArray(rows)) throw new Error(`${path} did not return a JSON array`);

  return applyQuery(rows as Record<string, unknown>[], q);
}
