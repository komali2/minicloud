export type Query = {
  id: string;
  connection: string;
  doctype: string;
  fields: string[];
  filters?: unknown[];
  limit?: number;
  order_by?: string;
  /** Required when `doctype` is a child table — Frappe rejects the read otherwise. */
  parent_doctype?: string;
  /**
   * Names the app may bind into {{placeholder}} values inside `filters`.
   * The field and operator stay fixed in the manifest; only the value varies,
   * so a search box cannot widen what the app is allowed to read.
   */
  params?: string[];
};

export type Action = {
  id: string;
  connection: string;
  doctype: string;
  op: "create";
  allowed_fields: string[];
  /** Flat submitted fields are substituted into this shape via {{field}} placeholders. */
  body_template?: unknown;
  /** Submit the document after creating it (ERPNext transactional doctypes). Default true. */
  submit?: boolean;
};

export type Manifest = { queries: Query[]; actions: Action[] };

export type Artifact = {
  title: string;
  slug_hint: string;
  queries: Query[];
  actions: Action[];
  html: string;
};

export type Connection = {
  id: string;
  name: string;
  kind: string;
  base_url: string;
  secret: Record<string, string>;
};

export type AppRow = {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  html: string;
  manifest_json: string;
  model: string;
  created_at: string;
};
