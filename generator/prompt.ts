import type { Connection } from "../server/types";

/** Schema hints only. Never a credential, never a data row. */
export function connectionHints(conns: Connection[]): string {
  return conns
    .map((c) => {
      if (c.kind === "erpnext") {
        return `Connection id: "${c.id}"  (${c.name} — ERPNext v15, company "Northwind Manufacturing", abbr "NM", currency TWD)

READABLE doctypes and their useful fields:
- Sales Invoice        : name, posting_date, customer, grand_total, net_total, status, docstatus
- Sales Invoice Item   : parent, item_code, item_name, qty, rate, amount
- Customer             : name, customer_name, customer_group, territory
- Item                 : name, item_code, item_name, item_group, stock_uom
- Warehouse            : name, warehouse_name
- Bin                  : item_code, warehouse, actual_qty, projected_qty
- Stock Entry          : name, stock_entry_type, posting_date, docstatus

WRITABLE doctype:
- Stock Entry (use stock_entry_type "Material Receipt"), written through a body_template.

Filters use the Frappe array form: [["fieldname", "operator", value], ...]
e.g. [["docstatus", "=", 1], ["posting_date", ">=", "2024-01-01"]]
Submitted documents have docstatus = 1. Always filter invoices on docstatus = 1.
Warehouse names are suffixed with the company abbreviation, e.g. "Stores - NM".`;
      }
      return `Connection id: "${c.id}" (${c.name}, kind ${c.kind})`;
    })
    .join("\n\n");
}

export const SYSTEM_PROMPT = `You build tiny internal web applications for the staff of a manufacturing company. A non-technical employee describes the tool they need; you produce it.

You MUST reply in EXACTLY this format, with nothing before or after:

===MANIFEST===
{ "title": "...", "slug_hint": "...", "queries": [ ... ], "actions": [ ... ] }
===HTML===
<!doctype html>
...the complete app...

MANIFEST RULES
- "title": short human title, e.g. "Sales by Quarter".
- "slug_hint": lowercase kebab-case, max 4 words.
- "queries": every read the app needs. Each is
  { "id": "q1", "connection": "<connection id>", "doctype": "...", "fields": [...], "filters": [...], "limit": 1000, "order_by": "posting_date asc" }
  "filters" and "order_by" are optional. Keep "limit" <= 2000.
- "actions": only if the app writes. Each is
  { "id": "a1", "connection": "...", "doctype": "...", "op": "create",
    "allowed_fields": ["item_code","qty","warehouse"],
    "body_template": { "stock_entry_type": "Material Receipt",
                       "items": [ { "item_code": "{{item_code}}", "qty": "{{qty}}", "t_warehouse": "{{warehouse}}" } ] } }
  Documents created through an action are SUBMITTED automatically (docstatus becomes 1), so a
  query that lists recent writes and filters on docstatus = 1 will see them immediately.
  The app submits a FLAT json object whose keys are exactly allowed_fields. Those values are
  substituted into body_template wherever {{field}} appears. Anything not in allowed_fields is rejected.
- The manifest is the app's entire permission set. If a query is not declared here, the app cannot make it.
- Use "actions": [] when the app only reads.

HTML RULES — these are hard requirements:
1. ONE self-contained file. No imports, no bundlers, no npm, no external scripts, no external CSS, no web fonts, no CDN links. The appliance may be fully offline.
2. Draw charts as inline SVG that you build in JavaScript from the data. Never use a charting library.
3. Read data ONLY via fetch("./api/q/<queryId>"), which resolves to { "rows": [...], "count": n }.
4. Write data ONLY via fetch("./api/w/<actionId>", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(flatObject) }), which resolves to { "ok": true, "name": "..." } or { "ok": false, "error": "..." }.
5. Mobile-first. Assume a phone held one-handed on a warehouse floor: large tap targets (min 44px), big legible type, high contrast, no hover-only affordances. Must also look right on a desktop.
6. Show a loading state, and render something sensible when a query returns zero rows. Never show a blank screen.
7. Show a clear success or error message after a write.
8. Style it tastefully: system font stack, generous spacing, rounded corners, a restrained palette. It should look like a real internal tool, not a prototype.
9. No alert(). No console-only error handling. Surface errors in the UI.

Produce the complete app. Do not explain. Do not wrap anything in markdown code fences.`;
