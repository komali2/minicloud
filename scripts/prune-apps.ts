/**
 * Keeps the named demo apps and deletes the rest, so the app list reads clean on camera.
 *   bun scripts/prune-apps.ts                      # list apps
 *   bun scripts/prune-apps.ts keep <slug> <slug>…  # delete everything else
 */
import { Database } from "bun:sqlite";

const db = new Database(process.env.DB_PATH ?? "minicloud.db");
const [cmd, ...slugs] = Bun.argv.slice(2);

const all = db.query(`SELECT id, slug, title, created_at FROM apps ORDER BY created_at`).all() as any[];

if (cmd !== "keep") {
  console.log(`${all.length} app(s):`);
  for (const a of all)
    console.log(`  ${a.slug}\n      ${a.title}  (${new Date(a.created_at).toLocaleTimeString("en-GB", { hour12: false })})`);
  console.log(`\nto prune:  bun scripts/prune-apps.ts keep ${all.slice(-3).map((a) => a.slug).join(" ")}`);
  process.exit(0);
}

if (!slugs.length) {
  console.error("refusing to delete every app — name at least one slug to keep");
  process.exit(1);
}

const keep = new Set(slugs);
const missing = slugs.filter((s) => !all.some((a) => a.slug === s));
if (missing.length) {
  console.error(`unknown slug(s): ${missing.join(", ")} — nothing deleted`);
  process.exit(1);
}

const doomed = all.filter((a) => !keep.has(a.slug));
const tx = db.transaction(() => {
  for (const a of doomed) {
    db.query(`DELETE FROM audit_log WHERE app_id = ?`).run(a.id);
    db.query(`DELETE FROM apps WHERE id = ?`).run(a.id);
  }
});
tx();

for (const a of doomed) console.log(`deleted  ${a.slug}`);
console.log(`\nkept ${keep.size}, deleted ${doomed.length}`);
