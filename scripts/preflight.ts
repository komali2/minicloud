/**
 * Pre-flight before filming. Checks every link in the demo chain and prints
 * a pass/fail table. Run this right before you record.
 *   bun scripts/preflight.ts
 */
const LOCAL = `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const PUBLIC = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
const ERP = process.env.ERP_BASE_URL ?? "";

type Check = { name: string; ok: boolean; note: string };
const results: Check[] = [];

async function check(name: string, fn: () => Promise<string>) {
  try {
    results.push({ name, ok: true, note: await fn() });
  } catch (e) {
    results.push({ name, ok: false, note: (e as Error).message });
  }
}

const get = async (url: string, ms = 10000) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
};

await check("platform up (local)", async () => {
  const j: any = await (await get(`${LOCAL}/health`)).json();
  return `${j.apps} app(s) registered`;
});

await check("public URL reachable", async () => {
  if (!PUBLIC) throw new Error("PUBLIC_BASE_URL not set");
  const j: any = await (await get(`${PUBLIC}/health`, 15000)).json();
  return `${PUBLIC} · ${j.apps} app(s)`;
});

await check("public URL matches local app count", async () => {
  const a: any = await (await get(`${LOCAL}/health`)).json();
  const b: any = await (await get(`${PUBLIC}/health`, 15000)).json();
  if (a.apps !== b.apps) throw new Error(`local ${a.apps} vs public ${b.apps} — funnel may point elsewhere`);
  return `both report ${a.apps}`;
});

await check("ERPNext reachable", async () => {
  const j: any = await (await get(`${ERP}/api/method/ping`)).json();
  if (j?.message !== "pong") throw new Error("no pong");
  return ERP;
});

await check("ERP credentials valid", async () => {
  const res = await fetch(`${ERP}/api/method/frappe.auth.get_logged_user`, {
    headers: { Authorization: `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}` },
    signal: AbortSignal.timeout(10000),
  });
  const j: any = await res.json();
  if (!j?.message) throw new Error("token rejected");
  return `authenticated as ${j.message}`;
});

await check("three years of sales data", async () => {
  const url = `${ERP}/api/resource/Sales%20Invoice?fields=%5B%22posting_date%22%5D&filters=%5B%5B%22docstatus%22,%22=%22,1%5D%5D&limit_page_length=2000`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}` },
    signal: AbortSignal.timeout(15000),
  });
  const j: any = await res.json();
  const rows: any[] = j?.data ?? [];
  if (rows.length < 100) throw new Error(`only ${rows.length} submitted invoices — re-run the seeder`);
  const years = new Set(rows.map((r) => r.posting_date.slice(0, 4)));
  if (years.size < 3) throw new Error(`data spans only ${[...years].join(", ")}`);
  return `${rows.length} invoices across ${[...years].sort().join(", ")}`;
});

await check("local model server up", async () => {
  const j: any = await (await get(`${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1"}/models`)).json();
  const n = j?.data?.length ?? 0;
  if (!n) throw new Error("no models");
  return `${n} on-prem model(s) available`;
});

await check("every registered app serves and its queries work", async () => {
  const home = await (await get(`${LOCAL}/`)).text();
  const slugs = [...new Set([...home.matchAll(/\/a\/([a-z0-9-]+)\//g)].map((m) => m[1]))];
  if (!slugs.length) throw new Error("no apps in the list");
  const bad: string[] = [];
  for (const slug of slugs) {
    const html = await (await get(`${LOCAL}/a/${slug}/`)).text();
    if ((html.match(/src="http|href="http|cdn\./g) ?? []).length) bad.push(`${slug}: external refs`);
    const manifest: any = await (await get(`${LOCAL}/a/${slug}/manifest`)).json();
    for (const q of manifest.queries ?? []) {
      const r = await fetch(`${LOCAL}/a/${slug}/api/q/${q.id}`);
      if (!r.ok) bad.push(`${slug} ${q.id}: HTTP ${r.status}`);
    }
  }
  if (bad.length) throw new Error(bad.join("; "));
  return `${slugs.length} app(s) clean`;
});

await check("co-op ERP is NOT running", async () => {
  try {
    const res = await fetch("http://127.0.0.1:8080/api/method/ping", { signal: AbortSignal.timeout(2000) });
    if (res.ok) throw new Error("erp-local (REAL CLIENT DATA) is reachable on :8080 — stop it before filming");
  } catch (e) {
    if ((e as Error).message.includes("REAL CLIENT")) throw e;
    return "port 8080 closed";
  }
  return "port 8080 closed";
});

const pad = Math.max(...results.map((r) => r.name.length));
console.log("");
for (const r of results) {
  console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(pad)}  ${r.note}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n  ${results.length - failed}/${results.length} passed${failed ? " — fix the failures before filming" : " — clear to film"}\n`);
process.exit(failed ? 1 : 0);
