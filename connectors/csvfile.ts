import type { Connection, Query } from "../server/types";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

/** @internal exported for reuse by other file-backed connectors */
export function rowsFromCsv(text: string): Record<string, string | number>[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string | number> = {};
    header.forEach((h, i) => (o[h] = coerce(r[i] ?? "")));
    return o;
  });
}

/** Minimal RFC4180 parser: quoted fields, escaped quotes, embedded commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ""));
}

/** Numeric strings become numbers so charts and comparisons work. */
function coerce(v: string): string | number {
  const t = v.trim();
  if (t === "" ) return t;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

const safeName = (n: string) => basename(n).replace(/[^\w.-]/g, "");

function loadFile(dir: string, file: string): Record<string, string | number>[] {
  const path = join(dir, safeName(file));
  if (!existsSync(path)) throw new Error(`no such file`);
  const rows = parseCsv(readFileSync(path, "utf8"));
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string | number> = {};
    header.forEach((h, i) => (o[h] = coerce(r[i] ?? "")));
    return o;
  });
}

export function listFiles(dir: string): { file: string; columns: string[]; rows: number }[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .map((f) => {
      try {
        const rows = parseCsv(readFileSync(join(dir, f), "utf8"));
        return { file: f, columns: (rows[0] ?? []).map((c) => c.trim()), rows: Math.max(0, rows.length - 1) };
      } catch {
        return { file: f, columns: [], rows: 0 };
      }
    });
}

/**
 * Compare numerically when both sides are numeric, otherwise lexicographically.
 * ISO dates ("2025-01-06") sort correctly as strings; Number() would make them NaN
 * and silently drop every row.
 */
function cmp(have: unknown, want: unknown): number {
  const a = Number(have), b = Number(want);
  const bothNumeric =
    have !== "" && want !== "" && Number.isFinite(a) && Number.isFinite(b);
  if (bothNumeric) return a - b;
  return String(have).localeCompare(String(want));
}

export function matches(row: Record<string, unknown>, filter: unknown): boolean {
  if (!Array.isArray(filter) || filter.length < 3) return true;
  const [field, op, want] = filter as [string, string, any];
  const have = row[field];
  switch (op) {
    case "=": case "==": return String(have) === String(want);
    case "!=": return String(have) !== String(want);
    case ">": return cmp(have, want) > 0;
    case ">=": return cmp(have, want) >= 0;
    case "<": return cmp(have, want) < 0;
    case "<=": return cmp(have, want) <= 0;
    case "like": return String(have).toLowerCase().includes(String(want).replace(/%/g, "").toLowerCase());
    case "in": return Array.isArray(want) && want.map(String).includes(String(have));
    default: return true;
  }
}

/**
 * Filter, order, limit and project in-memory rows according to a declared query.
 * Shared by every connector that returns whole row sets (CSV, WebDAV, REST).
 */
export function applyQuery(rows: Record<string, unknown>[], q: Query): any[] {
  let out = rows;
  for (const f of q.filters ?? []) out = out.filter((r) => matches(r, f));

  if (q.order_by) {
    const [col, dir = "asc"] = String(q.order_by).split(/\s+/);
    out = [...out].sort((a, b) => {
      const n = cmp(a[col], b[col]);
      return dir.toLowerCase() === "desc" ? -n : n;
    });
  }

  out = out.slice(0, Math.min(q.limit ?? 500, 2000));

  // Project to declared fields only — the manifest is the capability grant here too.
  if (q.fields?.length && !q.fields.includes("*")) {
    out = out.map((r) => Object.fromEntries(q.fields.map((f) => [f, r[f] ?? null])));
  }
  return out;
}

/** Execute a declared read against a CSV on the appliance's data volume. */
export async function csvQuery(c: Connection, q: Query): Promise<any[]> {
  return applyQuery(loadFile(c.base_url, q.doctype), q);
}
