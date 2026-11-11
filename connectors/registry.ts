/**
 * The connector catalogue IT sees in the admin panel.
 *
 * `status` is honest on purpose: "ready" types are implemented and testable,
 * "planned" types appear in the catalogue but refuse to be created. A demo that
 * claims a working Odoo link it does not have is a demo that falls apart under
 * one question from someone who knows Odoo.
 */
export type FieldSpec = {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  required?: boolean;
  help?: string;
};

export type ConnectorType = {
  kind: string;
  label: string;
  blurb: string;
  status: "ready" | "planned";
  /** Goes into connections.base_url */
  endpoint: FieldSpec;
  /** Go into connections.secret_json */
  secrets: FieldSpec[];
  /** What a generated app may ask this connection for. */
  reads: string;
  writes: string | null;
};

export const CONNECTOR_TYPES: ConnectorType[] = [
  {
    kind: "erpnext",
    label: "ERPNext / Frappe",
    blurb: "Read and write documents in an ERPNext instance over its REST API.",
    status: "ready",
    endpoint: { key: "base_url", label: "Instance URL", placeholder: "http://erp.internal:8080", required: true },
    secrets: [
      { key: "key", label: "API key", placeholder: "e.g. 1a2b3c4d5e6f7a8", required: true },
      { key: "secret", label: "API secret", secret: true, required: true },
    ],
    reads: "any doctype, with field and filter scoping",
    writes: "documents, submitted on create",
  },
  {
    kind: "csv",
    label: "Local filesystem (CSV)",
    blurb: "Spreadsheets on a path the appliance can see — a mounted share, an export directory.",
    status: "ready",
    endpoint: { key: "base_url", label: "Directory path", placeholder: "/srv/exports", required: true },
    secrets: [],
    reads: "any .csv in the directory, filtered and projected",
    writes: null,
  },
  {
    kind: "webdav",
    label: "WebDAV share",
    blurb: "A WebDAV endpoint — NAS, Nextcloud, SharePoint-compatible drive. CSVs are read in place.",
    status: "ready",
    endpoint: { key: "base_url", label: "WebDAV URL", placeholder: "http://nas.internal:8081/exports", required: true },
    secrets: [
      { key: "user", label: "Username", required: false },
      { key: "password", label: "Password", secret: true, required: false },
    ],
    reads: "any .csv on the share",
    writes: null,
  },
  {
    kind: "rest",
    label: "Internal REST API",
    blurb: "Any internal JSON endpoint. The path becomes the resource a generated app may read.",
    status: "ready",
    endpoint: { key: "base_url", label: "Base URL", placeholder: "http://svc.internal/api", required: true },
    secrets: [
      { key: "header", label: "Auth header name", placeholder: "Authorization", required: false },
      { key: "token", label: "Auth header value", secret: true, required: false },
    ],
    reads: "declared paths, returning JSON arrays",
    writes: null,
  },
  {
    kind: "odoo",
    label: "Odoo",
    blurb: "Odoo external API over JSON-RPC. The instance is asked which models and fields it has.",
    status: "ready",
    endpoint: { key: "base_url", label: "Odoo URL", placeholder: "http://odoo.internal:8069", required: true },
    secrets: [
      { key: "db", label: "Database", required: true },
      { key: "user", label: "Username", required: true },
      { key: "password", label: "API key / password", secret: true, required: true },
    ],
    reads: "any business model, discovered by introspection",
    writes: null,
  },
  {
    kind: "postgres",
    label: "PostgreSQL",
    blurb: "Read-only views on an internal database. Declared queries become prepared statements.",
    status: "planned",
    endpoint: { key: "base_url", label: "Connection URL", placeholder: "postgres://user@db.internal/warehouse", required: true },
    secrets: [{ key: "password", label: "Password", secret: true, required: false }],
    reads: "whitelisted views",
    writes: null,
  },
];

export const getType = (kind: string) => CONNECTOR_TYPES.find((t) => t.kind === kind);
export const readyTypes = () => CONNECTOR_TYPES.filter((t) => t.status === "ready");
