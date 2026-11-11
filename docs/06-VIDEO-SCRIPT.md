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
gateway, same rules. Half of enterprises now call data sovereignty their top
constraint — and that number is climbing."*

**On-screen caption:** `data sovereignty "very important": 42% → 51% · BARC 2026`

> This is what turns it from a clever hack into a product someone deploys.
> Two different ERPs is a stronger claim than one, and it is true.
>
> **One statistic, and only here.** In 90 seconds the demo is the argument; a
> second number competes with your best footage. Use BARC rather than the
> punchier 62% sovereignty figure — BARC is an independent analyst firm, while
> the 62% is an Arqit-commissioned survey, and "who ran that study?" is exactly
> what a founder-judge asks. The rising trend does more work than the level.

---

### 6 · 1:09–1:21 — On-prem, proven by the hardware

**Visual:** change the model dropdown to `Devstral 24B — on-prem (RTX 5090)`.
Hit Build it. A green meter appears in the build panel and the bar pegs:

```
inference running on this appliance · NVIDIA GeForce RTX 5090 · 97% · 30.4 / 31.8 GB
```

Hold on that for a beat. **Jump cut.** The finished app appears.

**On-screen card over the cut:** `generated on-prem · no API call · 2m45s`

**VO:** *"And it can run inside your building. That's a GPU on the appliance, not
an API. Nothing leaves."*

> **The wifi-off stunt is out** — the appliance is on a machine at Caleb's
> apartment, and he is filming from the venue, so there is no cable to pull.
> The GPU meter is better anyway: a utilisation bar pegging while an app is
> written is harder to fake than a wifi icon going dark, and it is literally the
> claim being made.
>
> Say the 2m45s out loud. A number you admit to reads honest; a suspiciously
> fast cut reads edited.
>
> **A stronger line is available if you want it.** The appliance really is in a
> different building from the venue, reached over a private network. *"That box
> is in my apartment. I'm across town. The apps work, and the model that wrote
> them never left that machine."* That is a truer air-gap demonstration than any
> toggle, and it is true tonight.

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
- **On-prem generation is slow on the night:** the GPU meter is the proof, not
  the finish. Film the meter pegged, cut, and show the finished app. You do not
  need to sit through 2m45s of footage.
- **Funnel drops:** fall back to `localhost:3000`. The link story survives; you
  just don't get the phone shot.
- **ERPNext write fails:** drop beat 3 to read-only and say write-back is next.
  Do not try to fix ERPNext on camera.

## Where everything actually runs

The whole appliance — minicloud, ERPNext, Odoo, the WebDAV share, Ollama and the
RTX 5090 — is on `caleb-manjarotop`, the machine at Caleb's apartment. Filming
happens from the venue, over the Tailscale funnel at
`https://caleb-manjarotop.taile06653.ts.net`.

This is a feature, not a limitation: the shareable link demonstrably works from a
different building, which is a better proof than localhost would have been.

## If you are behind at 22:00

Cut beats 5 and 6. Keep 1, 2, 3, 4, 7. That is still a complete argument:
a tool appears from a sentence, it writes to a real ERP, it is sandboxed and
audited, and here is a link you can scan.

## If a judge pushes on security

Do **not** say air-gapping makes you unhackable — it does not, and minicloud is
not air-gapped in this demo. Say:

> *"Every AI tool you adopt is a new path for your data to leave. An agent
> becomes an exfiltration channel when it has private data, untrusted content,
> and a way to talk out. The generated app here has the first two and not the
> third — no credentials, no outbound reach, and a capability set fixed before it
> ran."*

Supporting facts, with sources, are in `07-MARKET.md`. The sharpest is Unit 42's
2026 report of a threat actor running an agent framework **on DeepSeek** to
orchestrate intrusions with confirmed exfiltration — which pairs with our model
selector: *"that's why you can point this at a model in your own building."*

Do not claim AI is running autonomous attacks. The International AI Safety
Report 2026 says fully autonomous end-to-end attacks have not been reported.
"AI is collapsing the cost and time of exploitation" is supported; "AI is hacking
by itself" is not.

## Positioning line for the submission text

> minicloud is a self-hosted appliance that turns a sentence into a working
> internal app. It runs on the customer's own hardware, reads and writes their
> real systems of record through a credential gateway the generated app never
> sees, and can generate using a model running in the same building.
> YC RFS Winter 2027 — AI for the Air-Gapped Economy.
