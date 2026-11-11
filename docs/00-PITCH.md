# Pitch + 90-second video script

## Positioning

**YC RFS Winter 2027 — "AI for the Air-Gapped Economy."** Frontier AI deployed
fully inside the customer's walls.

Demoed with frontline / warehouse scenarios, which also speaks to Fall 2026's
*"New Operating Systems for the Physical World"* — software for the people who
don't sit at desks. Lead with air-gapped (it's the truer fit for an on-prem
appliance), gesture at physical-world with the demo itself.

## The three sentences that matter

1. *"Describe the internal tool you need; get a working app at a shareable link
   in seconds."*
2. *"It runs on a box inside your network, reads your real ERP, and nothing
   leaves the building."*
3. *"The agent never saw your credentials, and the app can only touch what its
   manifest declares — here's the log."*

## Shot list (90 seconds)

| Time | Shot | Note |
|---|---|---|
| 0:00–0:08 | Problem. "Most people at work don't sit at a desk. The software running physical work is twenty years old, and IT has a six-month queue." | Voice over a shot of the chat box |
| 0:08–0:15 | `docker compose up` on a clean box → appliance answering on the LAN | **Stretch shot. Film last. Cut at 22:00 if absent.** |
| 0:15–0:35 | Type *"sales by quarter for the last 3 years"* → ~3s → URL appears → click → chart with real ERP data | The generation must feel instant |
| 0:35–0:55 | Type *"stock count form for Aisle 4"* → URL → **open it on a phone** → submit a count → cut to the record now in ERPNext | The write-back is what separates you from read-only BI toys |
| 0:55–1:10 | Audit view: every data call that app made. "The agent never had your credentials. The app can only touch what its manifest declares." | The security thesis, on screen |
| 1:10–1:20 | Model selector → `local/qwen36-35b` → generate again, works | "Nothing left the building." |
| 1:20–1:30 | Close: "minicloud — the app factory that lives inside your network." | Name the RFS category |

## Direction

- **Open on the product, not a title card.** You have 90 seconds; spend none of
  them on branding.
- **Show the URL being clicked.** The link *is* the product. Don't describe it.
- **The phone shot is the money shot.** A real device, a real public URL, a real
  record landing in the ERP. That is what a judge remembers at midnight.
- No slides. No architecture diagram. No team intro.

## If a judge asks

- *"Isn't this just a prompt-to-app toy?"* → The gateway. Toys have no system of
  record and no credential boundary. Show the audit log.
- *"Why not containers per app?"* → We have that — Dedicated mode, bundled
  Coolify, same manifest and gateway. It's the wrong default: minutes instead of
  seconds, for a 200-line form.
- *"Does my data go to a model provider?"* → The generator sees doctype names,
  never records. And you can run the model on-prem; we demoed that.
- *"What stops the generated app doing something malicious?"* → It has no
  credentials and no outbound reach. Its declared manifest is the entire
  capability set, fixed before it ever runs.
