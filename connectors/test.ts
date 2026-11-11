import type { Connection } from "../server/types";
import { listFiles } from "./csvfile";
import { webdavList } from "./webdav";
import { odooPing } from "./odoo";

/** Actually reach out and prove a connection works. Never returns credentials. */
export async function testConnection(c: Connection): Promise<{ ok: boolean; detail: string }> {
  try {
    switch (c.kind) {
      case "erpnext": {
        const res = await fetch(`${c.base_url.replace(/\/+$/, "")}/api/method/frappe.auth.get_logged_user`, {
          headers: { Authorization: `token ${c.secret.key}:${c.secret.secret}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return { ok: false, detail: `HTTP ${res.status} — check the URL and API credentials` };
        const j: any = await res.json();
        if (!j?.message) return { ok: false, detail: "credentials rejected" };
        return { ok: true, detail: `authenticated as ${j.message}` };
      }
      case "csv": {
        const files = listFiles(c.base_url);
        if (!files.length) return { ok: false, detail: "no .csv files found at that path" };
        return { ok: true, detail: `${files.length} file(s), ${files.reduce((n, f) => n + f.rows, 0)} rows` };
      }
      case "webdav": {
        const files = await webdavList(c);
        if (!files.length) return { ok: false, detail: "share reachable, but no .csv files on it" };
        return { ok: true, detail: `${files.length} file(s) on the share` };
      }
      case "odoo":
        return { ok: true, detail: await odooPing(c) };
      case "rest": {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (c.secret.header && c.secret.token) headers[c.secret.header] = c.secret.token;
        const res = await fetch(c.base_url, { headers, signal: AbortSignal.timeout(10000) });
        return res.ok
          ? { ok: true, detail: `HTTP ${res.status} from the base URL` }
          : { ok: false, detail: `HTTP ${res.status}` };
      }
      default:
        return { ok: false, detail: `no test implemented for ${c.kind}` };
    }
  } catch (e) {
    return { ok: false, detail: (e as Error).message.slice(0, 160) };
  }
}
