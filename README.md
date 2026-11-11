# minicloud

### ▶ [Watch the 90-second demo](https://youtu.be/YSSxReDxWs0)

**The app factory that lives inside your network.**

Describe the internal tool you need. Get a working web app at a shareable link in
seconds — wired to your real systems of record, running entirely on your own
hardware.

```
"Show me sales by quarter for the last 3 years"
        ↓  15 seconds
https://your-appliance/a/sales-by-quarter-rfavgi/
```

## Why

Most people at work don't sit at a desk. The software that runs physical work —
stock counts, maintenance checks, work orders — is decades old, and the gap
between "I need a tool for this" and "IT shipped it" is measured in quarters.
Meanwhile the data those tools need already sits in an ERP nobody on the floor
can query.

Generic prompt-to-app tools don't solve this: they have no connection to the
system of record, and they're SaaS, so the data has to leave the building. For a
manufacturer, hospital, or defense supplier, that's a non-starter.

minicloud is a **self-hosted appliance**. One stack on the customer's own on-site
VPS: the generating agent, the runtime that serves the apps, the credential
gateway that holds the connections, and a model selector that works with a hosted
frontier API *or* a model running on the box next to it.

## The security thesis

**A generated app's declared manifest is its capability grant.**

- The agent never receives a credential.
- The generated app never receives a credential.
- The app can call *only* the queries and actions its own manifest declares.
  Anything else returns 404 — it does not exist.
- Every data call is logged per app, and visible in the UI.

That's what makes it safe to serve model-authored code instantly, without
reviewing it. It also means the hosted-model posture never ships customer data
anywhere: the generator only ever sees doctype names, never rows.

## Architecture

```
Browser ──prompt──▶ Generator ──artifact──▶ App Runtime ──▶ /a/:slug/
   │                (hosted or                  │
   │                 on-prem model)             │
   └──open link─────────────────────────────────┘
                                                │
        Generated app ──./api/q/:id──▶ Credential Gateway ──▶ ERPNext
                                       (injects creds,          Postgres
                                        enforces manifest,      REST / CSV
                                        writes audit log)
```

- **Sandbox mode** (default): the artifact is a single self-contained HTML file
  served from the runtime. Deploy = insert a row, register a slug. Sub-second,
  no build, no container.
- **Dedicated mode** (roadmap): apps that outgrow one file get promoted to a real
  container with its own subdomain via bundled Coolify — same manifest, same
  gateway, same audit log.

See [`docs/02-ARCHITECTURE.md`](docs/02-ARCHITECTURE.md) for the full design,
including the agent-orchestration path through Paseo and the three model
placement postures.

## Stack

Bun + SQLite. **Zero npm dependencies** — `Bun.serve`, `bun:sqlite`, and `fetch`.
Generated apps are dependency-free single HTML files, so they work on an
appliance with no internet.

## Security posture

The gateway holds every credential and is deliberately the only component that
does. It contains no model, executes no user-supplied code, and refuses any
query a manifest did not declare — small and boring is the point.

A generated app is given private data and is itself untrusted content, but has
**no way to talk out**: no credentials, no outbound reach, and a capability set
fixed before it runs. That breaks the third leg of the exfiltration trifecta
that makes agentic AI dangerous. See `docs/07-MARKET.md`.

## Run it

```bash
cp .env.example .env     # ERP_BASE_URL, ERP_API_KEY, ERP_API_SECRET, DEEPSEEK_API_KEY
bun server/index.ts      # http://localhost:3000
```

Bring up a synthetic ERPNext to develop against, then seed it:

```bash
cd infra/erp-demo && docker compose -p minicloud-erp up -d
docker compose -p minicloud-erp exec backend \
  bench new-site demo --mariadb-root-password admin --admin-password admin \
    --mariadb-user-host-login-scope='%' --install-app erpnext --set-default
bun scripts/seed-erp.ts
```

## Layout

| Path | What |
|---|---|
| `server/` | HTTP routes, SSE generation stream, SQLite, UI |
| `generator/` | Prompt → artifact, validation + repair, model registry |
| `connectors/` | ERPNext read/write |
| `gateway/` | Manifest enforcement, credential injection, audit log |
| `infra/erp-demo/` | Synthetic ERPNext for development |
| `scripts/seed-erp.ts` | Three years of synthetic sales data |
| `docs/` | Product spec, architecture, contracts, build plan, pitch, video script, market research |

Built at **c0mpiled-18: YC Startup School Hackathon, Taipei**, 2026-11-11,
under YC RFS *"AI for the Air-Gapped Economy."*

## License

minicloud is free software: you can redistribute it and/or modify it under the
terms of the **GNU General Public License v3.0** as published by the Free
Software Foundation. See [`LICENSE`](LICENSE) for the full text.

Copyright © 2026 Caleb Bergman
