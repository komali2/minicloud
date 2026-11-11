# minicloud — Product Spec

**Tagline:** The app factory that lives inside your network.

**One-liner:** Describe the internal tool you need, get a working web app at a
shareable link in seconds — wired to your real systems of record, running
entirely on your own hardware.

## The problem

Most people at work do not sit at a desk. The software that runs physical work
— stock counts, maintenance checks, work orders, fleet logs — is decades old,
and the gap between "I need a tool for this" and "IT shipped it" is measured in
quarters. Meanwhile the data those tools need already exists in an ERP nobody
on the floor can query.

Generic prompt-to-app tools don't solve it: they have no connection to the
system of record, and they're SaaS, so the data would have to leave the
building. For a manufacturer, hospital, or defense supplier, that's a
non-starter.

## The product

A self-hosted appliance. One stack deployed to the customer's own on-site VPS,
bundling:

- an agent that generates small internal applications from a plain-language request
- a runtime that serves each generated app instantly at its own URL
- a credential gateway holding pre-established connections to corporate systems
  (ERPNext first; Postgres, REST, CSV to follow)
- a model selector that works with a hosted frontier API *or* a local model, so
  the whole loop can run with zero egress

## Core user flow

1. A salesperson / supervisor / ops lead opens minicloud and types a request:
   *"chart of sales by quarter for the last 3 years"* or *"a stock count form
   for aisle 4."*
2. The agent produces an app and a **manifest** declaring exactly which data it
   needs.
3. The platform persists it, registers a route, and returns **a URL**.
4. They click it. It works. They send the link to a colleague, who opens it on a
   phone.

The user never sees HTML, a repo, a build, or a deploy. They see a chat box and
get back a link.

## The security thesis (the real product)

**A generated app's declared manifest is its capability grant.**

- The agent never receives a credential.
- The generated app never receives a credential.
- The app can call *only* the queries and actions its own manifest declares.
  Anything else is not reachable — not denied at the edge, but absent.
- Every data call is logged, per app, visible in the UI.

So the pitch sentence is: *an agent built this app, it reads live ERP data, it
never had your credentials, the app can only touch what its manifest declares,
and here is the log of everything it did.*

## MVP scope (tonight)

- Chat box → generated app → shareable URL
- ERPNext connector: read queries + one write action
- Gateway with manifest-scoped execution and audit log
- App list with the audit view
- Model selector, demonstrated against a local endpoint

## Explicit non-goals (tonight)

- Auth on generated apps (unguessable slug only)
- Multi-step / agentic apps
- Container-per-app isolation ("Dedicated mode" — see architecture)
- Local model lifecycle management
- Multi-tenancy. The appliance is single-tenant by design; that is the point.

## Positioning

Pitched under YC RFS **Winter 2027 — "AI for the Air-Gapped Economy"**: frontier
AI deployed fully inside the customer's walls. Demoed with frontline /
warehouse scenarios, which also speaks to Fall 2026's *"New Operating Systems
for the Physical World"* — tools for the people who don't sit at desks.
