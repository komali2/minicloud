import type { Artifact, Connection, Query, Action } from "../server/types";
import { getModel, type ModelSpec } from "./models";
import { SYSTEM_PROMPT, connectionHints } from "./prompt";

export type Progress = (stage: string, detail?: string) => void;

class GenerationError extends Error {}

async function callModel(spec: ModelSpec, messages: any[], signal?: AbortSignal): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (spec.keyEnv) {
    const key = process.env[spec.keyEnv];
    if (!key) throw new GenerationError(`Missing ${spec.keyEnv} for model "${spec.id}"`);
    headers.Authorization = `Bearer ${key}`;
  }
  const res = await fetch(`${spec.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({
      model: spec.model,
      messages,
      max_tokens: 8000,
      temperature: 0.2,
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new GenerationError(`Model ${spec.id} returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json: any = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new GenerationError(`Model ${spec.id} returned no content`);
  return text;
}

/** Strip markdown fences some models add despite instructions. */
function stripFences(s: string): string {
  return s.replace(/^\s*```[a-zA-Z]*\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
}

function parseArtifact(raw: string): Artifact {
  const text = raw.replace(/\r\n/g, "\n");
  const mIdx = text.indexOf("===MANIFEST===");
  const hIdx = text.indexOf("===HTML===");
  if (mIdx === -1 || hIdx === -1 || hIdx < mIdx) {
    throw new GenerationError("Response did not contain the ===MANIFEST=== / ===HTML=== markers.");
  }
  const manifestRaw = stripFences(text.slice(mIdx + "===MANIFEST===".length, hIdx));
  const html = stripFences(text.slice(hIdx + "===HTML===".length));

  let manifest: any;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (e) {
    throw new GenerationError(`Manifest was not valid JSON: ${(e as Error).message}`);
  }

  if (typeof manifest.title !== "string" || !manifest.title.trim())
    throw new GenerationError("Manifest is missing a non-empty string title.");
  if (!Array.isArray(manifest.queries))
    throw new GenerationError("Manifest.queries must be an array.");

  const queries: Query[] = manifest.queries.map((q: any, i: number) => {
    if (!q || typeof q.id !== "string") throw new GenerationError(`queries[${i}] needs a string id.`);
    if (typeof q.connection !== "string") throw new GenerationError(`queries[${i}] needs a connection id.`);
    if (typeof q.doctype !== "string") throw new GenerationError(`queries[${i}] needs a doctype.`);
    if (!Array.isArray(q.fields) || q.fields.some((f: any) => typeof f !== "string"))
      throw new GenerationError(`queries[${i}].fields must be an array of strings.`);
    return {
      id: q.id, connection: q.connection, doctype: q.doctype, fields: q.fields,
      filters: Array.isArray(q.filters) ? q.filters : undefined,
      limit: Number.isFinite(q.limit) ? Math.min(Number(q.limit), 2000) : 500,
      order_by: typeof q.order_by === "string" ? q.order_by : undefined,
      parent_doctype: typeof q.parent_doctype === "string" ? q.parent_doctype : undefined,
      params: Array.isArray(q.params) && q.params.every((x: any) => typeof x === "string") ? q.params : undefined,
    };
  });

  const actions: Action[] = (Array.isArray(manifest.actions) ? manifest.actions : []).map((a: any, i: number) => {
    if (!a || typeof a.id !== "string") throw new GenerationError(`actions[${i}] needs a string id.`);
    if (typeof a.connection !== "string") throw new GenerationError(`actions[${i}] needs a connection id.`);
    if (typeof a.doctype !== "string") throw new GenerationError(`actions[${i}] needs a doctype.`);
    if (!Array.isArray(a.allowed_fields) || a.allowed_fields.some((f: any) => typeof f !== "string"))
      throw new GenerationError(`actions[${i}].allowed_fields must be an array of strings.`);
    return {
      id: a.id, connection: a.connection, doctype: a.doctype, op: "create",
      allowed_fields: a.allowed_fields, body_template: a.body_template,
    };
  });

  if (html.length < 200 || !html.includes("<"))
    throw new GenerationError("HTML section was empty or not markup.");

  const ids = new Set<string>();
  for (const q of queries) {
    if (ids.has(q.id)) throw new GenerationError(`Duplicate query id "${q.id}".`);
    ids.add(q.id);
  }
  for (const a of actions) {
    if (ids.has(a.id)) throw new GenerationError(`Duplicate id "${a.id}" between queries and actions.`);
    ids.add(a.id);
  }

  const slug_hint = typeof manifest.slug_hint === "string" && manifest.slug_hint.trim()
    ? manifest.slug_hint : manifest.title;

  return { title: manifest.title.trim(), slug_hint, queries, actions, html };
}

export async function generate(
  prompt: string,
  conns: Connection[],
  modelId: string,
  onProgress: Progress = () => {},
  signal?: AbortSignal
): Promise<{ artifact: Artifact; model: string }> {
  const spec = getModel(modelId);
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `AVAILABLE CONNECTIONS\n\n${connectionHints(conns)}\n\nTHE EMPLOYEE'S REQUEST\n\n${prompt}` },
  ];

  onProgress("thinking", spec.local ? `Generating on-premises with ${spec.label}` : `Generating with ${spec.label}`);
  let raw = await callModel(spec, messages, signal);

  try {
    const artifact = parseArtifact(raw);
    onProgress("validated", `${artifact.queries.length} query/queries, ${artifact.actions.length} action(s) declared`);
    return { artifact, model: spec.id };
  } catch (err) {
    const msg = (err as Error).message;
    onProgress("repairing", `Output rejected: ${msg} — asking the model to fix it`);
    messages.push({ role: "assistant", content: raw.slice(0, 6000) });
    messages.push({
      role: "user",
      content: `Your previous response was rejected by the validator:\n\n${msg}\n\nReply again with the COMPLETE app in the exact required format. Start your reply with ===MANIFEST=== and include the full ===HTML=== section. No code fences, no commentary.`,
    });
    raw = await callModel(spec, messages, signal);
    const artifact = parseArtifact(raw);
    onProgress("validated", `${artifact.queries.length} query/queries, ${artifact.actions.length} action(s) declared (after repair)`);
    return { artifact, model: spec.id };
  }
}
