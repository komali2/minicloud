import type { Connection, Query } from "../server/types";

/**
 * Odoo external API over JSON-RPC.
 *
 * Generic by construction: nothing about any particular Odoo instance is baked in.
 * A deployer supplies a URL, database, user and API key; the connector asks that
 * instance what models and fields it has.
 */

type RpcArgs = { service: string; method: string; args: unknown[] };

async function rpc(c: Connection, params: RpcArgs): Promise<any> {
  const res = await fetch(`${c.base_url.replace(/\/+$/, "")}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`odoo returned ${res.status}`);
  const body: any = await res.json();
  if (body.error) {
    const m = body.error?.data?.message ?? body.error?.message ?? "rpc error";
    throw new Error(String(m).slice(0, 160));
  }
  return body.result;
}

/** uid is cheap to fetch and short-lived; cache per connection for the process lifetime. */
const uidCache = new Map<string, { uid: number; at: number }>();

async function login(c: Connection): Promise<number> {
  const hit = uidCache.get(c.id);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.uid;

  const { db, user, password } = c.secret;
  if (!db || !user || !password) throw new Error("database, user and API key are all required");

  const uid = await rpc(c, { service: "common", method: "login", args: [db, user, password] });
  if (!uid || typeof uid !== "number") throw new Error("Odoo rejected those credentials");
  uidCache.set(c.id, { uid, at: Date.now() });
  return uid;
}

async function call(c: Connection, model: string, method: string, args: unknown[], kwargs: object = {}) {
  const uid = await login(c);
  return rpc(c, {
    service: "object",
    method: "execute_kw",
    args: [c.secret.db, uid, c.secret.password, model, method, args, kwargs],
  });
}

/** Our filter form [[field, op, value]] is already an Odoo domain; only `like` differs. */
function toDomain(filters: unknown[] = []): unknown[] {
  return filters.map((f) => {
    if (!Array.isArray(f) || f.length < 3) return f;
    const [field, op, value] = f as [string, string, unknown];
    return [field, op === "like" ? "ilike" : op, value];
  });
}

export async function odooQuery(c: Connection, q: Query): Promise<any[]> {
  const rows = await call(c, q.doctype, "search_read", [toDomain(q.filters)], {
    fields: q.fields,
    limit: Math.min(q.limit ?? 500, 2000),
    ...(q.order_by ? { order: q.order_by } : {}),
  });
  if (!Array.isArray(rows)) return [];
  // Relational fields come back as [id, "Display Name"] — the name is what a UI wants.
  return rows.map((r: any) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, Array.isArray(v) && v.length === 2 && typeof v[1] === "string" ? v[1] : v])
    )
  );
}

/** Ask the instance which models it actually has. */
export async function odooModels(c: Connection, limit = 40): Promise<{ model: string; name: string }[]> {
  const rows = await call(c, "ir.model", "search_read", [[["transient", "=", false]]], {
    fields: ["model", "name"],
    limit: 400,
  });
  const interesting = /^(sale|purchase|stock|account|product|res\.partner|mrp|hr|project|crm)/;
  return (rows ?? [])
    .filter((r: any) => interesting.test(r.model))
    .slice(0, limit)
    .map((r: any) => ({ model: r.model, name: r.name }));
}

/** Fields that exist on every model and tell a business user nothing. */
const NOISE =
  /^(message_|activity_|access_|website_|can_|__|combination_indices|has_message|my_activity|rating_|email_normalized|write_|create_|display_name$)|_properties_definition$/;

/** Fields a business app almost always wants, in the order it wants them. */
const PREFERRED = [
  "name", "display_name", "partner_id", "product_id", "default_code", "ref",
  "date", "date_order", "scheduled_date", "invoice_date", "state",
  "amount_total", "amount_untaxed", "price_unit", "list_price", "standard_price",
  "quantity", "product_uom_qty", "qty_available", "qty_done",
  "user_id", "company_id", "location_id", "picking_type_id", "origin", "email", "phone", "city",
];

/**
 * Ask the instance which fields a model has, ranked so the useful ones come first.
 * Nothing here is model-specific — it is a generic relevance heuristic over whatever
 * the instance reports.
 */
export async function odooFields(c: Connection, model: string, limit = 14): Promise<string[]> {
  const f = await call(c, model, "fields_get", [], { attributes: ["string", "type", "store"] });
  const usable = Object.entries(f ?? {})
    .filter(([k, m]: any) =>
      m.store !== false && !["binary", "one2many", "many2many"].includes(m.type) && !NOISE.test(k))
    .map(([k]) => k);

  const rank = (k: string) => {
    const i = PREFERRED.indexOf(k);
    return i === -1 ? PREFERRED.length + 1 : i;
  };
  return usable.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).slice(0, limit);
}

export async function odooPing(c: Connection): Promise<string> {
  const uid = await login(c);
  const version = await rpc(c, { service: "common", method: "version", args: [] });
  const v = version?.server_serie ?? version?.server_series ?? version?.server_version ?? "";
  const models = await odooModels(c, 500);
  return `authenticated as uid ${uid}${v ? ` on Odoo ${v}` : ""} · ${models.length} business model(s) readable`;
}
