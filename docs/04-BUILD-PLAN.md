# Build plan — 18:05 to 22:45

Judging 22:45. Deliverable: **90-second video + GitHub URL**. Optional live demo.

## Roles

| Role | Owns | Directory |
|---|---|---|
| **A — Platform spine** (Caleb) | server, routes, SSE, SQLite, UI shell, app list. Owns `main`, does all merges. | `server/`, `db/`, `ui/` |
| **B — Generator** | system prompt, artifact validation + repair, model selector | `generator/` |
| **C — Connector + gateway** | ERPNext connector, gateway, audit log, forked ERPNext + synthetic data | `connectors/`, `gateway/`, `infra/` |
| **D — Demo production** | tunnel, script, filming, editing, pitch, README | `docs/`, no code |

**Headcount scaling.** 1 extra → D. 2 extra → B, D. 3 extra → B, C, D.
**Do not put a fourth engineer on code.** Clean seams beat raw headcount at this
timescale.

**Placement questions, 30 seconds each:**
- "Shipped prompt-output parsing that had to not break?" → **B**
- "Comfortable in Docker plus a REST API you've never seen?" → **C**
- "Can you edit video and present in English?" → **D**, immediately

## Rules

1. **Contracts before code.** Everyone reads `03-CONTRACTS.md` aloud, once, in
   the first 15 minutes.
2. **Disjoint files.** Nobody edits another role's directory. Ask the owner.
3. **Mocks from minute one.** B gets a fake gateway with canned rows. A gets a
   fake generator returning a hardcoded artifact. C serves fixtures until
   ERPNext is healthy. Nobody waits on anybody.
4. **A merges, always.** Short branches, PRs to A. No direct pushes to `main`.
5. **No refactoring someone else's code.** Not once, not "quickly."

## Timeline

**18:05–18:25 — Setup (all together)**
- A: `gh repo create`, push docs, scaffold empty dirs, commit
- C: kick off the forked ERPNext build **first thing** — it bakes in background
- D: `tailscale funnel` enabled, hostname confirmed loading on a phone
- All: read the contracts aloud. Assign roles.

**18:25–19:30 — Parallel build against mocks**
- A: `/`, `POST /generate` with SSE, `GET /a/:slug`, SQLite schema, app list
- B: system prompt + artifact validation; iterate against saved fixtures
- C: ERPNext connector + gateway serving fixture rows; site + demo data
- D: draft the 90-second script, line up the phone, scout a filming spot

**19:30 — INTEGRATION 1 (hard checkpoint)**
End-to-end with stub generator *and* stub gateway. A fake app must serve at a
real public URL. **If this slips past 20:00, cut scope — not quality.**

**19:30–20:45 — Make it real**
- B's real generation replaces the stub
- C's real ERPNext queries replace the fixtures
- A: audit view, model selector UI
- D: script locked, test footage shot

**20:45–21:00 — INTEGRATION 2**
Full loop live: prompt → real generation → real ERP data → public URL → phone.

**21:00 — FEATURE FREEZE. Hard.**
Whatever works, works. Everyone moves to demo support. *This is the checkpoint
teams break and regret. Agree to it now, while calm.*

**21:00–21:45 — Polish only**
Make the two demo prompts bulletproof. Pre-generate the third app so it sits in
the list. Rehearse the run twice.

**21:45–22:15 — Film**
**22:15–22:40 — Edit, README, submit**
**22:45 — Judging**

## Cut lines

| Time | If not working, cut it |
|---|---|
| 19:45 | Forked ERPNext → fall back to seeded Postgres SoR |
| 20:30 | Write-back action → demo read-only, say write is next |
| 21:00 | Model selector → claim it in the pitch, show the code |
| 21:00 | Audit view → describe it verbally over the app list |
| 22:00 | `docker compose up` install shot → open on the prompt instead |

Never cut: **prompt → URL → working app on a phone.** That is the product. If
only that works, you still have a demo.
