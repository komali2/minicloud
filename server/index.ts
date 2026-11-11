import { ensureSeedConnections, listConnections, listApps, getAppBySlug, insertApp, slugExists, auditForApp } from "./db";
import { homePage, auditPage, page } from "./ui";
import { generate } from "../generator";
import { handleQuery, handleWrite } from "../gateway";

ensureSeedConnections();

const PORT = Number(process.env.PORT ?? 3000);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");

const html = (s: string, status = 200) =>
  new Response(s, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

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
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ stage, detail, ...extra })}\n\n`));

      try {
        const conns = listConnections();
        send("connected", `${conns.length} system(s) of record available`);

        const { artifact, model } = await generate(prompt, conns, modelId, (s, d) => send(s, d));

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
        send("done", artifact.title, { url: `${PUBLIC_BASE_URL}/a/${slug}/`, slug });
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

    if (path === "/" && req.method === "GET") return html(homePage(listApps(), listConnections()));
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
