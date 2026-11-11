import {
  ensureSeedConnections, listConnections, getConnection, upsertConnection, deleteConnection,
  appsUsingConnection, listApps, getAppBySlug, insertApp, slugExists, auditForApp,
} from "./db";
import { homePage, auditPage, adminPage, page } from "./ui";
import { getType } from "../connectors/registry";
import { testConnection } from "../connectors/test";
import { gpuStat } from "./gpu";
import { generate } from "../generator";
import { handleQuery, handleWrite } from "../gateway";

ensureSeedConnections();

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");

const html = (s: string, status = 200) =>
  new Response(s, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

/**
 * Inline SVG QR for a generated app's URL, so the link can be scanned straight off
 * the screen onto a phone. Degrades to nothing if qrencode isn't installed.
 */
async function qrSvg(url: string): Promise<string> {
  try {
    const proc = Bun.spawn(["qrencode", "-t", "SVG", "-m", "1", "-s", "4", "-o", "-", url], {
      stdout: "pipe", stderr: "ignore",
    });
    const svg = await new Response(proc.stdout).text();
    if ((await proc.exited) !== 0 || !svg.includes("<svg")) return "";
    // Strip the XML prolog/doctype so it can be inlined directly into the page.
    return svg.replace(/<\?xml[^>]*\?>/, "").replace(/<!DOCTYPE[^>]*>/, "").trim();
  } catch {
    return "";
  }
}

function makeSlug(hint: string): string {
  const base =
    hint.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").split("-").slice(0, 4).join("-") || "app";
  // Unguessable suffix: the slug is the only access control in Sandbox mode.
  for (let i = 0; i < 20; i++) {
    const s = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    if (!slugExists(s)) return s;
  }
  return `app-${crypto.randomUUID().slice(0, 12)}`;
}

/** Deploy = persist the artifact + register the slug. Sub-second, no build, no container. */
async function doGenerate(req: Request): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const prompt = String(body?.prompt ?? "").trim();
  const modelId = String(body?.model ?? "");
  if (!prompt) return json({ error: "prompt required" }, 400);

  const stream = new ReadableStream({
    async start(ctrl) {
      const enc = new TextEncoder();
      const send = (stage: string, detail?: string, extra: Record<string, unknown> = {}) =>
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ stage, detail, ...(extra ?? {}) })}\n\n`));
      const started = Date.now();

      try {
        const conns = listConnections();
        send("connected", `${conns.length} system(s) of record available`);

        const { artifact, model } = await generate(prompt, conns, modelId, (s, d, extra) => send(s, d, extra));

        const slug = makeSlug(artifact.slug_hint);
        insertApp({
          id: crypto.randomUUID(),
          slug,
          title: artifact.title,
          prompt,
          html: artifact.html,
          manifest_json: JSON.stringify({ queries: artifact.queries, actions: artifact.actions }),
          model,
        });
        send("deployed", `${(artifact.html.length / 1024).toFixed(1)} KB served at /a/${slug}/`);
        const url = `${PUBLIC_BASE_URL}/a/${slug}/`;
        send("done", artifact.title, {
          url,
          slug,
          ms: Date.now() - started,
          model,
          qr: await qrSvg(url),
        });
      } catch (err) {
        send("error", (err as Error).message);
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

const server = Bun.serve({
  port: PORT,
  idleTimeout: 180,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/health") return json({ ok: true, apps: listApps().length });

    // Inference hardware telemetry, so on-prem generation can be seen working.
    if (path === "/api/gpu") return json(await gpuStat());

    if (path === "/" && req.method === "GET") return html(homePage(listApps(), listConnections()));

    // --- IT administration: the connector catalogue and configured connections ---
    if (path === "/admin" && req.method === "GET") {
      const tested = url.searchParams.get("tested");
      const rows = await Promise.all(
        listConnections().map(async (conn) => ({
          conn,
          status: tested === conn.id || tested === "all" ? await testConnection(conn) : undefined,
          used: appsUsingConnection(conn.id),
        }))
      );
      return html(adminPage(rows));
    }

    if (path === "/admin/connections" && req.method === "POST") {
      const form = await req.formData();
      const kind = String(form.get("kind") ?? "");
      const spec = getType(kind);
      if (!spec) return html(page("Bad request", `<h1>Unknown connector type</h1>`), 400);
      if (spec.status !== "ready") {
        return html(page("Not available", `<h1>${spec.label} is not verified yet</h1>
<p class="sub">The connector is written but has not been proven against a live instance, so it cannot be configured.
<a href="/admin">Back</a></p>`), 400);
      }

      const name = String(form.get("name") ?? "").trim();
      const baseUrl = String(form.get(spec.endpoint.key) ?? "").trim();
      if (!name || !baseUrl) return Response.redirect("/admin", 303);

      const secret: Record<string, string> = {};
      for (const f of spec.secrets) {
        const v = String(form.get(f.key) ?? "").trim();
        if (v) secret[f.key] = v;
      }

      // Stable, readable id derived from the name; suffixed if taken.
      const root = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || kind;
      let id = root;
      for (let i = 2; getConnection(id); i++) id = `${root}-${i}`;

      upsertConnection({ id, name, kind, base_url: baseUrl, secret });
      return Response.redirect(`/admin?tested=${encodeURIComponent(id)}`, 303);
    }

    const connTest = path.match(/^\/admin\/connections\/([\w-]+)\/test$/);
    if (connTest && req.method === "POST") return Response.redirect(`/admin?tested=${connTest[1]}`, 303);

    const connDel = path.match(/^\/admin\/connections\/([\w-]+)\/delete$/);
    if (connDel && req.method === "POST") {
      deleteConnection(connDel[1]);
      return Response.redirect("/admin", 303);
    }
    if (path === "/generate" && req.method === "POST") return doGenerate(req);

    // Generated apps live under /a/:slug/ so their relative fetches ("./api/q/q1") resolve correctly.
    const m = path.match(/^\/a\/([a-zA-Z0-9-]+)(\/.*)?$/);
    if (m) {
      const [, slug, rest = ""] = m;
      const app = getAppBySlug(slug);
      if (!app) return html(page("Not found", `<h1>Not found</h1><p class="sub">No app at this link.</p>`), 404);

      if (rest === "" ) return Response.redirect(`/a/${slug}/`, 302);
      if (rest === "/") return html(app.html);
      if (rest === "/audit") return html(auditPage(app, auditForApp(app.id)));
      // The declared capability set, readable. Same information as the audit page.
      if (rest === "/manifest") return json(JSON.parse(app.manifest_json));

      const q = rest.match(/^\/api\/q\/([\w-]+)$/);
      if (q && req.method === "GET") return handleQuery(app, q[1], url);

      const w = rest.match(/^\/api\/w\/([\w-]+)$/);
      if (w && req.method === "POST") return handleWrite(app, w[1], req);

      return json({ error: "not found" }, 404);
    }

    return html(page("Not found", `<h1>Not found</h1>`), 404);
  },
});

console.log(`minicloud on http://localhost:${server.port}  (public: ${PUBLIC_BASE_URL})`);
console.log(`connections: ${listConnections().map((c) => c.id).join(", ") || "none"}`);
