# minicloud — Architecture

## Shape

A single appliance: one `docker compose` stack the customer runs on their own
on-site VPS. No control plane in our cloud. No data egress required.

```
                    customer's network
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌────────────┐   prompt    ┌─────────────────────────┐  │
  │  │  Browser   │────────────▶│   minicloud appliance   │  │
  │  │ (phone or  │◀────────────│                         │  │
  │  │  desktop)  │   app URL   │  ┌───────────────────┐  │  │
  │  └────────────┘             │  │ Generator         │  │  │
  │        │                    │  │  model selector ──┼──┼──┼──▶ local model
  │        │  GET /a/:slug      │  └───────────────────┘  │  │    (5090 / on-prem)
  │        ▼                    │  ┌───────────────────┐  │  │       or hosted API
  │  ┌────────────┐             │  │ App Runtime       │  │  │
  │  │ Generated  │             │  │  serves artifacts │  │  │
  │  │ app (HTML) │             │  └───────────────────┘  │  │
  │  └─────┬──────┘             │  ┌───────────────────┐  │  │
  │        │ /api/q /api/w      │  │ Credential        │  │  │
  │        └───────────────────▶│  │ Gateway + Audit   │──┼──┼──▶ ERPNext
  │                             │  └───────────────────┘  │  │    Postgres
  │                             │  ┌───────────────────┐  │  │    REST / CSV
  │                             │  │ SQLite            │  │  │
  │                             │  └───────────────────┘  │  │
  │                             └─────────────────────────┘  │
  └──────────────────────────────────────────────────────────┘
```

## Components

**Generator.** Prompt + connection schema hints → `Artifact` (see contracts).
Tonight: one direct model API call behind a `Generator` interface. The interface
is the point — see "Agent orchestration" below.

**App Runtime.** Serves each generated artifact from SQLite at `/a/:slug`.
"Deploy" is: insert a row, register a slug. Sub-second, no build, no container.
This is a deliberate architectural choice, not a shortcut: container-per-app
orchestration is the wrong cost model for a 200-line form. See "Dedicated mode."

**Credential Gateway.** The security boundary. Holds connection credentials,
executes only manifest-declared queries and actions, logs everything. Neither
the agent nor the generated app ever holds a secret.

**Store.** One SQLite file. `connections`, `apps`, `audit_log`.

## Why the manifest is the sandbox

Conventional sandboxing asks "can this code be trusted with network access?"
We sidestep it. The generated app has no credentials and no outbound reach — it
can only call back into the gateway, and the gateway will only execute the
specific queries the artifact declared at generation time. The capability set is
fixed before the app ever runs, and it is human-readable.

This means an untrusted, model-authored artifact is safe to serve without
inspecting its code, which is what makes instant deploy acceptable at all.

## Sandbox mode vs Dedicated mode

**Sandbox mode (tonight, and the default forever).** Artifact served from the
runtime process. Instant, zero isolation cost, correct for the 95% case: forms,
charts, lookups, small dashboards.

**Dedicated mode (roadmap).** When an app outgrows a single HTML file — needs a
background job, a websocket, its own dependencies, a scheduled task — the
appliance bundles **Coolify** and promotes the app to a real container with its
own subdomain and TLS. Same manifest, same gateway, same audit log; only the
execution substrate changes. The gateway contract is what makes this promotion
transparent to the app.

We deliberately did not build Dedicated mode first. A build-and-deploy pipeline
in the critical path of "describe a tool, get a link" trades seconds for
minutes and buys nothing for the apps people actually ask for.

## Agent orchestration (roadmap)

Tonight's generator is a single model call, which is right for one-shot
artifacts. The intended production path routes generation through **opencode**
into **Paseo**, giving:

- multi-step agents that can iterate on an app, read back errors, and retry
- per-connection agent profiles (a different model for ERP reasoning than for UI)
- parallel generation of several candidate apps, with the user picking
- long-running agents for apps that need ongoing maintenance

The `Generator` interface is the seam. Swapping a direct API call for a Paseo
agent spawn changes one module.

## Model placement and the air gap

The model selector takes any OpenAI-compatible endpoint. Three deployment
postures:

1. **Hosted** — appliance calls a frontier API. Fastest, prompt text leaves.
2. **Hybrid** — hosted model for generation, but the gateway guarantees no
   *customer data* is ever in a prompt (schema hints only, never rows).
3. **Fully local** — an on-prem model serves generation. Nothing leaves. This is
   demonstrated tonight against a local llama.cpp endpoint.

Posture 2 is the under-appreciated one and falls out of the architecture for
free: because the generator only ever sees doctype names, not records, even the
hosted posture never ships customer data to a third party. Managing the local
model's lifecycle (pull, serve, upgrade) is explicitly roadmap, not MVP.

## Threat model notes

- Generated HTML is untrusted. It is served from the appliance origin, so it
  shares an origin with other apps — acceptable for a single-tenant internal
  appliance, and the fix (per-app subdomain) is Dedicated mode.
- Slugs are unguessable, which is the only access control in MVP. Group-scoped
  SSO is the first post-MVP security item.
- Write actions are field-allowlisted at the gateway, so a malicious artifact
  cannot widen its own write scope.
