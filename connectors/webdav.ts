import type { Connection, Query } from "../server/types";
import { rowsFromCsv, applyQuery } from "./csvfile";

const authHeaders = (c: Connection): Record<string, string> => {
  const u = c.secret.user, p = c.secret.password;
  if (!u && !p) return {};
  return { Authorization: "Basic " + Buffer.from(`${u ?? ""}:${p ?? ""}`).toString("base64") };
};

const base = (c: Connection) => c.base_url.replace(/\/+$/, "");

/** PROPFIND the share root and return the .csv files on it. */
export async function webdavList(c: Connection): Promise<{ file: string; size: number }[]> {
  const res = await fetch(base(c) + "/", {
    method: "PROPFIND",
    headers: { ...authHeaders(c), Depth: "1", "Content-Type": "application/xml" },
    body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:getcontentlength/></d:prop></d:propfind>`,
  });
  if (!res.ok) throw new Error(`PROPFIND returned ${res.status}`);
  const xml = await res.text();

  const out: { file: string; size: number }[] = [];
  // <d:response> blocks, each with an href and optionally a content length.
  for (const block of xml.split(/<\/[a-zA-Z]*:?response>/)) {
    const href = block.match(/<[a-zA-Z]*:?href>([^<]+)<\/[a-zA-Z]*:?href>/)?.[1];
    if (!href) continue;
    const name = decodeURIComponent(href.split("/").filter(Boolean).pop() ?? "");
    if (!name.toLowerCase().endsWith(".csv")) continue;
    const len = Number(block.match(/<[a-zA-Z]*:?getcontentlength>(\d+)</)?.[1] ?? 0);
    out.push({ file: name, size: len });
  }
  return out;
}

async function fetchCsv(c: Connection, file: string): Promise<string> {
  const safe = file.split("/").pop()!;
  const res = await fetch(`${base(c)}/${encodeURIComponent(safe)}`, { headers: authHeaders(c) });
  if (!res.ok) throw new Error(`upstream ${res.status} reading ${safe}`);
  return res.text();
}

/** Execute a declared read against a CSV sitting on a WebDAV share. */
export async function webdavQuery(c: Connection, q: Query): Promise<any[]> {
  return applyQuery(rowsFromCsv(await fetchCsv(c, q.doctype)), q);
}

export async function webdavColumns(c: Connection, file: string): Promise<string[]> {
  const rows = rowsFromCsv(await fetchCsv(c, file));
  return rows.length ? Object.keys(rows[0]) : [];
}
