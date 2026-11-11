# 90-second video — shot list

**Deliverable:** 90-second demo video + GitHub URL. Optional live demo at judging.
**Audience:** ~15 YC founder-judges, late at night, after many other videos.

Spoken narration below is ~130 words. That is deliberate: roughly 2.5 words per
second leaves real silence over the visual beats. Do not fill it.

**Rules for the edit:** no title card, no team intro, no architecture diagram, no
talking head. Open on the product. The first frame should make a judge put their
phone down.

---

## The seven beats

### 1 · 0:00–0:07 — Hook (physical)

**Visual:** a hand holding a phone, in front of shelving / stacked boxes /
anything at the venue that is not a desk. On the phone: the Aisle 4 Stock Count
form, already open.

**VO:** *"This tool didn't exist a minute ago. Nobody wrote it, and nobody filed
a ticket."*

> Everyone else will open on a screen recording. Three seconds of a real hand and
> a real phone makes yours look like a different category of thing. If you can't
> find a spot, any neutral background still beats a screen capture.

---

### 2 · 0:07–0:25 — Generate, live, with the timer running

**Visual:** full screen. Type the prompt. Hit **Build it**. Let the build panel
run — spinner, timer climbing, `declared` line appearing, KB counting up — then
the URL and QR land. Click the URL; the chart fills the screen.

**Type exactly:**
```
Show me sales by quarter for the last 3 years
```

**VO:** *"You describe the tool you need. An agent builds it, declares exactly
which data it's allowed to touch, and you get a link."*

> Do not speak over the timer. Let it tick. The number landing at ~14s is the
> proof; narration would only dilute it.

---

### 3 · 0:25–0:45 — The write-back, one continuous take

**Visual:** split screen. **Left:** the phone, running the Aisle 4 Stock Count
form. **Right:** ERPNext's Stock Entry list at `localhost:8081`. Pick an item,
type a quantity, submit. The record appears on the right. **No cut.**

**VO:** *"This one writes back. A stock count on the floor, landing as a
submitted document in the company's ERP. Not a mock — that's ERPNext."*

> **This is the credibility shot.** Every toy prompt-to-app demo in the room can
> show a pretty page; none can show a submitted document landing in a real ERP.
> If only one beat survives the edit, keep this one. One take, no cuts — a cut
> here is exactly where a skeptical judge assumes the trick is.

---

### 4 · 0:45–0:57 — The security thesis, on screen

**Visual:** the app's `/audit` page. Hold on **Declared capabilities** (the
read/write table), then scroll once into the call log with its green `ok` rows,
row counts and millisecond timings.

**VO:** *"The agent never saw a credential. The app can only touch what its
manifest declares — everything else returns 404. And every call is logged."*

---

### 5 · 0:57–1:09 — IT plugs in the systems

**Visual:** `/admin`. Four connections, each with a green tick: ERPNext
authenticated, the shared drive with its row count, the NAS, Odoo. Scroll to the
connector catalogue so the type cards are visible.

**VO:** *"IT plugs in the systems. ERPNext, Odoo, a NAS, any internal API. Same
gateway, same rules."*

> This is what turns it from a clever hack into a product someone deploys.
> Two different ERPs is a stronger claim than one, and it is true.

---

### 6 · 1:09–1:21 — On-prem (switch the wifi off on camera)

**Visual:** turn wifi **off**, visibly, in the menu bar. Change the model
dropdown to `Devstral 24B — on-prem (RTX 5090)`. Hit Build it. **Jump cut.** The
finished app appears.

**On-screen card over the cut:** `generated on-prem · no internet · 2m45s`

**VO:** *"And it runs inside your building. Local model, no internet, nothing
leaves."*

> State the 2m45s. A number you admit to reads as honest; a suspiciously fast cut
> reads as edited. Film this against `localhost:3000`, not the tunnel — the
> tunnel needs the internet you just switched off.

---

### 7 · 1:21–1:30 — Close on the QR

**Visual:** the success panel's QR code, held full-frame for the last five
seconds. Small caption: **minicloud** — *the app factory inside your network*.

**VO:** *"minicloud. Scan it — the app's running right now."*

> Your product is a shareable link, so end by sharing it. A judge who scans gets
> your app, pulling live ERP data, on their own phone, while they're still
> sitting there. Leave the QR on screen during the live demo session too.

---

## Pre-roll checklist

- [ ] `cd ~/src/erp-local && docker compose down` — **real client data, must be off**
- [ ] `bun scripts/preflight.ts` passes 9/9
- [ ] `bun scripts/prune-apps.ts keep inactive-customers-8dnjeo` for a clean list,
      or keep two or three so it looks lived-in — but nothing broken
- [ ] Close every unrelated tab and terminal. Check scrollback for client data
- [ ] Phone on the funnel URL over **cellular**, proving it is really public
- [ ] Browser zoom up so text is legible when the video is scaled down
- [ ] Run both prompts once, end to end, before recording a frame

## If something breaks mid-record

- **Generation stalls:** cut, say *"here's one from a minute ago"*, open a
  pre-generated app. The apps already in the list are the safety net.
- **Funnel drops:** fall back to `localhost:3000`. The link story survives; you
  just don't get the phone shot.
- **ERPNext write fails:** drop beat 3 to read-only and say write-back is next.
  Do not try to fix ERPNext on camera.

## If you are behind at 22:00

Cut beats 5 and 6. Keep 1, 2, 3, 4, 7. That is still a complete argument:
a tool appears from a sentence, it writes to a real ERP, it is sandboxed and
audited, and here is a link you can scan.

## Positioning line for the submission text

> minicloud is a self-hosted appliance that turns a sentence into a working
> internal app. It runs on the customer's own hardware, reads and writes their
> real systems of record through a credential gateway the generated app never
> sees, and can generate using a model running in the same building.
> YC RFS Winter 2027 — AI for the Air-Gapped Economy.
