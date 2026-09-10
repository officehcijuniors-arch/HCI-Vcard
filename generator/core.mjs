export const html = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const vtext = value => String(value ?? "").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
export const cleanFolder = value => String(value ?? "").replace(/[\\/:*?"<>|]/g,"-").replace(/\s+/g," ").trim();
export const folderUrl = value => encodeURIComponent(cleanFolder(value));

function photoLines(base64){
  const head="PHOTO;ENCODING=b;TYPE=JPEG:"; const lines=[];
  lines.push(head+base64.slice(0,75-head.length));
  for(let i=75-head.length;i<base64.length;i+=74) lines.push(" "+base64.slice(i,i+74));
  return lines.join("\r\n");
}

export function makeVCard(d,jpegBase64){
  const lines=["BEGIN:VCARD","VERSION:3.0",`FN:${vtext(`${d.firstName} ${d.lastName}`)}`,`N:${vtext(d.lastName)};${vtext(d.firstName)};;;`];
  if(d.organization) lines.push(`ORG:${vtext(d.organization)}`);
  if(d.title) lines.push(`TITLE:${vtext(d.title)}`);
  if(d.cell) lines.push(`TEL;TYPE=CELL:${vtext(d.cell)}`);
  if(d.email) lines.push(`EMAIL:${vtext(d.email)}`);
  if(d.workPhone) lines.push(`TEL;TYPE=WORK:${vtext(d.workPhone)}`);
  if(d.workEmail) lines.push(`EMAIL;TYPE=WORK:${vtext(d.workEmail)}`);
  if(d.street||d.city||d.postalCode||d.country) lines.push(`ADR;TYPE=WORK:;;${vtext(d.street)};${vtext(d.city)};;${vtext(d.postalCode)};${vtext(d.country)}`);
  lines.push(photoLines(jpegBase64),"END:VCARD"); return lines.join("\r\n")+"\r\n";
}

export function makeManifest(d){return JSON.stringify({name:`Visitenkarte ${d.firstName} ${d.lastName}`,short_name:`${d.firstName} ${d.lastName}`.slice(0,30),start_url:"./",display:"standalone",background_color:"#f7f5f0",theme_color:"#003789",icons:[{src:"../HAI.png",sizes:"400x400",type:"image/png",purpose:"any maskable"}]},null,2)}

export function makeSnippet(d){const folder=folderUrl(d.folderName),name=html(`${d.firstName} ${d.lastName}`),title=html(d.title);return `<a class="card" href="${folder}/">\n  <div class="avatar">\n    <img src="${folder}/Profilbild.png" alt="${name}">\n  </div>\n\n  <div class="info">\n    <h3>${name}</h3>\n    <div class="role">${title}</div>\n  </div>\n\n  <div class="arrow">→</div>\n</a>`}

export function mergeStartPage(source,d){
  if(!source.trim()) return "";
  if(typeof DOMParser==="undefined") throw new Error("DOMParser ist nicht verfügbar.");
  const doc=new DOMParser().parseFromString(source,"text/html"),grid=doc.querySelector(".grid");
  if(!grid) throw new Error("Im Startseitencode wurde kein Element mit class=\"grid\" gefunden.");
  const href=`${folderUrl(d.folderName)}/`;
  if([...doc.querySelectorAll("a.card")].some(a=>a.getAttribute("href")===href)) throw new Error("Dieser Kontakt ist bereits auf der Startseite vorhanden.");
  const holder=doc.createElement("template");holder.innerHTML=makeSnippet(d).trim();
  const rows=[...grid.querySelectorAll(":scope > .grid-row")];let row=rows.at(-1);
  if(!row||row.querySelectorAll(":scope > a.card").length>=3){row=doc.createElement("div");row.className="grid-row";grid.append("\n\n    ",row,"\n")}
  row.append("\n\n      ",holder.content.firstElementChild,"\n");
  return "<!doctype html>\n"+doc.documentElement.outerHTML;
}

export function makeContactHtml(d){
 const name=html(`${d.firstName} ${d.lastName}`), row=(label,value,href="")=>value?`<div><span>${label}:</span> ${href?`<a href="${html(href)}">${html(value)}</a>`:html(value)}</div>`:"";
 const address=[d.street,[d.postalCode,d.city].filter(Boolean).join(" "),d.country].filter(Boolean).join(", ");
 return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Kontakt – ${name}</title><link rel="apple-touch-icon" href="../HAI.png"><link rel="icon" type="image/png" href="../HAI.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Visitenkarte"><meta name="theme-color" content="#003789"><link rel="manifest" href="manifest.json"><style>
:root{--ink:#003789;--paper:#f7f5f0;--accent:#c8102e;--line:#d8d3c7;--muted:#6b7280}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,"Times New Roman",serif;background:var(--paper);color:var(--ink);display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px;position:relative;overflow-x:hidden}body:before{content:"";position:absolute;inset:0 0 auto;width:100%;height:33vh;background:url("../HAI.png") no-repeat center 40px/220px auto;opacity:.07;pointer-events:none}.card{width:100%;max-width:380px;background:#fff;border:1px solid var(--line);border-radius:4px;overflow:hidden;position:relative;box-shadow:0 4px 24px rgba(26,43,92,.08)}.header{padding:32px 28px 24px;border-bottom:3px solid var(--accent);text-align:center}.logo{height:64px;margin-bottom:20px;opacity:.95}.photo{width:96px;height:96px;border-radius:50%;object-fit:cover;object-position:center;margin:0 auto 16px;display:block;border:2px solid var(--ink);background:#fff}h1{font-size:1.4rem;font-weight:400;letter-spacing:.02em}.role,.details,.qr-wrap p,.save-btn{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.role{font-size:.78rem;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);margin-top:6px;font-weight:600}.details{padding:24px 28px;font-size:.92rem;line-height:1.9;color:var(--muted)}.details a{color:var(--ink);text-decoration:none}.details span{color:var(--ink);font-weight:600}.qr-wrap{padding:28px;text-align:center;border-top:1px solid var(--line);background:#fbfaf7}.qr-wrap p{font-size:.78rem;color:var(--muted);margin-bottom:14px;letter-spacing:.04em;text-transform:uppercase}#qrcode{display:inline-block;line-height:0;border:8px solid #fff;box-shadow:0 0 0 1px var(--line)}.save-btn{display:block;padding:14px;margin-top:20px;background:var(--ink);color:#fff;border-radius:4px;font-size:.9rem;letter-spacing:.04em;text-decoration:none}.save-btn:active{background:var(--accent)}</style></head><body><div class="card"><div class="header"><img class="logo" src="../HAI.png" alt="HC TIWAG Innsbruck Logo"><img class="photo" src="Profilbild.png" alt="Profilfoto von ${name}"><h1>${name}</h1><div class="role">${html(d.title)}</div></div><div class="details">${d.organization?`<div>${html(d.organization)}</div>`:""}${row("Tel",d.cell,`tel:${d.cell}`)}${row("Büro",d.workPhone,`tel:${d.workPhone}`)}${row("E-Mail",d.email,`mailto:${d.email}`)}${row("Office",d.workEmail,`mailto:${d.workEmail}`)}${row("Adresse",address)}</div><div class="qr-wrap"><p>QR-Code zum Abscannen</p><div id="qrcode"></div><a class="save-btn" href="Vcard.vcf?v=${Date.now()}" download>Kontakt speichern</a></div></div><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script><script>new QRCode(document.getElementById("qrcode"),{text:location.href,width:180,height:180,colorDark:"#003789",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.M});<\/script></body></html>`;
}
