import { MODELS, defaultModelId } from "../generator/models";
import type { Connection, AppRow } from "./types";

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
#log{margin-top:16px;display:none;font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dim);white-space:pre-wrap}
#log.on{display:block}
#log b{color:var(--tx);font-weight:500}
.done{margin-top:16px;padding:16px;background:#101c2e;border:1px solid #244166;border-radius:11px;display:none}
.done.on{display:block}
.done .u{display:block;margin-top:6px;font:15px ui-monospace,Menlo,monospace;word-break:break-all}
h2{font-size:14px;text-transform:uppercase;letter-spacing:.09em;color:var(--dim);margin:40px 0 12px;font-weight:600}
.app{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:14px 16px;border:1px solid var(--line);border-radius:11px;background:var(--panel);margin-bottom:9px}
.app .t{font-weight:600}
.app .p{color:var(--dim);font-size:13.5px;margin-top:2px}
.app .r{display:flex;gap:14px;align-items:center;white-space:nowrap;font-size:14px}
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
          (a) => `<div class="app"><div><div class="t">${esc(a.title)}</div><div class="p">${esc(a.prompt)}</div></div>
<div class="r"><a href="/a/${esc(a.slug)}/">open</a><a href="/a/${esc(a.slug)}/audit">audit</a></div></div>`
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
  <div id="log"></div>
  <div class="done" id="done">Your app is live.<a class="u" id="url" href="#"></a></div>
</div>
<h2>Apps</h2>${list}
<script>
const $=s=>document.querySelector(s);
document.querySelectorAll('.ex button').forEach(b=>b.onclick=()=>{$('#p').value=b.dataset.e;$('#p').focus()});
$('#go').onclick=async()=>{
  const prompt=$('#p').value.trim(); if(!prompt)return;
  const model=$('#m').value, log=$('#log'), done=$('#done');
  $('#go').disabled=true; done.className='done'; log.className='on'; log.textContent='';
  const add=(s,d)=>{log.innerHTML+='<b>'+s+'</b>'+(d?'  '+d:'')+'\\n';log.scrollTop=log.scrollHeight};
  try{
    const res=await fetch('/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,model})});
    const rd=res.body.getReader(), dec=new TextDecoder(); let buf='';
    for(;;){
      const {done:fin,value}=await rd.read(); if(fin)break;
      buf+=dec.decode(value,{stream:true});
      const parts=buf.split('\\n\\n'); buf=parts.pop()||'';
      for(const p of parts){
        const line=p.split('\\n').find(l=>l.startsWith('data:')); if(!line)continue;
        const ev=JSON.parse(line.slice(5));
        if(ev.stage==='done'){
          done.className='done on';
          const u=$('#url'); u.textContent=ev.url; u.href=ev.url;
          add('ready','open it above'); setTimeout(()=>location.reload(),2500);
        } else if(ev.stage==='error'){ add('failed',ev.detail); }
        else add(ev.stage,ev.detail||'');
      }
    }
  }catch(e){ add('failed',e.message) }
  $('#go').disabled=false;
};
</script>`
  );
}

export function auditPage(app: AppRow, rows: any[]) {
  const manifest = JSON.parse(app.manifest_json);
  const body = rows.length
    ? rows
        .map(
          (r) => `<tr><td>${esc(r.created_at.slice(11, 19))}</td><td><code>${esc(r.ref_id)}</code></td>
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
