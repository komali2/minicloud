import type { Connection, Query, Action } from "../server/types";

const authHeaders = (c: Connection) => ({
  Authorization: `token ${c.secret.key}:${c.secret.secret}`,
  Accept: "application/json",
});

/** Execute a declared read against ERPNext. Credentials are injected here and never leave. */
export async function erpQuery(c: Connection, q: Query): Promise<any[]> {
  const params = new URLSearchParams();
  params.set("fields", JSON.stringify(q.fields));
  if (q.filters && q.filters.length) params.set("filters", JSON.stringify(q.filters));
  params.set("limit_page_length", String(Math.min(q.limit ?? 500, 2000)));
  if (q.order_by) params.set("order_by", q.order_by);
  // Reading a child table (Sales Invoice Item, Stock Entry Detail, ...) requires naming its parent.
  if (q.parent_doctype) params.set("parent", q.parent_doctype);

  const url = `${c.base_url}/api/resource/${encodeURIComponent(q.doctype)}?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(c) });
  const body = await res.text();
  if (!res.ok) {
    // Never leak the upstream URL or credentials to the caller.
    throw new Error(`upstream ${res.status} reading ${q.doctype}`);
  }
  let json: any;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`upstream returned non-JSON reading ${q.doctype}`);
  }
  return Array.isArray(json?.data) ? json.data : [];
}

/** Deep-substitute {{field}} placeholders in a body template with submitted values. */
function substitute(template: unknown, values: Record<string, unknown>): unknown {
  if (typeof template === "string") {
    const whole = template.match(/^\{\{(\w+)\}\}$/);
    if (whole) return values[whole[1]] ?? null; // preserve the value's own type
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(values[k] ?? ""));
  }
  if (Array.isArray(template)) return template.map((t) => substitute(t, values));
  if (template && typeof template === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template)) out[k] = substitute(v, values);
    return out;
  }
  return template;
}

/**
 * Submit a created document. ERPNext leaves REST-created transactional docs as drafts
 * (docstatus 0), which means they don't appear in submitted-only reads and don't move stock.
 * Non-submittable doctypes (Item, Customer, ...) reject this; that's fine, the doc still exists.
 */
async function trySubmit(c: Connection, doctype: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${c.base_url}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
      { method: "PUT", headers: { ...authHeaders(c), "Content-Type": "application/json" },
        body: JSON.stringify({ docstatus: 1 }) }
    );
    if (res.ok) {
      const j: any = await res.json();
      if (j?.data?.docstatus === 1) return true;
    }
    // Fallback: some doctypes only submit through the client method.
    const alt = await fetch(`${c.base_url}/api/method/frappe.client.submit`, {
      method: "POST",
      headers: { ...authHeaders(c), "Content-Type": "application/json" },
      body: JSON.stringify({ doc: { doctype, name } }),
    });
    return alt.ok;
  } catch {
    return false;
  }
}

/** Execute a declared write. Only allowed_fields may appear in `values`. */
export async function erpCreate(
  c: Connection,
  a: Action,
  values: Record<string, unknown>
): Promise<{ name: string; submitted: boolean }> {
  const body = a.body_template
    ? substitute(a.body_template, values)
    : { ...values };

  const payload: Record<string, unknown> = { doctype: a.doctype, ...(body as object) };

  const res = await fetch(`${c.base_url}/api/resource/${encodeURIComponent(a.doctype)}`, {
    method: "POST",
    headers: { ...authHeaders(c), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    let hint = "";
    try {
      const j = JSON.parse(text);
      // Frappe puts a readable message in _server_messages / exception.
      hint = String(j?.exception ?? j?._error_message ?? "").slice(0, 200);
    } catch { /* ignore */ }
    throw new Error(`upstream ${res.status} creating ${a.doctype}${hint ? `: ${hint}` : ""}`);
  }
  const json: any = JSON.parse(text);
  const name = String(json?.data?.name ?? "created");
  const submitted = a.submit === false ? false : await trySubmit(c, a.doctype, name);
  return { name, submitted };
}
