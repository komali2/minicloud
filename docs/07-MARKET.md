# Market Research — Self-Hosted App Generator for the Air-Gapped Economy

*Compiled 2026-11-11 for the YC Startup School Hackathon pitch. Every figure below is sourced with a named publisher and year. Numbers I could not verify are listed at the end — treat those as gaps, not facts.*

---

## The three numbers for the video

1. **Gartner puts the low-code development market at $44.5 billion in 2026, growing ~19% a year** — the single most defensible market-size anchor for "businesses are buying tools that turn plain language into working apps." *(Gartner, 2026; cited via Caspio.)*

2. **80% of the global workforce — about 2.7 billion people — is deskless or frontline, yet those workers receive roughly 1% of the ~$300 billion spent annually on enterprise software.** This is the "most people at work don't sit at a desk" wedge. *(Emergence Capital origin, widely cited; 2021–2025.)*

3. **62% of enterprises cite data sovereignty and privacy risk as the single biggest factor slowing their AI projects in the public cloud.** This is the pain that pushes AI onto on-prem hardware — our product's core premise. *(Arqit-commissioned survey, February 2026 — note: vendor-sponsored, see caveat below.)*

---

## 1. On-premises / private / sovereign AI deployment

The honest headline: **there is no single clean "on-prem AI TAM" number.** Research firms slice "AI infrastructure," "edge AI," "AI inference," and "sovereign AI" differently, and the estimates vary by 3–4× across firms. Use the range, not one number.

- **On-premise is already the majority of AI infrastructure deployment.** Mordor Intelligence reports on-premise deployment held a **57.16% share of the AI infrastructure market in 2026**, with cloud forecast as the fastest-growing. *(Mordor Intelligence, 2026.)*
- **AI infrastructure: $135.81B (2024) → $394.46B (2030).** *(MarketsandMarkets, 2024–2025.)* ~19.5% implied CAGR.
- **AI infrastructure: $37.3B (2025) → $120.7B (2033), 17.4% CAGR.** *(Grand View Research, 2026.)* Note the wide gap vs. MarketsandMarkets — different scoping.
- **AI inference: $113.5B (2025) → $421.8B (2033).** *(Grand View Research, 2026.)* Inference is the spend that runs on the customer's box in our model.
- **Edge AI inference server market: $8.4B (2025) → $52.6B (2034), 22.6% CAGR.** *(DataIntelo, 2025.)* The closest named category to "on-prem inference hardware."
- **Sovereign AI market: $41.1B (2025), 20.2% CAGR (2026–2035).** *(Market.us, 2025.)*
- **Sovereign cloud market reached ~$80B in 2026, +35.6% YoY**, driven by regulated workloads moving off public cloud. *(NeuralTrust blog, 2026 — secondary source; treat as indicative.)*

**Caveat:** MarketsandMarkets, Grand View, Mordor, DataIntelo and Market.us are all legitimate syndicated-research firms, but their AI-infrastructure figures differ because "infrastructure" is defined inconsistently (chips vs. servers vs. software vs. services). Gartner and IDC are the gold standard here and I did not find a single published Gartner/IDC "on-prem AI" TAM with a clean public URL in the time available — flag that in the gap list.

---

## 2. Enterprises refusing public-cloud LLMs (data residency, sovereignty, security)

- **62% of respondents cite data sovereignty and privacy risk as the biggest factor slowing their AI projects in the public cloud.** *(Arqit press release, February 2026.)* **Caveat:** Arqit is a quantum-encryption vendor and this is a commissioned survey — it's on-message for Arqit. Real, citable, current, but flag as vendor-sponsored if challenged.
- **51% of organizations rate data sovereignty "very important," up from 42% in 2025; 76% expect its importance to keep rising.** *(BARC Data Sovereignty Survey, 2026.)* BARC is an independent analyst firm — this is the more defensible version of the same claim.
- **Healthcare:** "Security concerns top the list for more than 50% of respondents across sectors," and **only 45% of AI applications have moved into production.** *(Bain & Company, The Healthcare AI Adoption Index.)*
- **Healthcare is conservative on AI:** large health systems estimate **35% AI adoption today, and only ~40% expected over the next three years.** *(Menlo Ventures, 2025.)* Regulated buyers move slowly — a real tailwind for anything that removes the data-leakage objection.
- **Structural driver (not a number, but worth one line):** under the US **CLOUD Act**, European companies using a US-subject cloud or LLM provider remain reachable by US authorities even when the data sits in the EU — a permanent, legal reason data-residency-conscious buyers want on-prem. *(Harvey.ai analysis, 2026.)*
- **Manufacturing:** Deloitte's 2025 Smart Manufacturing survey found only **29% using AI/ML at the facility/network level and 24% with deployed generative AI** — i.e., the majority of manufacturers have *not* deployed, often citing data/IP concerns. *(Deloitte, 2025.)*
- **Defense:** I found no clean public percentage for defense-industry AI data-refusal. The sector's air-gapped posture is well documented but I could not source a single quotable survey number — listed under gaps.

---

## 3. Low-code / no-code / internal tooling, and the IT backlog

- **Low-code development market: $44.5B in 2026, ~19% YoY growth.** *(Gartner, 2026.)*
- **Low-code market: $58.2B by 2029, 14.1% CAGR.** *(Gartner Forecast Analysis.)*
- **70% of new applications will use low-code/no-code technology by 2025** (up from <25% in 2020). *(Gartner.)* **Dated flag:** this is a 2020–2021 Gartner prediction now 4–5 years old, but it's still the most-quoted stat in the category and is not disputed.
- **Citizen developers will outnumber professional developers ~4-to-1 at large enterprises**, and Gartner expects **non-IT developers to be ~80% of low-code tool users by 2026**. *(Gartner, 2022–2023.)*
- **Software-developer shortfall ~4 million unfilled roles by 2025.** *(IDC / U.S. Bureau of Labor Statistics, widely cited.)* **Dated flag:** the "by 2025" version is now a past prediction; the shortage persists but re-source a 2026 figure if challenged.
- **IT backlog:** "64% of IT departments report a backlog" of application requests. *(QuandaryCG blog.)* **Weak source** — a consultancy blog, underlying survey unclear; list under gaps rather than rely on it.

---

## 4. ERP & industrial software; ERPNext and Odoo installed base

- **ERP software market: $77.1B (2025) → $157.1B (2033), 9.5% CAGR.** *(Grand View Research, 2026.)*
- **Manufacturing ERP ~$23B in 2025 (~32% of the ~$73B ERP market), ~8% CAGR.** *(Gartner data via DecisionBrain aggregator, 2025.)* **Caveat:** aggregator; treat as indicative.
- **Odoo: ~16 million users worldwide** (Odoo publishes its own figures). Third-party sources range **12–16 million** depending on date and counting method (some count downloads/instances). *(Odoo / Frappe comparisons, 2025–2026.)*
- **ERPNext: 30,000+ companies/organizations use it** per Frappe Technologies. *(Frappe via secondary ERP comparison sources, 2025.)* **Caveat:** open-source download counts ≠ active production installs; treat 30k as a floor with an asterisk.

*Why this matters for the pitch: Odoo and ERPNext are both open-source and self-hostable, and both are named system-of-record targets for our product. The installed base is real and globally distributed, and neither platform has a native "type a sentence, get a custom internal app" layer — that's the gap we slot into.*

---

## 5. Comparable companies (funding / valuation)

- **Retool (YC W17)** — the closest analogue: "build internal software fast," now "an AI app builder that generates React apps on your data." **$3.2B valuation (Series C2, $45M); ~$120M ARR (Sacra estimate, Oct 2025, up from $90M end-2024); 10,000+ companies.** *(Techzine; Sacra; Retool, 2021–2026.)*
- **Airtable** — connected-apps / internal-tool platform: **$11B pre-money valuation (Series F, $735M, Dec 2021), ~$1.36B total raised.** *(Airtable newsroom, 2021.)* **Dated flag:** the $11B is a 2021 peak-valuation figure.
- **Mistral AI** — sovereign/private AI infrastructure: **€1.7B round at €11.5B+ valuation; a further $3.5B round positioned explicitly around "sovereign AI"; ~$400M run rate (Feb 2026).** *(aivancity; AI Business; Presenc.ai, 2025–2026.)*
- **Aleph Alpha** — Germany's sovereign-AI champion (SAP/Bosch/Schwarz Group-backed). Positioned as "Europe's answer to OpenAI," on-prem/sovereign deployment is its whole pitch. *(Multiple, 2023–2025.)* I did not verify a current post-2024 valuation figure — see gaps.

**Takeaway for the pitch:** capital is flowing hard into (a) internal-tool generation (Retool, Airtable) and (b) sovereign/private AI (Mistral, Aleph Alpha) — but almost no one is doing *both at once* on the customer's own box. That's the unoccupied quadrant.

---

## 6. Deskless / frontline workers

- **~80% of the global workforce — about 2.7 billion people — is deskless/frontline** (factory floors, warehouses, clinics, field service, retail, logistics). *(Skedulo; multiple deskless-workforce reports, 2021–2025.)*
- **Deskless workers receive only ~1% of the ~$300B spent annually on enterprise software.** *(Origin: Emergence Capital "So you want to build for deskless workers" thesis; widely repeated by infeedo, TalentLMS, and others, 2021–2025.)* **Caveat:** this is a VC marketing thesis, not a peer-reviewed figure — but it's been repeated for years without being refuted and reads as credible to a general audience. Flag as "industry-estimate" if a judge presses.
- **51% of deskless workers would leave their current job for more autonomy and flexibility** — supporting "these workers are underserved and undervalued." *(Skedulo State of Deskless Work Report, 2022.)* **Dated flag:** 2022.

---

## Numbers I could NOT verify

- **A single clean, citable IDC or Gartner "on-premises AI" or "private AI deployment" TAM with a public URL.** Found MarketsandMarkets, Grand View, Mordor, Market.us and DataIntelo figures (all above), but no gold-standard IDC/Gartner number I could link to directly. The on-prem/private/sovereign segment is real but not cleanly published by the top two firms.
- **Exact ERPNext active-user count.** Only "30,000+ companies" via Frappe (open-source, unverifiable). No independent count.
- **A defense-industry survey percentage** for "we refuse public-cloud AI for classified/IP reasons." The posture is documented; a clean quotable number is not.
- **The "64% of IT departments report a backlog" figure** — traces to a consultancy blog with an unclear underlying survey. Not reliable enough to put on a slide.
- **Aleph Alpha's current (post-2024) valuation** — the widely cited ~$500M/2023 raise and ~€1B+ valuation are dated; I could not confirm a fresh figure.
- **A named recent-YC-batch company doing on-prem/air-gapped AI app generation** specifically. Retool (W17) is the analogue, but I found no *recent* YC company squarely in "self-hosted app generator for air-gapped enterprises." If the judge asks "who else in YC is doing this," the honest answer is "closest is Retool, but nobody does it on-prem for air-gapped — that's the moat."
- **The "1% of enterprise software spend" deskless figure's primary source** — it's attributed to Emergence Capital but I could not locate the original primary publication, only secondary citations.

---

### Sourcing notes / honesty ledger

- **Gold-standard sources used:** Gartner (low-code), Grand View Research (ERP, AI infrastructure, inference), MarketsandMarkets (AI infrastructure), Bain, Deloitte, Menlo Ventures.
- **Vendor-sponsored, use with a caveat:** Arqit (62% sovereignty figure), Emergence Capital (deskless "1%").
- **Aggregators/secondary, treat as indicative:** Mordor on-prem share, DecisionBrain manufacturing-ERP, Caspio's Gartner citation, NeuralTrust sovereign-cloud, Market.us sovereign-AI, DataIntelo edge-inference.
- **Dated (>2024), flag if used:** Gartner "70% by 2025," "4M developer shortfall by 2025," Airtable $11B (2021), Skedulo 51% (2022), Emergence Capital "1%" (orig. ~2021).

---

# The security argument (added 2026-11-11, after the market pass)

## Do not say "air-gapped means you can't be hacked"

It is false and a security-literate judge will know it. Stuxnet crossed an air
gap; so do insider threat, removable media, and supply chain. Worse, **minicloud
is not air-gapped in the demo** — it runs on an internet-connected machine,
defaults to a hosted model, and is published through a public tunnel. Claiming
invulnerability we do not have is the fastest way to lose a technical judge.

## Say this instead

**Every AI tool an enterprise adopts is a new path for its data to leave. We
built one with no path.**

That is defensible, specific, and true of what we built.

### The mechanism: the "lethal trifecta"

Simon Willison's framing, now widely adopted: an agent becomes an exfiltration
channel when it has all three of —

1. access to private data,
2. exposure to untrusted content,
3. the ability to communicate externally.

**minicloud deliberately breaks the third.** A generated app holds no
credentials and has no outbound reach. It can only call back into the gateway,
and only for the queries its manifest declared before it ever ran. The untrusted
content (model-authored code) and the private data (the ERP) are both present —
but the channel out is absent by construction.

That is a real architectural answer to the top-ranked LLM risk, not a slogan.

## Sourced incidents to draw on

Strongest first. Primary threat-intel reporting, then secondary trackers.

- **An AI agent framework running on DeepSeek was used to orchestrate real
  intrusions.** Unit 42 (Palo Alto Networks) documented a Chinese-speaking
  actor (aliases *knaithe* / *KnYuan*) running the open-source Hermes Agent
  framework with **DeepSeek as its reasoning engine**, orchestrated over
  Telegram: target enumeration via FOFA, autonomous search for critical CVEs
  when exploitation failed, and seven vulnerabilities exploited with **confirmed
  data exfiltration**. *(Unit 42, 2026.)*

  > Use this one. We demo with DeepSeek. The honest line is:
  > *"the same model I'm using to build these apps has been used to run
  > intrusions — which is exactly why the model selector exists."*

- **AI infrastructure is itself attack surface.** CVE-2026-42208, a
  pre-authentication SQL injection in **LiteLLM** with CVSS 9.3, was exploited
  within roughly **36 hours** of its patch disclosure. *(Cloud Security
  Alliance, May 2026.)* The gateway you put in front of your models is a target.

- **LLM-orchestrated attack chains are documented.** CSA describes a Chinese
  state-sponsored actor, GTG-1002, using LLMs to orchestrate attack chains in
  late 2025. *(Cloud Security Alliance, May 2026.)*

- **Agents are taking over parts of the kill chain.** Google Threat Intelligence
  Group's Q3 2026 AI Threat Tracker reports AI agents automating vulnerability
  scanning, credential harvesting and troubleshooting with less human
  involvement. *(GTIG, Q3 2026.)*

- **Prompt injection is the #1 LLM risk and has been since 2023.** OWASP ranks it
  LLM01, and maps it to six of the ten categories in its Top 10 for Agentic
  Applications. *(OWASP GenAI Security Project, 2026.)*

- **Adoption is far ahead of readiness.** 83% of organisations plan to deploy
  agentic AI; only **29% feel ready to do so securely**. *(Cisco, 2026.)*

- **Send your data to an AI vendor and you inherit their breaches.** Mercor, an
  AI training-data vendor whose customers reportedly include major labs,
  confirmed a breach in April 2026; LAPSUS$ claimed roughly 4TB exfiltrated.
  *(Secondary trackers — **verify before saying this on camera**.)*

## The counterpoint, so you are not caught out

The **International AI Safety Report 2026** states that fully autonomous,
end-to-end attacks **have not been reported** — what is documented is AI-assisted
and semi-autonomous operations with human oversight. If you claim "AI is running
autonomous hacks," a judge who has read that report will correct you.

Say **"AI is collapsing the cost and time of exploitation"** — which the Unit 42,
CSA and GTIG material all support — not "AI is hacking by itself."

## Figures I would NOT cite

- CIS "340% year-over-year growth in prompt injection attempts" and "67% went
  undetected for 72+ hours" — repeated by vendor blogs, not traceable to the CIS
  report itself in the time available.
- "73% of production deployments" attributed to OWASP — not traceable to a
  primary OWASP document.
- Claims of nine coordinated intrusions across 600+ enterprise firewalls — no
  verifiable primary source.
