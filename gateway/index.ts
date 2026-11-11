import type { AppRow, Manifest, Connection } from "../server/types";
import { getConnection, audit } from "../server/db";
import { erpQuery, erpCreate } from "../connectors/erpnext";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function manifestOf(app: AppRow): Manifest {
  const m = JSON.parse(app.manifest_json);
  return { queries: m.queries ?? [], actions: m.actions ?? [] };
}

function resolve(connId: string): Connection {
  const c = getConnection(connId);
  if (!c) throw new Error(`unknown connection`);
  return c;
}

/**
 * The declared manifest IS the capability grant.
 * An undeclared query does not 403 — it does not exist.
 */
export async function handleQuery(app: AppRow, queryId: string): Promise<Response> {
  const q = manifestOf(app).queries.find((x) => x.id === queryId);
  if (!q) {
    audit({ app_id: app.id, kind: "query", ref_id: queryId, status: "undeclared", detail: "not in manifest" });
    return json({ error: "not found" }, 404);
  }

  const started = Date.now();
  try {
    const conn = resolve(q.connection);
    if (conn.kind !== "erpnext") throw new Error(`unsupported connection kind ${conn.kind}`);
    const rows = await erpQuery(conn, q);
    audit({
      app_id: app.id, kind: "query", ref_id: queryId, connection_id: conn.id,
      status: "ok", row_count: rows.length, duration_ms: Date.now() - started,
      detail: `${q.doctype} · ${q.fields.length} fields`,
    });
    return json({ rows, count: rows.length });
  } catch (err) {
    audit({
      app_id: app.id, kind: "query", ref_id: queryId, connection_id: q.connection,
      status: "error", duration_ms: Date.now() - started, detail: (err as Error).message,
    });
    return json({ error: "query failed" }, 502);
  }
}

export async function handleWrite(app: AppRow, actionId: string, req: Request): Promise<Response> {
  const a = manifestOf(app).actions.find((x) => x.id === actionId);
  if (!a) {
    audit({ app_id: app.id, kind: "write", ref_id: actionId, status: "undeclared", detail: "not in manifest" });
    return json({ ok: false, error: "not found" }, 404);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("body must be a json object");
  } catch (e) {
    return json({ ok: false, error: `invalid body: ${(e as Error).message}` }, 400);
  }

  // Field allowlist: a generated app cannot widen its own write scope.
  const allowed = new Set(a.allowed_fields);
  const rejected = Object.keys(payload).filter((k) => !allowed.has(k));
  if (rejected.length) {
    audit({
      app_id: app.id, kind: "write", ref_id: actionId, connection_id: a.connection,
      status: "rejected", detail: `fields not in allowlist: ${rejected.join(", ")}`,
    });
    return json({ ok: false, error: `fields not permitted: ${rejected.join(", ")}` }, 400);
  }

  const started = Date.now();
  try {
    const conn = resolve(a.connection);
    if (conn.kind !== "erpnext") throw new Error(`unsupported connection kind ${conn.kind}`);
    const { name, submitted } = await erpCreate(conn, a, payload);
    audit({
      app_id: app.id, kind: "write", ref_id: actionId, connection_id: conn.id,
      status: "ok", duration_ms: Date.now() - started,
      detail: `${a.doctype} → ${name}${submitted ? " (submitted)" : " (draft)"}`,
    });
    return json({ ok: true, name, submitted });
  } catch (err) {
    const msg = (err as Error).message;
    audit({
      app_id: app.id, kind: "write", ref_id: actionId, connection_id: a.connection,
      status: "error", duration_ms: Date.now() - started, detail: msg,
    });
    return json({ ok: false, error: msg }, 502);
  }
}
