import { MODELS, defaultModelId } from "../generator/models";
import { CONNECTOR_TYPES, type ConnectorType } from "../connectors/registry";
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
#gpu{display:none;margin:2px 14px 12px;padding:10px 12px;border:1px solid #2c4c3f;background:#16241e;border-radius:9px;font:12.5px ui-monospace,Menlo,monospace;color:#7ec8a9}
#gpu.on{display:block}
#gpu .bar{height:6px;background:#0d1a15;border-radius:3px;margin-top:7px;overflow:hidden}
#gpu .fill{height:100%;background:#3fbf7f;width:0;transition:width .35s ease}
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
/* admin */
.nav{float:right;font-size:14px}
.conn-row{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:15px 16px;border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-bottom:10px}
.conn-row .t{font-weight:600;font-size:16px}
.conn-row .u{color:var(--dim);font:13px ui-monospace,Menlo,monospace;margin-top:4px;word-break:break-all}
.conn-row .st{margin-top:8px;font-size:13.5px}
.conn-row .st.ok{color:var(--ok)}
.conn-row .st.bad{color:var(--err)}
.conn-row .used{margin-top:7px;color:var(--dim);font-size:13px}
.kind{display:inline-block;font:600 11px/1 ui-monospace,Menlo,monospace;color:var(--dim);background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:4px 7px;margin-left:9px;vertical-align:2px;text-transform:uppercase;letter-spacing:.05em}
.types{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:10px;margin-top:4px}
.type{text-align:left;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:13px;cursor:pointer;color:var(--tx);font:inherit;min-height:0}
.type:hover{border-color:var(--acc)}
.type.sel{border-color:var(--acc);background:#16233a}
.type[disabled]{opacity:.5;cursor:not-allowed}
.type .n{font-weight:600;font-size:14.5px}
.type .d{color:var(--dim);font-size:12.5px;margin-top:5px;line-height:1.45}
.type .soon{display:inline-block;margin-top:8px;font:600 10.5px/1 inherit;letter-spacing:.06em;text-transform:uppercase;color:#d8a657}
label{display:block;margin-top:13px;font-size:13px;color:var(--dim)}
label input{width:100%;margin-top:5px;background:var(--panel2);color:var(--tx);border:1px solid var(--line);border-radius:9px;padding:10px 12px;font:inherit}
label input:focus{outline:none;border-color:var(--acc)}
.help{color:var(--dim);font-size:12.5px;margin-top:4px}
.caps2{color:var(--dim);font-size:13px;margin-top:12px;line-height:1.6}
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
    `<header><h1>minicloud</h1><span class="tag">the app factory inside your network</span>
<span class="nav"><a href="/admin">connected systems &rarr;</a></span></header>
<p class="sub">Describe the internal tool you need. You'll get a working app at a shareable link.</p>
<div class="card">
  <textarea id="p" placeholder="e.g. a stock count form for Aisle 4"></textarea>
  <div class="row"><select id="m">${opts}</select><button id="go">Build it</button></div>
  <div class="ex">${EXAMPLES.map((e) => `<button data-e="${esc(e)}">${esc(e)}</button>`).join("")}</div>
  <div class="conn">Connected systems: ${connLine} <a href="/admin" style="margin-left:6px">manage</a></div>
  <div id="build"><div class="bhead"><span id="bphase">building</span><span id="elapsed">0.0s</span></div>
    <div id="gpu"></div><div id="steps"></div></div>
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

  // When the model runs on this appliance, show the hardware doing the work.
  const onPrem=$('#m').selectedOptions[0].textContent.indexOf('on-prem')!==-1;
  let gtick=null;
  if(onPrem){
    const g=$('#gpu'); g.className='on';
    const poll=async()=>{
      try{
        const s=await (await fetch('/api/gpu')).json();
        if(!s){g.className='';return}
        g.innerHTML='inference running on this appliance &nbsp;\u00b7&nbsp; '+s.name+
          ' &nbsp;\u00b7&nbsp; '+s.util+'% &nbsp;\u00b7&nbsp; '+
          (s.memUsed/1024).toFixed(1)+' / '+(s.memTotal/1024).toFixed(1)+' GB'+
          '<div class="bar"><div class="fill" style="width:'+s.util+'%"></div></div>';
      }catch(e){}
    };
    poll(); gtick=setInterval(poll,700);
  }
  const stop=()=>{clearInterval(tick);if(gtick)clearInterval(gtick);go.disabled=false;go.textContent='Build it'};

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


export function adminPage(
  rows: { conn: Connection; status?: { ok: boolean; detail: string }; used: string[] }[]
) {
  const typeCards = CONNECTOR_TYPES.map(
    (t: ConnectorType) => `<button type="button" class="type" data-kind="${esc(t.kind)}"${t.status === "planned" ? " disabled" : ""}>
<div class="n">${esc(t.label)}</div><div class="d">${esc(t.blurb)}</div>${t.status === "planned" ? '<div class="soon">not yet verified</div>' : ""}</button>`
  ).join("");

  const list = rows.length
    ? rows.map(({ conn, status, used }) => `<div class="conn-row">
<div class="l"><div class="t">${esc(conn.name)}<span class="kind">${esc(conn.kind)}</span></div>
<div class="u">${esc(conn.base_url)}</div>
${status ? `<div class="st ${status.ok ? "ok" : "bad"}">${status.ok ? "&#10003;" : "&#10007;"} ${esc(status.detail)}</div>` : ""}
<div class="used">${used.length ? `used by ${used.length} app(s): ${esc(used.join(", "))}` : "not used by any app yet"}</div></div>
<div class="r">
<form method="POST" action="/admin/connections/${esc(conn.id)}/test" style="display:inline"><button class="btn ghost">Test</button></form>
<form method="POST" action="/admin/connections/${esc(conn.id)}/delete" style="display:inline"
 onsubmit="return confirm('Remove ${esc(conn.name)}? Apps that declared queries against it will stop working.')">
<button class="btn ghost">Remove</button></form></div></div>`).join("")
    : `<div class="empty">No systems connected yet.</div>`;

  const specs = JSON.stringify(
    Object.fromEntries(CONNECTOR_TYPES.map((t) => [t.kind, { endpoint: t.endpoint, secrets: t.secrets, reads: t.reads, writes: t.writes }]))
  );

  return page(
    "minicloud · connected systems",
    `<header><h1>Connected systems</h1><span class="tag">IT administration</span><span class="nav"><a href="/">&larr; back to apps</a></span></header>
<p class="sub">Credentials live here and nowhere else. Generated apps never receive them &mdash; they reach these systems only through the gateway, and only for the queries their manifest declares.</p>

<h2 style="margin-top:0">Connections</h2>
${list}

<h2>Add a connection</h2>
<div class="card">
  <form method="POST" action="/admin/connections" id="addf">
    <div class="types">${typeCards}</div>
    <input type="hidden" name="kind" id="kind">
    <div id="fields"></div>
    <div class="row"><button type="submit" id="save" disabled>Connect</button></div>
  </form>
</div>
<script>
const SPECS=${specs};
const $=s=>document.querySelector(s);
function field(f,i){
  return '<label>'+f.label+(f.required?' *':'')+
    '<input name="'+f.key+'"'+(f.secret?' type="password"':'')+
    (f.placeholder?' placeholder="'+f.placeholder+'"':'')+
    (f.required?' required':'')+(i===0?' autofocus':'')+'></label>'+
    (f.help?'<div class="help">'+f.help+'</div>':'');
}
document.querySelectorAll('.type').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.type').forEach(x=>x.classList.remove('sel'));
  b.classList.add('sel');
  const kind=b.dataset.kind, sp=SPECS[kind];
  $('#kind').value=kind;
  let h='<label>Display name *<input name="name" required placeholder="e.g. Plant NAS" autofocus></label>';
  h+=field(sp.endpoint,1);
  sp.secrets.forEach(f=>h+=field(f,1));
  h+='<div class="caps2">Apps may read: '+sp.reads+'<br>Apps may write: '+(sp.writes||'nothing \u2014 this connection is read-only')+'</div>';
  $('#fields').innerHTML=h;
  $('#save').disabled=false;
});
</script>`
  );
}
