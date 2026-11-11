/**
 * Seeds the SYNTHETIC demo ERPNext with a believable manufacturer's book of business.
 * Never run this against a production instance.
 */
const BASE = process.env.ERP_BASE_URL ?? "http://127.0.0.1:8081";
const KEY = process.env.ERP_API_KEY!;
const SECRET = process.env.ERP_API_SECRET!;
const COMPANY = "Northwind Manufacturing";
const ABBR = "NM";

const H = { Authorization: `token ${KEY}:${SECRET}`, "Content-Type": "application/json", Accept: "application/json" };

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* frappe sometimes returns html on error */ }
  return { ok: res.ok, status: res.status, json, text };
}

const create = (doctype: string, doc: Record<string, unknown>) =>
  api("POST", `/api/resource/${encodeURIComponent(doctype)}`, doc);

async function ensure(doctype: string, doc: Record<string, unknown>, label: string) {
  const r = await create(doctype, doc);
  if (r.ok) return r.json?.data?.name as string;
  const exc = String(r.json?.exception ?? r.text).slice(0, 120);
  if (/Duplicate|already exists/i.test(exc)) return label;
  console.warn(`  ! ${doctype} ${label}: ${exc}`);
  return null;
}

async function submit(doctype: string, name: string): Promise<boolean> {
  const r = await api("PUT", `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, { docstatus: 1 });
  if (r.ok && r.json?.data?.docstatus === 1) return true;
  const r2 = await api("POST", `/api/method/frappe.client.submit`, { doc: { doctype, name } });
  return r2.ok;
}

const CUSTOMERS = [
  "Hanwei Precision", "Taipei Fluid Systems", "Kaohsiung Marine Works", "Formosa Autoparts",
  "Jade Mountain Robotics", "Nantou Tooling", "Keelung Shipyard Supply", "Hsinchu Semiconductor Services",
  "Taichung Press Works", "Yilan Agritech", "Changhua Metal Forming", "Tainan Cold Chain",
  "Pingtung Solar Assembly", "Miaoli Ceramics", "Taoyuan Logistics Group",
];

const ITEMS = [
  ["BRG-6204", "Sealed Ball Bearing 6204", 180], ["BRG-6307", "Sealed Ball Bearing 6307", 340],
  ["SHF-20X400", "Hardened Shaft 20x400mm", 920], ["SHF-25X600", "Hardened Shaft 25x600mm", 1450],
  ["GSK-NBR-80", "NBR Gasket 80mm", 65], ["GSK-NBR-120", "NBR Gasket 120mm", 95],
  ["VLV-BALL-1", 'Ball Valve 1"', 780], ["VLV-BALL-2", 'Ball Valve 2"', 1620],
  ["MTR-0K75", "AC Motor 0.75kW", 5400], ["MTR-2K2", "AC Motor 2.2kW", 11800],
  ["PMP-CF-32", "Centrifugal Pump CF-32", 16500], ["PMP-DP-16", "Diaphragm Pump DP-16", 9400],
  ["CPL-FLEX-32", "Flexible Coupling 32mm", 540], ["CHN-08B-5M", "Roller Chain 08B 5m", 410],
  ["SPR-COMP-40", "Compression Spring 40mm", 48], ["FLT-HYD-10", "Hydraulic Filter 10um", 760],
  ["HOS-HYD-3M", "Hydraulic Hose 3m", 1180], ["SNS-PROX-M18", "Proximity Sensor M18", 1320],
  ["PLC-IO-16", "PLC I/O Module 16ch", 7300], ["CBL-SHLD-50", "Shielded Cable 50m", 2100],
];

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

async function main() {
  console.log(`seeding ${BASE} (company ${COMPANY})`);

  console.log("fiscal years…");
  for (const y of [2023, 2024, 2025, 2026]) {
    await ensure("Fiscal Year", { year: String(y), year_start_date: `${y}-01-01`, year_end_date: `${y}-12-31` }, String(y));
  }

  console.log("warehouses…");
  for (const w of ["Aisle 4", "Aisle 7", "Receiving Dock"]) {
    await ensure("Warehouse", { warehouse_name: w, company: COMPANY }, w);
  }

  console.log(`items (${ITEMS.length})…`);
  for (const [code, name] of ITEMS) {
    await ensure("Item", {
      item_code: code, item_name: name, item_group: "Products",
      stock_uom: "Nos", is_stock_item: 1, include_item_in_manufacturing: 0,
    }, String(code));
  }

  console.log(`customers (${CUSTOMERS.length})…`);
  for (const c of CUSTOMERS) {
    await ensure("Customer", { customer_name: c, customer_group: "Commercial", territory: "All Territories" }, c);
  }

  // Three years of sales with a visible upward trend and Q4 seasonality.
  const rand = rng(20261111);
  const target = Number(process.env.SEED_INVOICES ?? 260);
  console.log(`sales invoices (${target}) across 2024-01 → 2026-11…`);
  let made = 0, submitted = 0, failed = 0;

  for (let i = 0; i < target; i++) {
    const monthsBack = Math.floor(rand() * 35); // 0..34 months back from 2026-11
    const d = new Date(Date.UTC(2026, 10, 15));
    d.setUTCMonth(d.getUTCMonth() - monthsBack);
    d.setUTCDate(1 + Math.floor(rand() * 27));
    const posting = d.toISOString().slice(0, 10);

    const growth = 1 + (34 - monthsBack) * 0.012;          // later = bigger
    const q4 = [9, 10, 11].includes(d.getUTCMonth()) ? 1.3 : 1;
    const lines = 1 + Math.floor(rand() * 3);
    const items: any[] = [];
    for (let l = 0; l < lines; l++) {
      const [code, , rate] = ITEMS[Math.floor(rand() * ITEMS.length)];
      items.push({
        item_code: code,
        qty: 1 + Math.floor(rand() * 12),
        rate: Math.round(Number(rate) * growth * q4 * (0.92 + rand() * 0.16)),
      });
    }
    const due = new Date(d); due.setUTCDate(due.getUTCDate() + 30);

    const r = await create("Sales Invoice", {
      customer: CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)],
      company: COMPANY,
      posting_date: posting,
      set_posting_time: 1,
      due_date: due.toISOString().slice(0, 10),
      update_stock: 0,
      items,
    });
    if (!r.ok) {
      failed++;
      if (failed <= 3) console.warn(`  ! invoice ${posting}: ${String(r.json?.exception ?? r.text).slice(0, 160)}`);
      continue;
    }
    made++;
    const name = r.json?.data?.name;
    if (name && (await submit("Sales Invoice", name))) submitted++;
    if (made % 40 === 0) process.stdout.write(`  ${made} created / ${submitted} submitted\n`);
  }

  console.log(`\ndone: ${made} invoices created, ${submitted} submitted, ${failed} failed`);

  const chk = await api("GET", `/api/resource/Sales Invoice?fields=["name"]&filters=[["docstatus","=",1]]&limit_page_length=1000`);
  console.log(`verify: ${chk.json?.data?.length ?? 0} submitted invoices now readable via the API`);
}

main().catch((e) => { console.error(e); process.exit(1); });
