/** Runs the demo prompts repeatedly and reports reliability, latency, and artifact shape. */
const BASE = "http://127.0.0.1:3000";
const PROMPTS = [
  "Show me sales by quarter for the last 3 years",
  "A stock count form for Aisle 4 — pick an item, enter the counted quantity, submit it. Show recent counts.",
];
const RUNS = Number(process.env.RUNS ?? 3);

async function once(prompt: string, model: string) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/generate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });
  const text = await res.text();
  const events = text.split("\n\n").filter((l) => l.startsWith("data:"))
    .map((l) => JSON.parse(l.slice(5)));
  const done = events.find((e) => e.stage === "done");
  const err = events.find((e) => e.stage === "error");
  const repaired = events.some((e) => e.stage === "repairing");
  const validated = events.find((e) => e.stage === "validated");
  const ms = Date.now() - t0;

  if (!done) return { ok: false, ms, err: err?.detail ?? "no done event", repaired };

  const html = await (await fetch(`${BASE}/a/${done.slug}/`)).text();
  const external = (html.match(/src="http|href="http|cdn\./g) ?? []).length;
  const svg = (html.match(/<svg|createElementNS/g) ?? []).length;
  const calls = [...new Set(html.match(/\.\/api\/[qw]\/[\w-]+/g) ?? [])];

  // Exercise every DECLARED read. Apps may build fetch URLs dynamically, so the
  // manifest is the only reliable list of what the app can call.
  const manifest: any = await (await fetch(`${BASE}/a/${done.slug}/manifest`)).json();
  const probes: string[] = [];
  for (const q of manifest.queries ?? []) {
    const r = await fetch(`${BASE}/a/${done.slug}/api/q/${q.id}`);
    const j: any = await r.json().catch(() => ({}));
    probes.push(`${q.id}:${r.status === 200 ? (j.count ?? "?") + "rows" : "ERR" + r.status}`);
  }

  return {
    ok: true, ms, slug: done.slug, title: done.detail, repaired,
    declared: validated?.detail, kb: +(html.length / 1024).toFixed(1),
    external, svg, probes: probes.join(" "),
  };
}

const model = process.env.MODEL ?? "deepseek";
console.log(`rehearsing ${PROMPTS.length} prompts x ${RUNS} runs on model=${model}\n`);
for (const [i, p] of PROMPTS.entries()) {
  console.log(`--- prompt ${i + 1}: ${p.slice(0, 60)}…`);
  for (let r = 0; r < RUNS; r++) {
    const res: any = await once(p, model);
    if (res.ok) {
      console.log(`  run${r + 1} OK ${(res.ms / 1000).toFixed(1)}s  ${res.kb}KB  svg:${res.svg}  ext:${res.external}  ${res.repaired ? "REPAIRED  " : ""}${res.declared}`);
      console.log(`         probes: ${res.probes}   /a/${res.slug}/`);
    } else {
      console.log(`  run${r + 1} FAIL ${(res.ms / 1000).toFixed(1)}s  ${res.err}`);
    }
  }
}
