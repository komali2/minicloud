# Contracts — read these aloud before anyone writes code

Two interfaces. If these hold, three people can build in parallel without ever
reading each other's code.

## 1. Generator contract (Role B owns)

```
generate(prompt: string, connections: ConnectionSummary[], model: string)
  -> Promise<Artifact>
```

`ConnectionSummary` is a *schema hint only* — never a credential:

```json
{ "id": "erpnext", "kind": "erpnext", "doctypes": ["Sales Invoice", "Item", "Stock Entry", "Warehouse"] }
```

`Artifact`:

```json
{
  "title": "Sales by Quarter",
  "slug_hint": "sales-by-quarter",
  "queries": [
    {
      "id": "q1",
      "connection": "erpnext",
      "doctype": "Sales Invoice",
      "fields": ["posting_date", "grand_total", "customer"],
      "filters": [["docstatus", "=", 1]],
      "limit": 1000
    }
  ],
  "actions": [
    {
      "id": "a1",
      "connection": "erpnext",
      "doctype": "Stock Entry",
      "op": "create",
      "allowed_fields": ["item_code", "qty", "warehouse"]
    }
  ],
  "html": "<!doctype html> ... single self-contained file ..."
}
```

Rules for the generated `html`:

- **One file.** No imports, no bundler, no npm. Inline CSS and JS.
- Charts: inline SVG or a single CDN `<script>`. Prefer inline SVG — the
  appliance may be offline.
- Fetches data **only** via `GET /api/q/{queryId}` (relative path).
- Writes **only** via `POST /api/w/{actionId}` (relative path), JSON body.
- Mobile-first. Assume a phone held in one hand in a warehouse.
- Must render something useful even if a query returns zero rows.

Role B must handle malformed model output: validate, and on failure re-prompt
once with the validation error. Returns a working artifact or throws.

## 2. Gateway contract (Role C owns)

Mounted by the platform under each app's own path, so `appId` is implicit from
the route and the app cannot address another app's data.

```
GET  /a/:slug/api/q/:queryId   -> { rows: object[], count: number }
POST /a/:slug/api/w/:actionId  -> { ok: true, name: string } | { ok: false, error: string }
```

Behaviour:

1. Load the app's manifest. If `:queryId` / `:actionId` is not declared in it →
   **404**. Not 403 — it does not exist.
2. Resolve the connection, inject stored credentials server-side.
3. For writes: reject any body key not in `allowed_fields` → 400.
4. Execute against the upstream system.
5. Append to `audit_log` on every call, success or failure.
6. Never return credentials, upstream URLs, or raw upstream errors to the client.

### ERPNext specifics

- Auth header: `Authorization: token <api_key>:<api_secret>`
- Read: `GET {base}/api/resource/{doctype}?fields=[...]&filters=[...]&limit_page_length=N`
- Write: `POST {base}/api/resource/{doctype}` with a JSON body
- Until the forked ERPNext is healthy, serve canned fixture rows with the same
  shape. Role B and Role A must never be blocked on ERPNext.

## 3. Platform surface (Role A owns)

```
GET  /                      chat box + app list
POST /generate              SSE: progress events, final { url }
GET  /a/:slug               serve stored html
GET  /a/:slug/audit         audit view for this app
```

## Schema (SQLite, 3 tables)

```sql
connections(id TEXT PK, name, kind, base_url, secret_json, created_at)
apps(id TEXT PK, slug UNIQUE, title, prompt, html, manifest_json, model, created_at)
audit_log(id INTEGER PK, app_id, kind, ref_id, connection_id, status, row_count, duration_ms, created_at)
```

Declared queries and actions live in `apps.manifest_json`. No separate table.
