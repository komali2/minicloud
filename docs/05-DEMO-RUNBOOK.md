# Demo runbook

## HARD RULE: do not touch `~/src/erp-local`

That instance is a restored copy of production `erp.508.dev`. Its README states
the backups are **real client, engineer and bank data**. It is also in use by
another project. Never point minicloud at it, never screenshot it, never let it
near the repo or the video. Everything below creates a **separate, synthetic**
instance.

## 1. Forked ERPNext (Role C — start this FIRST, it bakes in background)

```bash
mkdir -p ~/src/minicloud/infra/erp-demo && cd ~/src/minicloud/infra/erp-demo
cp ~/src/erp-local/compose.yaml .
```

Edit the copy:
- Delete every `./apps/...` volume mount and the whole `x-app-env` / `PYTHONPATH` block
- Delete the `./backups:/backups:ro` mount  **(this is the client-data mount — it must go)**
- Delete the `./scripts:/scripts:ro` mount and restore the default entrypoint
  (drop the `entrypoint: ["/scripts/dev-entrypoint.sh"]` line)
- `frontend` ports: `127.0.0.1:8081:8080`
- `db` ports: `127.0.0.1:3308:3306`
- `FRAPPE_SITE_NAME_HEADER: demo`

Bring it up under its own project name so it cannot collide with `erp-local`:

```bash
docker compose -p minicloud-erp up -d
docker compose -p minicloud-erp exec backend \
  bench new-site demo \
    --mariadb-root-password admin \
    --admin-password admin \
    --mariadb-user-host-login-scope='%' \
    --install-app erpnext --set-default
```

Expect 5–12 minutes. While it runs, build against fixtures.

Then demo data — try the generator first:

```bash
docker compose -p minicloud-erp exec backend \
  bench --site demo execute erpnext.setup.demo.setup_demo_data
```

**If that stalls past 5 minutes, kill it and seed via REST instead** (more
reliable, deterministic, and you control the shape):
- 3 Warehouses (`Aisle 4 - Demo`, etc.)
- ~30 Items with stock
- ~20 Customers
- ~300 submitted Sales Invoices with `posting_date` spread across 3 years
  (this is what makes "sales by quarter for the last 3 years" look real)

API key: ERPNext UI → User `Administrator` → Settings → API Access → Generate
Keys. Store as `secret_json` on the `erpnext` connection row.

**19:45 cut line:** if the site isn't healthy, abandon it and seed a Postgres
`customers / items / stock_entries / invoices` schema instead. The gateway
abstracts the connector, so no platform code changes.

## 1b. Second ERP and a WebDAV share (for the multi-connector beat)

```bash
docker compose -f infra/odoo-demo/compose.yaml -p minicloud-odoo up -d
docker compose -f infra/odoo-demo/compose.yaml -p minicloud-odoo exec -T odoo \
  odoo -d demo -i base,sale,stock --stop-after-init \
    --db_host=odoo-db --db_user=odoo --db_password=odoo
# admin / admin, database "demo", at http://127.0.0.1:8069

rclone serve webdav /tmp/plant-nas --addr 127.0.0.1:8099 &   # stand-in NAS
```

Then add both through `/admin` the way IT would. Odoo: database `demo`,
user `admin`, password `admin`.

## 2. Public URL (Role D)

```bash
tailscale funnel 3000          # prints an admin link if Funnel isn't enabled yet
tailscale funnel status
```

Hostname: `https://caleb-manjarotop.taile06653.ts.net`

Enable HTTPS certs + the Funnel node attribute once in the tailnet admin
console (you own the tailnet — two clicks). Verify by loading it **on a phone
over cellular, not venue wifi** — that is the proof it's genuinely public.

Stable hostname matters: URLs generated at 20:00 must still resolve when you
film at 22:00. A `trycloudflare.com` quick tunnel re-rolls its hostname on every
restart and will break links mid-shoot. Only fall back to cloudflared if the
Tailscale toggle fights you.

## 3. Demo prompts (lock these, rehearse twice)

1. **Chart:** *"Show me sales by quarter for the last 3 years"*
2. **Frontline form:** *"A stock count form for Aisle 4 — scan or pick an item,
   enter the count, submit"*  ← this one **writes back** to ERPNext
3. **Pre-generated, sitting in the list:** *"Which customers haven't ordered in
   90 days?"*

Two generated live proves generality. The third's presence implies a dozen.

## 3b. Verified state (as built, 2026-11-11)

Measured, not assumed:

| | |
|---|---|
| Generation latency, hosted (DeepSeek) | 13–16s, 6/6 runs, zero repair round-trips |
| Generation latency, on-prem (Devstral 24B, RTX 5090) | 2m45s — **measured under GPU contention, see below** |
| On-prem MoE alternative (Qwen3-Coder 30B A3B) | 147s for 1096 tokens — **also contended, conclusion was wrong** |

> **Both on-prem numbers above are invalid as general figures.** They were taken
> while an unrelated benchmark (`eval.run`, Qwen3.8-27B via llama-server) held
> 18,996 MiB of the 32,607 MiB card and pinned it at 98%. Only ~13.6 GB was
> free, but devstral-small-2 is 15 GB and Qwen3-Coder-30B-A3B is 21 GB — so
> neither fit, and Ollama ran them partially offloaded to CPU while time-slicing
> a saturated GPU.
>
> On an idle 5090 devstral fits entirely in VRAM with ~17 GB spare and should be
> far faster. The A3B MoE, which was the *most* starved (21 GB into 13.6 GB),
> has only ~3B active parameters and would likely be the fastest of the three —
> the opposite of what the contended measurement suggested.
>
> **Re-measure on an idle GPU before quoting any on-prem latency.** Check with
> `nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv`
> first; if anything else holds VRAM, the number is meaningless.
| Sales data | 272 submitted invoices across 2024 / 2025 / 2026 |
| Self-containment | 0 external refs in every generated app |

Demo apps currently in the list:

| Slug | What | Use |
|---|---|---|
| `sales-by-quarter-fe9fom` | chart, 1 query, 272 rows | backup if live generation fails on camera |
| `aisle-4-stock-count-gq23mq` | 5 queries + 1 write action, all passing | backup |
| `inactive-customers-8dnjeo` | generated **on-prem** by Devstral | the pre-generated third app |

Right before recording, prune to just the on-prem one so the two live
generations land in a clean list — keeping the backups until then:

```bash
bun scripts/prune-apps.ts                                   # list
bun scripts/prune-apps.ts keep inactive-customers-8dnjeo    # clean slate
```

## 4. Pre-flight before filming

Run the automated check first — it verifies every link in the chain:

```bash
set -a && . ./.env && set +a && bun scripts/preflight.ts
```

It checks the platform, the public URL (and that it matches the local app
count, catching a funnel pointed at the wrong thing), ERPNext reachability and
credentials, three years of data, the on-prem model server, every registered
app's declared queries, and that `erp-local` is **not** running.

Then by hand:

- [ ] `bun scripts/preflight.ts` passes 9/9
- [ ] Funnel URL loads on a phone over **cellular**, not venue wifi
- [ ] Both demo prompts run clean, twice in a row
- [ ] Audit view shows real rows
- [ ] **`cd ~/src/erp-local && docker compose down`** — the co-op instance holds real
      client and bank data. Preflight fails until this is done.
- [ ] No real client data anywhere on screen — check browser tabs and terminal scrollback
- [ ] Repo pushed and public
