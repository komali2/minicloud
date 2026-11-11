import type { Connection } from "../server/types";
import { listFiles } from "../connectors/csvfile";
import { webdavList, webdavColumns } from "../connectors/webdav";

/** Schema hints only. Never a credential, never a data row. */
export async function connectionHints(conns: Connection[]): Promise<string> {
  const parts = await Promise.all(
    conns.map(async (c) => {
      if (c.kind === "erpnext") {
        return `Connection id: "${c.id}"  (${c.name} — ERPNext v15, company "Northwind Manufacturing", abbr "NM", currency TWD)

READABLE parent doctypes and their useful fields:
- Sales Invoice        : name, posting_date, customer, grand_total, net_total, status, docstatus
- Customer             : name, customer_name, customer_group, territory
- Item                 : name, item_code, item_name, item_group, stock_uom, valuation_rate
- Warehouse            : name, warehouse_name
- Bin                  : name, item_code, warehouse, actual_qty, projected_qty
- Stock Entry          : name, stock_entry_type, posting_date, docstatus

READABLE child tables. These hold the LINE ITEMS of a parent document. To read one you
MUST set "parent_doctype" to its parent, or the read is rejected:
- Sales Invoice Item   : parent, item_code, item_name, qty, rate, amount   (parent_doctype: "Sales Invoice")
- Stock Entry Detail   : parent, item_code, qty, s_warehouse, t_warehouse  (parent_doctype: "Stock Entry")

CRITICAL: a parent doctype does NOT have its line-item fields. "Stock Entry" has no
item_code and no qty; those live on "Stock Entry Detail". Asking a parent doctype for a
child field fails. If you need line items, query the child table with parent_doctype set.

WRITABLE doctype:
- Stock Entry (use stock_entry_type "Material Receipt"), written through a body_template.

Filters use the Frappe array form: [["fieldname", "operator", value], ...]
e.g. [["docstatus", "=", 1], ["posting_date", ">=", "2024-01-01"]]
Submitted documents have docstatus = 1. Always filter invoices on docstatus = 1.
Warehouse names are suffixed with the company abbreviation, e.g. "Stores - NM".`;
      }
      if (c.kind === "webdav") {
        try {
          const files = await webdavList(c);
          const described = await Promise.all(
            files.map(async (f) => `- ${f.file}\n    columns: ${(await webdavColumns(c, f.file)).join(", ")}`)
          );
          return `Connection id: "${c.id}"  (${c.name} — CSV files on a WebDAV share, READ-ONLY)

Use the FILENAME as the "doctype". Available files:
${described.join("\n")}

Filters use the same array form as the other connections. This connection cannot be written to.`;
        } catch (e) {
          return `Connection id: "${c.id}" (${c.name}, WebDAV share — currently unreachable: ${(e as Error).message})`;
        }
      }
      if (c.kind === "rest") {
        return `Connection id: "${c.id}"  (${c.name} — internal REST API at ${c.base_url}, READ-ONLY)

Use the PATH as the "doctype", e.g. "tickets" reads ${c.base_url}/tickets.
The endpoint must return a JSON array, or an object with a data/results/items array.
Filters and field projection are applied to the returned rows.`;
      }
      if (c.kind === "csv") {
        const files = listFiles(c.base_url);
        return `Connection id: "${c.id}"  (${c.name} — CSV files on the plant's shared drive, READ-ONLY)

Use the FILENAME as the "doctype". Available files:
${files.map((f) => `- ${f.file}  (${f.rows} rows)\n    columns: ${f.columns.join(", ")}`).join("\n")}

Filters use the same array form: [["minutes_lost", ">", 60]]
Operators: = != > >= < <= like in
Numeric columns are already numbers. This connection cannot be written to.`;
      }
      return `Connection id: "${c.id}" (${c.name}, kind ${c.kind})`;
    })
  );
  return parts.join("\n\n");
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
  "filters", "order_by", "parent_doctype" and "params" are optional. Keep "limit" <= 2000.
  Set "parent_doctype" whenever "doctype" is a child table.
- SEARCH BOXES AND FILTER CONTROLS: declare "params" and put {{name}} placeholders in filter
  values. The app then appends them to the fetch as a query string. Example:
    { "id": "q_search", "connection": "sharedrive", "doctype": "shift_handover.csv",
      "fields": ["handover_date","shift","line","notes"],
      "filters": [["notes","like","{{term}}"]], "params": ["term"], "limit": 200 }
  and the app calls fetch("./api/q/q_search?term=" + encodeURIComponent(input.value)).
  An empty value matches everything, so an empty search box shows all rows.
  Only the VALUE is bindable — the column and the operator stay fixed in the manifest, so a
  search box can never widen what the app is allowed to read. Prefer this over fetching
  every row and filtering in the browser whenever the user asks to search or filter.
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
2a. CHART RENDERING — these are the most common mistakes, do not make them:
   - The SVG must FILL the width of its container. Emit it with a viewBox and
     width:100%: <svg viewBox="0 0 960 320" width="100%" style="display:block;height:auto" preserveAspectRatio="xMidYMid meet">
     Compute all coordinates in viewBox units. Never set a fixed pixel width — a chart
     stranded in the left third of a wide card looks broken.
   - Reserve left padding of at least 64 viewBox units for the y-axis. Draw y-axis labels
     at x = padLeft - 10 with text-anchor="end", so they sit to the LEFT of the plot area.
     Never draw them over the bars or past the right edge.
   - Every piece of text must fall inside the viewBox. Nothing clipped, nothing cut off.
   - Label every category on the x-axis. If labels would collide, shorten them or rotate
     them — never silently drop some, which makes the axis look wrong.
   - Only put a series in the legend if you actually draw that series. Never advertise a
     comparison series you did not render.
   - Give bars a subtle rounded top (rx) and leave real gaps between groups.
   - NARROW SCREENS: a viewBox that scales to phone width shrinks its own labels to
     nothing. If the chart has more than about 6 categories, wrap the SVG in a
     horizontally scrollable container and give the SVG a min-width so the labels stay
     legible and the user swipes instead:
       <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
         <svg viewBox="0 0 960 320" style="width:100%;min-width:640px;height:auto">…</svg>
       </div>
     Keep SVG text at 12-13 viewBox units or larger so it survives any scaling.
3. Read data ONLY via fetch("./api/q/<queryId>"), which resolves to { "rows": [...], "count": n }.
4. Write data ONLY via fetch("./api/w/<actionId>", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(flatObject) }), which resolves to { "ok": true, "name": "..." } or { "ok": false, "error": "..." }.
5. Mobile-first. Assume a phone held one-handed on a warehouse floor: large tap targets (min 44px), big legible type, high contrast, no hover-only affordances. Must also look right on a desktop.
6. Show a loading state, and render something sensible when a query returns zero rows. Never show a blank screen.
7. Show a clear success or error message after a write.
8. Style it tastefully: system font stack, generous spacing, rounded corners, a restrained palette. It should look like a real internal tool, not a prototype.
9. No alert(). No console-only error handling. Surface errors in the UI.

Produce the complete app. Do not explain. Do not wrap anything in markdown code fences.`;
