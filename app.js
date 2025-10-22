
// ==== i18n ====
const STR = {
  en: {
    app:'HAI v9.4 — Bilingual Prototype',
    admin:'Admin Dashboard',
    participants:'Participants',
    studies:'Studies',
    newStudy:'New Study',
    studyName:'Study Name',
    client:'Client',
    product:'Product',
    batch:'Batch #',
    internal:'Internal Code',
    type:'Product Type',
    template:'Use Template',
    create:'Create',
    link:'Participant Link',
    copy:'Copy',
    openSession:'Open Session',
    export:'Export',
    excel:'Excel',
    pdf:'PDF',
    word:'Word',
    codes:'Generate Codes',
    session:'Participant Session',
    exit:'Exit & Save',
    resume:'Resume',
    icf:'Informed Consent (ICH-GCP)',
    openICF:'Open ICF',
    camera:'Camera (Oval Dual-Frame)',
    startCam:'Start Camera',
    stopCam:'Stop',
    metrics:'Dermatology Metrics (0–100)',
    saveScore:'Save Scores',
    chart:'Colored Chart',
    logoNote:'Embedded logo on exports',
    studyTemplate:'Moisturizing Cream – Tolerance Study',
    lang:'EN',
    langAlt:'FR'
  },
  fr: {
    app:'HAI v9.4 — Prototype bilingue',
    admin:'Tableau de bord',
    participants:'Participants',
    studies:'Études',
    newStudy:'Nouvelle étude',
    studyName:'Nom de l’étude',
    client:'Client',
    product:'Produit',
    batch:'Lot #',
    internal:'Code interne',
    type:'Type de produit',
    template:'Utiliser le modèle',
    create:'Créer',
    link:'Lien participant',
    copy:'Copier',
    openSession:'Ouvrir la session',
    export:'Exporter',
    excel:'Excel',
    pdf:'PDF',
    word:'Word',
    codes:'Générer codes',
    session:'Session participant',
    exit:'Quitter & enregistrer',
    resume:'Reprendre',
    icf:'Consentement éclairé (ICH-GCP)',
    openICF:'Ouvrir CEI',
    camera:'Caméra (double ovale)',
    startCam:'Démarrer',
    stopCam:'Arrêter',
    metrics:'Mesures dermatologiques (0–100)',
    saveScore:'Enregistrer',
    chart:'Graphique en couleurs',
    logoNote:'Logo intégré aux exports',
    studyTemplate:'Crème hydratante – Étude de tolérance',
    lang:'FR',
    langAlt:'EN'
  }
};
let LANG = localStorage.getItem('hai_lang') || 'en';
function t(k){ return (STR[LANG]||STR.en)[k] || k; }
function setLang(l){ LANG=l; localStorage.setItem('hai_lang',l); render(); }

// ==== storage ====
const DB_KEY='hai_v9_4_db';
const emptyDB=()=>({ studies:[], participants:[], sessions:{}, seq:1 });
function loadDB(){
  try{ return JSON.parse(localStorage.getItem(DB_KEY)) || emptyDB(); }
  catch{ return emptyDB(); }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function nextCode(db){
  const n = db.seq || 1;
  db.seq = n+1;
  const code = `HAI-${String(n).padStart(3,'0')}`;
  saveDB(db);
  return code;
}

// ==== sample template ====
const TEMPLATE = {
  name: 'Moisturizing Cream – Tolerance Study',
  client: 'Demo Client',
  product: 'Moisturizing Cream',
  batch: 'MC-2025-01',
  internal: 'LH-TOL-001',
  type: 'Topical – Face',
  metrics: ['Wrinkles','Redness','Dryness','Comedones','Pores','Hydration','Brightness','Hyperpigmentation']
};

// ==== state ====
let STATE = { tab:'admin', studyId:null, participantId:null, cameraOn:false, chartData:[] };

// ==== helpers ====
function el(q){ return document.querySelector(q); }
function esc(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[m])); }

// ==== exports ====
// Excel (SpreadsheetML .xls)
function exportExcel(study){
  const headers = ['Code','Name','Study','Wrinkles','Redness','Dryness','Comedones','Pores','Hydration','Brightness','Hyperpigmentation'];
  const rows = participantsForStudy(study.id).map(p => {
    const m = (p.scores||{});
    return [p.code, p.name||'', study.name].concat(
      ['Wrinkles','Redness','Dryness','Comedones','Pores','Hydration','Brightness','Hyperpigmentation'].map(k=> m[k] ?? '')
    );
  });
  const xmlHeader = `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="Data"><Table>`;
  const xmlFooter = `</Table></Worksheet></Workbook>`;
  const xmlRows = [headers].concat(rows).map(r=> `<Row>${r.map(c=> `<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>` ).join('');
  const blob = new Blob([xmlHeader+xmlRows+xmlFooter], {type:'application/vnd.ms-excel'});
  triggerDownload(blob, fileSafe(study.name)+'_data.xls');
}

// Word (.doc as HTML)
function exportWord(study){
  const rows = participantsForStudy(study.id).map(p=>{
    const m = p.scores||{};
    return `<tr><td>${esc(p.code)}</td><td>${esc(p.name||'')}</td>
      <td>${m.Wrinkles??''}</td><td>${m.Redness??''}</td><td>${m.Dryness??''}</td><td>${m.Comedones??''}</td>
      <td>${m.Pores??''}</td><td>${m.Hydration??''}</td><td>${m.Brightness??''}</td><td>${m.Hyperpigmentation??''}</td></tr>`;
  }).join('');
  const html = `<!doctype html><html><meta charset="utf-8"><body>
  <h1>${esc(study.name)}</h1>
  <p><img src="assets/logo.svg" style="height:40px"></p>
  <table border="1" cellspacing="0" cellpadding="6">
    <tr><th>Code</th><th>Name</th><th>Wrinkles</th><th>Redness</th><th>Dryness</th><th>Comedones</th>
    <th>Pores</th><th>Hydration</th><th>Brightness</th><th>Hyperpigmentation</th></tr>
    ${rows}
  </table>
  </body></html>`;
  const blob = new Blob([html], {type:'application/msword'});
  triggerDownload(blob, fileSafe(study.name)+'_report.doc');
}

// PDF (printable view)
function exportPDF(study){
  const win = window.open('', '_blank');
  const rows = participantsForStudy(study.id).map(p=>{
    const m = p.scores||{};
    return `<tr><td>${esc(p.code)}</td><td>${esc(p.name||'')}</td>
      <td>${m.Wrinkles??''}</td><td>${m.Redness??''}</td><td>${m.Dryness??''}</td><td>${m.Comedones??''}</td>
      <td>${m.Pores??''}</td><td>${m.Hydration??''}</td><td>${m.Brightness??''}</td><td>${m.Hyperpigmentation??''}</td></tr>`;
  }).join('');
  win.document.write(`<!doctype html><html><meta charset="utf-8"><title>${esc(study.name)}</title>
  <style>
  body{font-family:Arial,sans-serif;margin:24px}
  h1{margin:0 0 8px 0}
  .small{color:#555}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px}
  </style>
  <body>
  <img src="assets/logo.svg" style="height:40px"><br>
  <h1>${esc(study.name)}</h1>
  <div class="small">Generated ${new Date().toLocaleString()}</div>
  <table>
    <tr><th>Code</th><th>Name</th><th>Wrinkles</th><th>Redness</th><th>Dryness</th><th>Comedones</th>
    <th>Pores</th><th>Hydration</th><th>Brightness</th><th>Hyperpigmentation</th></tr>
    ${rows}
  </table>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
  </body></html>`);
  win.document.close();
}

// download helper
function triggerDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}
function fileSafe(s){ return s.replace(/[^a-z0-9\-_.]+/gi,'_'); }

// ==== participants ====
function participantsForStudy(studyId){
  const db = loadDB();
  return db.participants.filter(p=> p.studyId===studyId);
}
function createParticipant(studyId, name){
  const db = loadDB();
  const code = nextCode(db);
  const id = crypto.randomUUID();
  const rec = { id, studyId, code, name:name||'', createdAt:Date.now(), scores:{} };
  db.participants.push(rec);
  saveDB(db);
  return rec;
}

// ==== studies ====
function createStudy(data){
  const db = loadDB();
  const id = crypto.randomUUID();
  const rec = { id, ...data, createdAt: Date.now() };
  db.studies.push(rec);
  saveDB(db);
  return rec;
}

// ==== ICF modal ====
const ICF_HTML = `
<h2 style="margin:0 0 6px 0;">Informed Consent — ICH-GCP Compliant</h2>
<p class="small">UTF-8 encoded • Clean characters • English / Français</p>
<div class="separator"></div>
<h3>Purpose</h3>
<p>This study evaluates the tolerance of a moisturizing cream applied to facial skin under normal conditions of use.</p>
<h3>Procedures</h3>
<ul>
  <li>Duration: 1 month; Application twice daily; 2 site visits + end questionnaire.</li>
  <li>Assessments: erythema, dryness/desquamation, comedones; self-reported satisfaction.</li>
</ul>
<h3>Risks & Benefits</h3>
<p>Low risk topical application. Potential minor irritation that usually resolves upon discontinuation.</p>
<h3>Confidentiality</h3>
<p>Data are coded (e.g., HAI-001) without direct identifiers. Access restricted to authorized staff.</p>
<h3>Voluntary Participation</h3>
<p>Your participation is voluntary. You may withdraw at any time without penalty.</p>
<h3>Contact</h3>
<p>Laboratoire Hibalogique Inc. — info@labhibalogique.org</p>
<div class="separator"></div>
<h3>Consent</h3>
<p>I have read and understood the information above and consent to participate.</p>
<button class="btn" onclick="closeICF()">Close</button>
<hr>
<h2>Consentement éclairé — conforme ICH-GCP</h2>
<p class="small">Encodage UTF‑8 • Caractères propres • Français / Anglais</p>
<div class="separator"></div>
<h3>But</h3>
<p>Cette étude évalue la tolérance d’une crème hydratante appliquée sur la peau du visage en conditions d’usage normal.</p>
<h3>Procédures</h3>
<ul>
  <li>Durée : 1 mois ; Application deux fois par jour ; 2 visites + questionnaire final.</li>
  <li>Évaluations : érythème, sécheresse/désquamation, comédons ; satisfaction auto‑rapportée.</li>
</ul>
<h3>Risques & Bénéfices</h3>
<p>Risque faible. Irritation mineure possible, se résolvant généralement à l’arrêt.</p>
<h3>Confidentialité</h3>
<p>Les données sont codées (ex. HAI-001) sans identifiants directs. Accès limité au personnel autorisé.</p>
<h3>Participation volontaire</h3>
<p>Votre participation est volontaire. Vous pouvez vous retirer en tout temps, sans conséquence.</p>
<h3>Contact</h3>
<p>Laboratoire Hibalogique Inc. — info@labhibalogique.org</p>
<div class="separator"></div>
<h3>Consentement</h3>
<p>J’ai lu et compris les informations ci‑dessus et j’accepte de participer.</p>
<button class="btn" onclick="closeICF()">Fermer</button>
`;
function openICF(){
  const m = el('#icf'); m.classList.add('open');
  el('#icf .sheet').innerHTML = ICF_HTML;
}
function closeICF(){ el('#icf').classList.remove('open'); }

// ==== camera ====
let stream=null;
async function startCam(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
    const v = el('#video'); v.srcObject = stream; await v.play();
    STATE.cameraOn = true;
  }catch(e){ alert('Camera error: '+e.message); }
}
function stopCam(){
  if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; }
  STATE.cameraOn=false;
}

// ==== chart ====
function drawChart(values){
  const c = el('#chart'); const ctx=c.getContext('2d'); const W=c.width=c.offsetWidth*2; const H=c.height=c.offsetHeight*2;
  ctx.clearRect(0,0,W,H);
  // bands
  const bands=[{to:20,label:'Minimal'},{to:40,label:'Mild'},{to:60,label:'Moderate'},{to:80,label:'Marked'},{to:100,label:'Severe'}];
  bands.forEach((b,i)=>{
    const x0 = (i*W)/bands.length, x1 = ((i+1)*W)/bands.length;
    ctx.fillStyle = ['#d1fae5','#fef9c3','#ffedd5','#fee2e2','#fecaca'][i];
    ctx.fillRect(x0,0,x1-x0,H);
  });
  // bars
  const keys=['Wrinkles','Redness','Dryness','Comedones','Pores','Hydration','Brightness','Hyperpigmentation'];
  const bw = W/(keys.length*1.5);
  keys.forEach((k,i)=>{
    const v = values[k] ?? 0;
    const x = (i+0.5)*(W/keys.length);
    const h = (v/100)*(H-60);
    ctx.fillStyle = v<=20?'#10b981': v<=40?'#f59e0b': v<=60?'#fb923c': v<=80?'#ef4444':'#b91c1c';
    ctx.fillRect(x-bw/2, H-40-h, bw, h);
    ctx.fillStyle='#111827';
    ctx.textAlign='center'; ctx.font='28px Arial';
    ctx.fillText(String(v), x, H-10);
  });
}

// ==== UI render ====
function render(){
  document.documentElement.lang = LANG;
  // header
  el('#title').textContent = t('app');
  el('#langBtn').textContent = t('lang');
  el('#langAlt').textContent = t('langAlt');

  el('#tab-admin').textContent = t('admin');
  el('#tab-session').textContent = t('session');

  const db = loadDB();
  // studies list
  const list = db.studies.map(s=>{
    const pCount = participantsForStudy(s.id).length;
    const link = location.origin + location.pathname + `#session:${s.id}`;
    return `<tr>
      <td>${esc(s.name)}</td>
      <td><span class="badge">${pCount} ${t('participants')}</span></td>
      <td>
        <button class="btn-ghost" onclick="copy('${link}')">${t('copy')}</button>
        <button class="btn" onclick="openStudy('${s.id}')">${t('openSession')}</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="3" class="small">No studies yet.</td></tr>`;
  el('#studiesBody').innerHTML = list;

  // prefill create form labels
  el('#lblStudy').textContent = t('studyName');
  el('#lblClient').textContent = t('client');
  el('#lblProduct').textContent = t('product');
  el('#lblBatch').textContent = t('batch');
  el('#lblInternal').textContent = t('internal');
  el('#lblType').textContent = t('type');
  el('#btnCreate').textContent = t('create');
  el('#btnTemplate').textContent = t('template')+': '+(LANG==='fr'?STR.fr.studyTemplate:STR.en.studyTemplate);

  // session panel labels
  el('#btnExit').textContent = t('exit');
  el('#btnResume').textContent = t('resume');
  el('#btnICF').textContent = t('openICF');
  el('#camTitle').textContent = t('camera');
  el('#btnStartCam').textContent = t('startCam');
  el('#btnStopCam').textContent = t('stopCam');
  el('#metricTitle').textContent = t('metrics');
  el('#btnSaveScore').textContent = t('saveScore');
  el('#chartTitle').textContent = t('chart');
  el('#logoNote').textContent = t('logoNote');
  el('#expTitle').textContent = t('export');
  el('#btnX').textContent = t('excel');
  el('#btnP').textContent = t('pdf');
  el('#btnW').textContent = t('word');

  // session header
  if(STATE.studyId){
    const s = db.studies.find(x=>x.id===STATE.studyId);
    el('#sessionStudy').textContent = s? s.name : '';
    const tbody = participantsForStudy(STATE.studyId).map(p=> `<tr>
      <td>${esc(p.code)}</td><td>${esc(p.name||'')}</td>
      <td><button class="btn-ghost" onclick="openParticipant('${p.id}')">Open</button></td>
    </tr>`).join('');
    el('#partBody').innerHTML = tbody || `<tr><td colspan="3" class="small">No participants yet.</td></tr>`;
  }

  // tab switch
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  if(STATE.tab==='admin'){ el('#tab-admin').classList.add('active'); el('#panel-admin').style.display='block'; el('#panel-session').style.display='none';}
  else { el('#tab-session').classList.add('active'); el('#panel-admin').style.display='none'; el('#panel-session').style.display='block'; }

  // deep link
  if(location.hash.startsWith('#session:')){
    const sid = location.hash.split(':')[1];
    STATE.tab='session'; STATE.studyId=sid; render();
  }
}

// copy util
function copy(text){
  navigator.clipboard.writeText(text);
  const btns = [...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Copy')||b.textContent.includes('Copier'));
  btns.forEach(b=>{ b.disabled=true; setTimeout(()=>b.disabled=false,600); });
}

// actions
function useTemplate(){
  el('#study').value = (LANG==='fr')? STR.fr.studyTemplate : STR.en.studyTemplate;
  el('#client').value = TEMPLATE.client;
  el('#product').value = TEMPLATE.product;
  el('#batch').value = TEMPLATE.batch;
  el('#internal').value = TEMPLATE.internal;
  el('#type').value = TEMPLATE.type;
}
function onCreate(){
  const data = {
    name: el('#study').value.trim(),
    client: el('#client').value.trim(),
    product: el('#product').value.trim(),
    batch: el('#batch').value.trim(),
    internal: el('#internal').value.trim(),
    type: el('#type').value.trim(),
    metrics: TEMPLATE.metrics
  };
  if(!data.name){ alert('Missing study name'); return; }
  const s = createStudy(data);
  STATE.studyId = s.id; STATE.tab='session'; render();
}
function openStudy(id){ STATE.studyId=id; STATE.tab='session'; render(); }
function addParticipant(){
  const name = el('#pname').value.trim();
  if(!STATE.studyId){ alert('Open a study'); return; }
  const p = createParticipant(STATE.studyId, name);
  el('#pname').value='';
  render();
}
function openParticipant(pid){
  STATE.participantId = pid;
  const db = loadDB(); const p = db.participants.find(x=>x.id===pid);
  if(!p) return;
  el('#currentCode').textContent = p.code;
  // load sliders
  const keys=TEMPLATE.metrics;
  keys.forEach(k=>{
    const id='m_'+k.replace(/\W+/g,'');
    el('#'+id).value = (p.scores||{})[k] ?? 0;
  });
  // draw chart
  drawChart(p.scores||{});
}
function saveScores(){
  const db = loadDB();
  const pid = STATE.participantId; if(!pid){ alert('Open a participant'); return; }
  const p = db.participants.find(x=>x.id===pid); if(!p) return;
  const keys=TEMPLATE.metrics;
  p.scores = {};
  keys.forEach(k=>{
    const id='m_'+k.replace(/\W+/g,'');
    p.scores[k] = Number(el('#'+id).value);
  });
  saveDB(db);
  drawChart(p.scores);
  render();
}
function sessionExit(){
  // localStorage already persisted — show toast
  alert('Session saved. You can resume later from Admin → Open Session.');
}
function sessionResume(){
  render();
}

// exports for selected study
function doExportExcel(){ const s = getCurrentStudy(); if(s) exportExcel(s); }
function doExportWord(){ const s = getCurrentStudy(); if(s) exportWord(s); }
function doExportPDF(){ const s = getCurrentStudy(); if(s) exportPDF(s); }
function getCurrentStudy(){
  const db=loadDB(); return db.studies.find(x=>x.id===STATE.studyId) || null;
}

// boot: preload one template study if none
(function init(){
  const db = loadDB();
  if((db.studies||[]).length===0){
    createStudy(TEMPLATE);
  }
  render();
  // metric sliders to chart
  document.addEventListener('input', (e)=>{
    if(e.target && e.target.classList.contains('metric')){
      const db=loadDB();
      const p=db.participants.find(x=>x.id===STATE.participantId);
      if(p){
        const keys=TEMPLATE.metrics;
        const live={};
        keys.forEach(k=>{
          const id='m_'+k.replace(/\W+/g,'');
          live[k] = Number(el('#'+id).value);
        });
        drawChart(live);
      }
    }
  });
})();
