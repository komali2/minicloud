import { Database } from "bun:sqlite";
import type { Connection, AppRow } from "./types";

export const db = new Database(process.env.DB_PATH ?? "minicloud.db", { create: true });
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS connections (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL,
  base_url    TEXT NOT NULL,
  secret_json TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS apps (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  html          TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  model         TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id        TEXT NOT NULL,
  kind          TEXT NOT NULL,
  ref_id        TEXT NOT NULL,
  connection_id TEXT,
  status        TEXT NOT NULL,
  row_count     INTEGER,
  duration_ms   INTEGER,
  detail        TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_app_idx ON audit_log(app_id, id DESC);
`);

const now = () => new Date().toISOString();

/** Seed the ERPNext connection from env on boot. Credentials live here and nowhere else. */
export function ensureSeedConnections() {
  const base = process.env.ERP_BASE_URL;
  const key = process.env.ERP_API_KEY;
  const secret = process.env.ERP_API_SECRET;
  if (!base || !key || !secret) return;
  db.query(
    `INSERT INTO connections (id, name, kind, base_url, secret_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET base_url = excluded.base_url, secret_json = excluded.secret_json`
  ).run("erpnext", "Northwind ERP (ERPNext)", "erpnext", base, JSON.stringify({ key, secret }), now());

  // The shared-drive spreadsheets the plant actually keeps. Same gateway, same audit log.
  const csvDir = process.env.CSV_DATA_DIR;
  if (csvDir) {
    db.query(
      `INSERT INTO connections (id, name, kind, base_url, secret_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET base_url = excluded.base_url`
    ).run("sharedrive", "Plant shared drive (CSV)", "csv", csvDir, "{}", now());
  }
}

export function listConnections(): Connection[] {
  const rows = db.query(`SELECT * FROM connections ORDER BY created_at`).all() as any[];
  return rows.map((r) => ({
    id: r.id, name: r.name, kind: r.kind, base_url: r.base_url,
    secret: JSON.parse(r.secret_json),
  }));
}

export function getConnection(id: string): Connection | null {
  const r = db.query(`SELECT * FROM connections WHERE id = ?`).get(id) as any;
  if (!r) return null;
  return { id: r.id, name: r.name, kind: r.kind, base_url: r.base_url, secret: JSON.parse(r.secret_json) };
}

export function insertApp(a: Omit<AppRow, "created_at">) {
  db.query(
    `INSERT INTO apps (id, slug, title, prompt, html, manifest_json, model, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(a.id, a.slug, a.title, a.prompt, a.html, a.manifest_json, a.model, now());
}

export const getAppBySlug = (slug: string) =>
  db.query(`SELECT * FROM apps WHERE slug = ?`).get(slug) as AppRow | null;

export const listApps = () =>
  db.query(`SELECT id, slug, title, prompt, model, created_at FROM apps ORDER BY created_at DESC`).all() as AppRow[];

export function slugExists(slug: string) {
  return !!db.query(`SELECT 1 FROM apps WHERE slug = ?`).get(slug);
}

export function audit(e: {
  app_id: string; kind: string; ref_id: string; connection_id?: string | null;
  status: string; row_count?: number | null; duration_ms?: number | null; detail?: string | null;
}) {
  db.query(
    `INSERT INTO audit_log (app_id, kind, ref_id, connection_id, status, row_count, duration_ms, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(e.app_id, e.kind, e.ref_id, e.connection_id ?? null, e.status,
        e.row_count ?? null, e.duration_ms ?? null, e.detail ?? null, now());
}

export const auditForApp = (appId: string, limit = 100) =>
  db.query(`SELECT * FROM audit_log WHERE app_id = ? ORDER BY id DESC LIMIT ?`).all(appId, limit) as any[];

export const auditCount = (appId: string) =>
  (db.query(`SELECT COUNT(*) AS n FROM audit_log WHERE app_id = ?`).get(appId) as any).n as number;
