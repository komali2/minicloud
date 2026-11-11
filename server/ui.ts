import { MODELS, defaultModelId } from "../generator/models";
import type { Connection, AppRow } from "./types";

/** Render a stored ISO timestamp in the appliance's local timezone, not UTC. */
const localTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour12: false });
const localDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { hour12: false, dateStyle: "short", timeStyle: "medium" });

const esc = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const CSS = `
:root{--bg:#0b0d10;--panel:#14181d;--panel2:#1b2027;--line:#262d36;--tx:#e8edf3;--dim:#8a97a6;--acc:#5b9dff;--ok:#3fbf7f;--err:#ff6b6b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--acc)}
.wrap{max-width:860px;margin:0 auto;padding:32px 20px 80px}
header{display:flex;align-items:baseline;gap:12px;margin-bottom:6px}
h1{font-size:25px;margin:0;letter-spacing:-.02em}
.tag{color:var(--dim);font-size:14px}
.sub{color:var(--dim);font-size:15px;margin:0 0 28px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px}
textarea{width:100%;min-height:92px;resize:vertical;background:var(--panel2);color:var(--tx);border:1px solid var(--line);border-radius:10px;padding:13px 14px;font:inherit}
textarea:focus{outline:none;border-color:var(--acc)}
.row{display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap}
select{background:var(--panel2);color:var(--tx);border:1px solid var(--line);border-radius:9px;padding:10px 12px;font:inherit;flex:1;min-width:230px}
button{background:var(--acc);color:#07101f;border:0;border-radius:9px;padding:12px 20px;font:600 16px/1 inherit;cursor:pointer;min-height:44px}
button:disabled{opacity:.55;cursor:default}
.ex{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.ex button{background:var(--panel2);color:var(--dim);border:1px solid var(--line);font-weight:400;font-size:14px;padding:8px 12px;min-height:0}
.ex button:hover{color:var(--tx);border-color:var(--acc)}
/* build panel */
#build{margin-top:16px;display:none;border:1px solid var(--line);border-radius:12px;background:var(--panel2);overflow:hidden}
#build.on{display:block}
.bhead{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-bottom:1px solid var(--line);font:600 12px/1 inherit;letter-spacing:.08em;text-transform:uppercase;color:var(--dim)}
#elapsed{font:600 13px ui-monospace,Menlo,monospace;color:var(--acc);letter-spacing:0;text-transform:none}
#steps{padding:10px 14px 13px;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}
.step{display:flex;gap:10px;align-items:baseline;padding:3px 0;animation:fade .25s ease}
@keyframes fade{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}
.step .k{color:var(--tx);min-width:84px;font-weight:500}
.step .v{color:var(--dim);word-break:break-word}
.step.err .k,.step.err .v{color:var(--err)}
.caps{margin:4px 0 2px 94px;border-left:2px solid #2b3a4d;padding-left:11px}
.cap{color:#7fb3f5;padding:2px 0;animation:fade .25s ease}
.cap .w{color:#e0b37a}
.tick{color:var(--ok)}
.spin{display:inline-block;width:11px;color:var(--acc)}
/* success */
.done{margin-top:16px;padding:18px;background:#0f1d2e;border:1px solid #27496f;border-radius:12px;display:none}
.done.on{display:block}
.done .hd{display:flex;align-items:center;gap:9px;font-weight:600;font-size:16px}
.done .u{display:block;margin-top:10px;font:15px ui-monospace,Menlo,monospace;word-break:break-all}
.done .row2{display:flex;gap:18px;align-items:center;margin-top:14px;flex-wrap:wrap}
.done .qr{background:#fff;padding:9px;border-radius:9px;line-height:0}
.done .qr svg{width:116px;height:116px;display:block}
.done .hint{color:var(--dim);font-size:13.5px;max-width:330px}
button .sp{display:inline-block;width:13px;height:13px;margin-right:8px;border:2px solid rgba(7,16,31,.3);border-top-color:#07101f;border-radius:50%;animation:rot .6s linear infinite;vertical-align:-2px}
@keyframes rot{to{transform:rotate(360deg)}}
h2{font-size:14px;text-transform:uppercase;letter-spacing:.09em;color:var(--dim);margin:40px 0 12px;font-weight:600}
.app{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:15px 16px;border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-bottom:10px;transition:border-color .15s}
.app:hover{border-color:#36404d}
.app .l{min-width:0}
.app .t{font-weight:600;font-size:16px}
.app .p{color:var(--dim);font-size:13.5px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app .meta{margin-top:9px;display:flex;gap:6px;flex-wrap:wrap}
.app .b{font:500 11.5px/1 ui-monospace,Menlo,monospace;color:var(--dim);background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:4px 7px}
.app .b.loc{color:#7ec8a9;border-color:#2c4c3f;background:#16241e}
.app .r{display:flex;gap:8px;align-items:center;white-space:nowrap}
.btn{display:inline-block;background:var(--acc);color:#07101f;border-radius:8px;padding:8px 15px;font:600 14px/1.4 inherit;text-decoration:none}
.btn.ghost{background:transparent;color:var(--dim);border:1px solid var(--line)}
.btn.ghost:hover{color:var(--tx);border-color:var(--acc)}
.empty{color:var(--dim);font-size:15px}
.conn{color:var(--dim);font-size:13.5px;margin-top:10px}
.pill{display:inline-block;background:#122;border:1px solid #244;color:#7ec;border-radius:20px;padding:2px 10px;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line)}
th{color:var(--dim);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
td.ok{color:var(--ok)}td.bad{color:var(--err)}
code{background:var(--panel2);padding:1px 6px;border-radius:5px;font-size:13.5px}
`;

export function page(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head><body><div class="wrap">${body}</div></body></html>`;
}

const EXAMPLES = [
  "Show me sales by quarter for the last 3 years",
  "A stock count form for Aisle 4",
  "Which customers haven't ordered in 90 days?",
];

export function homePage(apps: AppRow[], conns: Connection[]) {
  const opts = MODELS.map(
    (m) => `<option value="${esc(m.id)}"${m.id === defaultModelId ? " selected" : ""}>${esc(m.label)}${m.local ? " 🔒" : ""}</option>`
  ).join("");

  const list = apps.length
    ? apps
        .map(
          (a) => {
          const m = MODELS.find((x) => x.id === a.model);
          const conns = [...new Set(((JSON.parse((a as any).manifest_json || '{"queries":[]}').queries) ?? [])
            .map((q: any) => q.connection))] as string[];
          const badges = [
            m ? `<span class="b${m.local ? " loc" : ""}">${esc(m.local ? "on-prem" : "hosted")} · ${esc(m.model)}</span>` : "",
            ...conns.map((c) => `<span class="b">${esc(c)}</span>`),
          ].join("");
          return `<div class="app"><div class="l"><div class="t">${esc(a.title)}</div>
<div class="p">${esc(a.prompt)}</div><div class="meta">${badges}</div></div>
<div class="r"><a class="btn" href="/a/${esc(a.slug)}/">Open</a><a class="btn ghost" href="/a/${esc(a.slug)}/audit">Audit</a></div></div>`;
        }
        )
        .join("")
    : `<div class="empty">No apps yet. Describe one above.</div>`;

  const connLine = conns.length
    ? conns.map((c) => `<span class="pill">${esc(c.name)}</span>`).join(" ")
    : `<span class="empty">No connections configured.</span>`;

  return page(
    "minicloud",
    `<header><h1>minicloud</h1><span class="tag">the app factory inside your network</span></header>
<p class="sub">Describe the internal tool you need. You'll get a working app at a shareable link.</p>
<div class="card">
  <textarea id="p" placeholder="e.g. a stock count form for Aisle 4"></textarea>
  <div class="row"><select id="m">${opts}</select><button id="go">Build it</button></div>
  <div class="ex">${EXAMPLES.map((e) => `<button data-e="${esc(e)}">${esc(e)}</button>`).join("")}</div>
  <div class="conn">Connected systems: ${connLine}</div>
  <div id="build"><div class="bhead"><span id="bphase">building</span><span id="elapsed">0.0s</span></div><div id="steps"></div></div>
  <div class="done" id="done">
    <div class="hd"><span class="tick">&#10003;</span><span id="dtitle">Your app is live</span></div>
    <a class="u" id="url" href="#"></a>
    <div class="row2"><div class="qr" id="qr"></div><div class="hint">Scan to open it on a phone. It is a normal link &mdash; send it to anyone inside the network.</div></div>
  </div>
</div>
<h2>Apps</h2>${list}
<script>
const $=s=>document.querySelector(s);
document.querySelectorAll('.ex button').forEach(b=>b.onclick=()=>{$('#p').value=b.dataset.e;$('#p').focus()});

const LABEL={connected:'connected',model:'model',drafting:'drafting',manifest:'declared',
  writing:'writing',repairing:'repairing',validated:'validated',deployed:'deployed',error:'failed'};

function step(stage,detail){
  const id='st-'+stage;
  let el=document.getElementById(id);
  if(!el){
    el=document.createElement('div');
    el.className='step'+(stage==='error'?' err':'');
    el.id=id;
    el.innerHTML='<span class="k"></span><span class="v"></span>';
    $('#steps').appendChild(el);
  }
  el.querySelector('.k').textContent=LABEL[stage]||stage;
  el.querySelector('.v').textContent=detail||'';
  return el;
}

function caps(list){
  const box=document.createElement('div');
  box.className='caps';
  $('#steps').appendChild(box);
  list.forEach((c,i)=>setTimeout(()=>{
    const d=document.createElement('div');
    d.className='cap';
    d.innerHTML=c.startsWith('write')?'<span class="w">'+c+'</span>':c;
    box.appendChild(d);
  },i*110));
}

$('#go').onclick=async()=>{
  const prompt=$('#p').value.trim(); if(!prompt)return;
  const model=$('#m').value, go=$('#go');
  $('#done').className='done';
  $('#steps').innerHTML='';
  $('#build').className='on';
  $('#bphase').textContent='building';
  go.disabled=true; go.innerHTML='<span class="sp"></span>Building';

  const t0=Date.now();
  const tick=setInterval(()=>{$('#elapsed').textContent=((Date.now()-t0)/1000).toFixed(1)+'s'},100);
  const stop=()=>{clearInterval(tick);go.disabled=false;go.textContent='Build it'};

  try{
    const res=await fetch('/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,model})});
    const rd=res.body.getReader(), dec=new TextDecoder(); let buf='';
    for(;;){
      const {done:fin,value}=await rd.read(); if(fin)break;
      buf+=dec.decode(value,{stream:true});
      const parts=buf.split('\\n\\n'); buf=parts.pop()||'';
      for(const part of parts){
        const line=part.split('\\n').find(l=>l.startsWith('data:')); if(!line)continue;
        const ev=JSON.parse(line.slice(5));
        if(ev.stage==='done'){
          clearInterval(tick);
          $('#elapsed').textContent=(ev.ms/1000).toFixed(1)+'s';
          $('#bphase').textContent='built in '+(ev.ms/1000).toFixed(1)+'s';
          $('#dtitle').textContent=ev.detail+' is live';
          const u=$('#url'); u.textContent=ev.url; u.href=ev.url;
          $('#qr').innerHTML=ev.qr||'';
          $('#done').className='done on';
        } else if(ev.stage==='manifest'){
          step('manifest',ev.detail);
          if(ev.capabilities&&ev.capabilities.length)caps(ev.capabilities);
        } else if(ev.stage==='model'){
          step('model',ev.detail+(ev.local?'   \u00b7 nothing leaves the building':''));
        } else {
          step(ev.stage,ev.detail);
        }
      }
    }
  }catch(e){ step('error',e.message) }
  stop();
};
</script>`
  );
}

export function auditPage(app: AppRow, rows: any[]) {
  const manifest = JSON.parse(app.manifest_json);
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr><td title="${esc(localDateTime(r.created_at))}">${esc(localTime(r.created_at))}</td><td><code>${esc(r.ref_id)}</code></td>
<td>${esc(r.kind)}</td><td>${esc(r.connection_id ?? "—")}</td>
<td class="${r.status === "ok" ? "ok" : "bad"}">${esc(r.status)}</td>
<td>${r.row_count ?? "—"}</td><td>${r.duration_ms ?? "—"}ms</td><td>${esc(r.detail ?? "")}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="8" class="empty">No data calls yet. Open the app to generate some.</td></tr>`;

  return page(
    `Audit — ${app.title}`,
    `<header><h1>${esc(app.title)}</h1><span class="tag">audit log</span></header>
<p class="sub">Every data call this generated app has made. <a href="/a/${esc(app.slug)}/">open the app</a> · <a href="/">all apps</a></p>
<div class="card">
<h2 style="margin-top:0">Declared capabilities</h2>
<p class="empty" style="margin-top:0">This app can make <b>only</b> these calls. Anything else returns 404 — it does not exist.</p>
<table><tr><th>id</th><th>kind</th><th>connection</th><th>target</th><th>scope</th></tr>
${(manifest.queries ?? [])
  .map((q: any) => `<tr><td><code>${esc(q.id)}</code></td><td>read</td><td>${esc(q.connection)}</td><td>${esc(q.doctype)}</td><td>${esc((q.fields || []).join(", "))}</td></tr>`)
  .join("")}
${(manifest.actions ?? [])
  .map((a: any) => `<tr><td><code>${esc(a.id)}</code></td><td>write</td><td>${esc(a.connection)}</td><td>${esc(a.doctype)}</td><td>${esc((a.allowed_fields || []).join(", "))}</td></tr>`)
  .join("")}
</table></div>
<h2>Call log</h2>
<div class="card" style="padding:4px 8px"><table>
<tr><th>time</th><th>ref</th><th>kind</th><th>conn</th><th>status</th><th>rows</th><th>took</th><th>detail</th></tr>
${body}</table></div>`
  );
}
