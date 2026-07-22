// SANEAS · js/20-miplan.js · Mi Plan Semanal (generador de la clienta)
// ================= MI PLAN SEMANAL (generador de la clienta) =================
// El mismo generador del panel de Oscar, pero la clienta solo ve el suyo.
// Datos: RPC saneas_mi_plan() -> lee auth.uid() y devuelve SU dieta y nada mas.
// No lleva secreto: no hay nada que teclear ni que se pueda copiar del HTML.

document.head.insertAdjacentHTML('beforeend',`<style>
#gendieta{position:fixed;inset:0;background:rgba(16,50,58,.55);z-index:70;display:none;align-items:flex-start;justify-content:center;overflow-y:auto;padding:14px 8px}
#gendieta.show{display:flex}
#gendieta .gdbox{background:#fff;border-radius:16px;padding:20px 16px;width:min(1320px,98vw);position:relative;font-family:'Quicksand',sans-serif}
#gendieta h3{font-size:18px;color:var(--teal);margin-bottom:4px;padding-right:34px}
#gendieta .sub{font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.45}
#gendieta .gd-x{position:absolute;top:12px;right:12px;background:var(--light);border:0;width:34px;height:34px;border-radius:50%;font-size:18px;color:var(--muted);cursor:pointer;font-family:inherit}
.gd-ctrl{display:grid;grid-template-columns:300px 1fr;gap:18px;align-items:start}
@media(max-width:900px){.gd-ctrl{grid-template-columns:1fr}}
.gd-ctrl label{display:block;font-size:12px;font-weight:800;color:var(--muted);margin:0 0 4px}
.gd-ctrl input{width:100%;padding:10px;border:2px solid #dbe7ea;border-radius:9px;font-size:15px;background:#fff;font-family:inherit}
.gd-chip{font-size:13px;color:var(--teal);font-weight:800;margin-top:8px;min-height:16px}
.gd-ayuno{font-size:12px;font-weight:800;margin:8px 0;color:var(--green)}
.gd-ayuno.mal{color:var(--red)}
.gd-horas{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px}
.gd-horas .gh{background:var(--bg);border:1px solid #dbe7ea;border-radius:9px;padding:6px 8px}
.gd-horas .gh b{display:block;font-size:11px;color:var(--muted)}
.gd-horas .gh input{padding:5px 6px;border:1px solid #dbe7ea;border-radius:7px;font-size:14px;margin-top:2px;width:100%;font-family:inherit}
.gd-foot2{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}
.gd-btn{padding:12px 18px;border-radius:10px;border:0;font-weight:800;background:var(--teal);color:#fff;font-family:inherit;font-size:15px;cursor:pointer}
.gd-btn:disabled{opacity:.45;cursor:default}
.gd-btn.gd-pdf{background:#d97757}
#gd_msg{font-size:13px;min-height:16px;margin-top:6px;font-weight:700}
#gd_msg.err{color:var(--red)} #gd_msg.ok{color:var(--green)}
.gd-prev{margin-top:16px;overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px dashed #dbe7ea;border-radius:12px;background:var(--bg);padding:10px}
.gd-vacio{color:var(--muted);font-size:13px;padding:30px;text-align:center}
.gd-pista{font-size:12px;color:var(--muted);font-weight:700;margin-top:8px;text-align:center}
/* Infografia — identica a la del panel: el PDF de la clienta y el de Oscar son el mismo */
.gi{width:1240px;background:#fff;border-radius:10px;padding:18px 20px 12px;position:relative;font-family:'Segoe UI',system-ui,sans-serif;color:#16323a}
.gi-head{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.gi-logo{font-weight:800;font-size:26px;color:#0b6875}
.gi-logo span{color:#F5862E}
.gi-tit{flex:1;text-align:center}
.gi-tit h1{font-size:26px;letter-spacing:.5px;color:#123a55;text-transform:uppercase;margin:0}
.gi-tit .gi-sub{font-size:12px;color:#6b878f;font-weight:700;margin-top:2px}
.gi-idbox{font-size:11px;font-weight:800;color:#6b878f;border:1px solid #dceaee;border-radius:8px;padding:6px 10px;text-align:center}
.gi-grid{display:grid;border:1px solid #d5e4e8;border-radius:8px;overflow:hidden;position:relative}
.gi-hcell{padding:8px 4px;text-align:center;font-weight:800;font-size:14px;color:#fff;text-transform:uppercase;letter-spacing:.5px}
.gi-corner{background:#f7fbfc}
.gi-tcell{padding:10px 8px;font-weight:800;font-size:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2px;border-top:1px solid #d5e4e8}
.gi-tcell .em{font-size:22px}
.gi-tcell .hr{font-size:12px;color:#0b6875}
.gi-cell{border-left:1px solid #e3edef;border-top:1px solid #d5e4e8;padding:7px 8px;font-size:11px;line-height:1.35;background:#fff}
.gi-line{margin-bottom:3px}
.gi-items{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;align-items:center}
.gi-img{width:34px;height:34px;object-fit:cover;border-radius:50%;border:1px solid #e3edef;background:#fff}
.gi-emoji{font-size:22px;line-height:34px}
.gi-mas{font-size:10px;font-weight:800;color:#6b878f}
.gi-foot{display:grid;grid-template-columns:1.2fr 1.2fr .8fr;gap:12px;margin-top:12px}
.gi-foot h5{font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin:0 0 6px;color:#123a55}
.gi-rec,.gi-rac{border:1px solid #dceaee;border-radius:10px;padding:10px 14px;font-size:12px;line-height:1.7}
.gi-rec h5{color:#fff;background:#123a55;margin:-10px -14px 8px;padding:7px 14px;border-radius:9px 9px 0 0}
.gi-agua{border:1px solid #cfe6f5;background:#f2f9fe;border-radius:10px;padding:14px;font-size:13px;font-weight:700;color:#155f8a;display:flex;align-items:center}
.gi-marca{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5}
.gi-marca span{position:absolute;font-size:26px;font-weight:800;color:rgba(11,104,117,.07);white-space:nowrap;transform:rotate(-24deg)}
.gi-pie{margin-top:10px;font-size:10px;color:#6b878f;text-align:center;font-weight:700}
</style>`);

document.body.insertAdjacentHTML('beforeend',`
<div id="gendieta">
  <div class="gdbox">
    <button class="gd-x" onclick="cerrarGen()">×</button>
    <h3>Tu plan semanal</h3>
    <div class="sub">Dime a qué hora cenas y te coloco el resto de las comidas respetando el ayuno nocturno que le toca a tu plan. Puedes cambiar cualquier hora a mano. Después descargas tu plan en PDF.</div>
    <div class="gd-ctrl">
      <div>
        <label>1 · ¿A qué hora cenas?</label>
        <input id="gd_cena" type="time" value="21:00" onchange="genCalcHoras(true)">
        <div class="gd-ayuno" id="gd_ayuno"></div>
        <div class="gd-chip" id="gd_cliinfo"></div>
      </div>
      <div>
        <label>2 · Tus horarios (tócalos si no te cuadran)</label>
        <div class="gd-horas" id="gd_horas"><div class="gd-vacio" style="padding:10px">Cargando tu plan…</div></div>
        <div class="gd-foot2">
          <button class="gd-btn" id="gd_generar" onclick="genRender()" disabled>Ver mi plan</button>
          <button class="gd-btn gd-pdf" id="gd_pdf" onclick="genPDF()" disabled>⬇️ Descargar PDF</button>
        </div>
        <div id="gd_msg"></div>
      </div>
    </div>
    <div class="gd-prev" id="gd_prev"><div class="gd-vacio">Tu plan aparecerá aquí.</div></div>
    <div class="gd-pista">Desliza la tabla con el dedo para ver todos los días →</div>
  </div>
</div>`);

// Las horas de ayuno las decide la DIETA, no la app (regla de Oscar, 17/07/2026):
//   5 platos -> 12 h de ayuno · 4 o 3 platos -> 14 h
// "Plato" = ingesta solida. EnPie y AntesDormir son agua/infusion y NO cuentan
// (skill creadieta-mmd: "no tiene Desayuno ni EnPie como ingesta solida").
// Provisional: manana se afina por dieta. Mientras, sale de la composicion real.
const GEN_PLATOS=['Desayuno','MediaManana','Almuerzo','Merienda','Cena'];
function genHorasAyuno(tomas){
  return (tomas||[]).filter(t=>GEN_PLATOS.includes(t)).length>=5 ? 12 : 14;
}
const GEN_ORDEN=['EnPie','Desayuno','MediaManana','Almuerzo','Merienda','Cena','AntesDormir'];
const GEN_TOMAS={EnPie:{label:'En pie',emoji:'🌅'},Desayuno:{label:'Desayuno',emoji:'☀️'},
  MediaManana:{label:'Media mañana',emoji:'🍏'},Almuerzo:{label:'Almuerzo',emoji:'🍽️'},
  Merienda:{label:'Merienda',emoji:'🥜'},Cena:{label:'Cena',emoji:'🌙'},AntesDormir:{label:'Antes de dormir',emoji:'😴'}};
const GEN_TINTES={EnPie:'#fff8e6',Desayuno:'#fff3d6',MediaManana:'#eef7ea',Almuerzo:'#e6f2ec',Merienda:'#e9eefc',Cena:'#e7ecf4',AntesDormir:'#f3e9f7'};
const GEN_COLORES=['#5b9e48','#8ab55f','#3f8e9b','#8e7cc3','#e69138','#e06e8a','#d0493b'];
const GEN_TAG_IMG={};
const GEN_EMOJI=[[/(pollo|pavo)/,'🍗'],[/salmon/,'🍣'],[/(pescado|merluza|dorada|lubina|bacalao|atun|caballa|sardina|boqueron|gamba|marisco)/,'🐟'],
  [/huevo/,'🥚'],[/(jamon|fiambre|lacon)/,'🥓'],[/(ternera|cerdo|lomo|solomillo|bistec|carne)/,'🥩'],
  [/(arroz|cereal|avena|quinoa)/,'🍚'],[/(patata|batata|boniato|papa)/,'🥔'],[/pasta/,'🍝'],
  [/(lenteja|garbanzo|judia|alubia|frijol|legumbre)/,'🫘'],[/pan/,'🍞'],
  [/(yogur|kefir|leche|lacteo)/,'🥛'],[/queso/,'🧀'],[/aguacate/,'🥑'],[/tomate/,'🍅'],
  [/(manzana|pera|platano|naranja|kiwi|fresa|arandano|melon|sandia|uva|mango|pina|fruta)/,'🍎'],
  [/(nuez|nueces|almendra|anacardo|avellana|pistacho|frutos secos)/,'🥜'],
  [/(ensalada|verdura|brocoli|espinaca|calabacin|lechuga|pimiento|pepino|zanahoria|vegetal|esparrago|champinon|seta)/,'🥗'],
  [/cafe/,'☕'],[/(te |te$|infusion|artemisa|manzanilla)/,'🍵'],[/(agua|limon)/,'💧'],
  [/aceite/,'🫒'],[/(chocolate|cacao)/,'🍫']];
const genNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const gel=id=>document.getElementById(id);
let GEN_PLAN=null,GEN_HORAS={},GEN_NOM='',GEN_UID='';

function genEmoji(s){s=genNorm(s);for(const p of GEN_EMOJI){if(p[0].test(s))return p[1];}return '🍽️';}
function genMin(hm){const p=String(hm||'').split(':');return (Number(p[0])||0)*60+(Number(p[1])||0);}
function genHM(m){m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function genUID(id){return 'SAN-'+String(id||'').replace(/-/g,'').slice(0,8).toUpperCase();}
function genSlug(s){return genNorm(s).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
function genMsg(t,cls){const m=gel('gd_msg');if(!m)return;m.className=cls||'';m.textContent=t||'';}
function cerrarGen(){gel('gendieta').classList.remove('show');}

async function abrirGen(){
  gel('gendieta').classList.add('show');
  if(GEN_PLAN){ genBotones(); return; }
  genMsg('Cargando tu plan…');
  const {data:r,error}=await sb.rpc('saneas_mi_plan');
  if(error||!r||!r.ok){
    gel('gd_horas').innerHTML='<div class="gd-vacio" style="padding:10px">No he podido cargar tu plan.</div>';
    genMsg((r&&r.error==='sin_dieta')?'Todavía no tienes una dieta asignada. En cuanto Oscar te la asigne, aparecerá aquí.':'No he podido cargar tu plan. Prueba en un momento.','err');
    return;
  }
  GEN_NOM=r.cliente||`${CLIENTE.nombre||''} ${CLIENTE.apellido||''}`.trim();
  GEN_UID=genUID(CLIENTE.id);
  gel('gd_cliinfo').textContent=`${r.dieta.nombre_plan} · ID ${GEN_UID}`;
  const dias=[...new Set(r.tomas.map(t=>t.dia_semana))].sort((a,b)=>parseInt(a)-parseInt(b));
  const matriz={};
  r.tomas.forEach(t=>{(matriz[t.toma]=matriz[t.toma]||{})[t.dia_semana]=t;});
  GEN_PLAN={dieta:r.dieta,dias,matriz,tomas:GEN_ORDEN.filter(t=>matriz[t])};
  genMsg('');
  genCalcHoras(true);
  genBotones();
}
function genCalcHoras(auto){
  if(!GEN_PLAN)return;
  const cena=genMin(gel('gd_cena').value||'21:00');
  const AY=genHorasAyuno(GEN_PLAN.tomas);    // 12 h si son 5 platos, 14 h si son 4 o 3
  // El ayuno se cuenta hasta la PRIMERA INGESTA REAL de la dieta, que no siempre es
  // el desayuno: la Fase 1 Insulina no lo tiene y empieza en la media manana.
  // Anclarlo en un desayuno que no existe se comia 2,5 h de mas.
  const dia=GEN_PLATOS.filter(t=>t!=='Cena'&&GEN_PLAN.tomas.includes(t));
  const h={Cena:cena,AntesDormir:(cena+90)%1440};
  if(dia.length){
    const ini=(cena+AY*60)%1440;
    h[dia[0]]=ini;                          // la primera comida, a AY horas de la cena
    h.EnPie=(ini+1440-30)%1440;
    const mids=dia.slice(1);                // el resto, repartido hasta la cena
    const win=(cena-ini+1440)%1440;
    mids.forEach((t,i)=>{h[t]=(ini+Math.round(win*(i+1)/(mids.length+1)/15)*15)%1440;});
  }else{ h.EnPie=(cena+AY*60+1440-30)%1440; }
  GEN_HORAS={}; GEN_PLAN.tomas.forEach(t=>{GEN_HORAS[t]=h[t];});
  gel('gd_horas').innerHTML=GEN_PLAN.tomas.map(t=>`<div class="gh"><b>${GEN_TOMAS[t].emoji} ${GEN_TOMAS[t].label}</b>
    <input type="time" value="${genHM(GEN_HORAS[t])}" oninput="genHoraManual('${t}',this.value)"></div>`).join('');
  genAyuno();
}
function genHoraManual(t,v){if(v){GEN_HORAS[t]=genMin(v);genAyuno();}}
function genAyuno(){
  if(!GEN_PLAN)return;
  const primera=['Desayuno','MediaManana','Almuerzo','Merienda'].find(t=>GEN_HORAS[t]!=null);
  const a=gel('gd_ayuno');
  if(primera==null||GEN_HORAS.Cena==null){a.textContent='';return;}
  const ay=((GEN_HORAS[primera]-GEN_HORAS.Cena)+1440)%1440;
  const hs=Math.floor(ay/60), mn=ay%60;
  a.textContent=`Ayuno nocturno: ${hs} h${mn?' '+mn+' min':''} (cena ${genHM(GEN_HORAS.Cena)} → ${GEN_TOMAS[primera].label.toLowerCase()} ${genHM(GEN_HORAS[primera])})`;
  a.className='gd-ayuno'+(ay<genHorasAyuno(GEN_PLAN.tomas)*60?' mal':'');
}
function genBotones(){gel('gd_generar').disabled=!GEN_PLAN;}
function genDiaLabel(ds){
  const p=String(ds||'').split('_')[1]||String(ds||'');
  if(/^Dia\d+$/i.test(p))return 'Día '+p.replace(/\D/g,'');
  const acc={Miercoles:'Miércoles',Sabado:'Sábado'};
  return acc[p]||p;
}
function genItemsHTML(t){
  const vistos=new Set(), lista=[];
  (t.items||[]).forEach(it=>{const k=genNorm(it.nombre).slice(0,14);if(vistos.has(k))return;vistos.add(k);lista.push(it);});
  const max=4, extra=lista.length-max;
  let h=lista.slice(0,max).map(it=>{
    const src=GEN_TAG_IMG[genNorm(it.nombre)]||it.img;
    return src?`<img class="gi-img" src="${esc(src)}" alt="" title="${esc(it.nombre)}" data-emoji="${genEmoji(it.nombre)}" loading="lazy" referrerpolicy="no-referrer" onerror="genImgErr(this)">`
              :`<span class="gi-emoji" title="${esc(it.nombre)}">${genEmoji(it.nombre)}</span>`;
  }).join('');
  if(!lista.length&&t.tags)h=String(t.tags).split(',').slice(0,4).map(x=>`<span class="gi-emoji" title="${esc(x.trim())}">${genEmoji(x)}</span>`).join('');
  if(extra>0)h+=`<span class="gi-mas">+${extra}</span>`;
  return h?`<div class="gi-items">${h}</div>`:'';
}
function genImgErr(im){
  const s=document.createElement('span');s.className='gi-emoji';s.textContent=im.dataset.emoji||'🍽️';s.title=im.title;im.replaceWith(s);
}
function genRender(){
  if(!GEN_PLAN){genMsg('Tu plan aún no ha cargado.','err');return;}
  const p=GEN_PLAN, nom=GEN_NOM, uid=GEN_UID;
  const fecha=new Date().toLocaleDateString('es-ES',{timeZone:'Atlantic/Canary'});
  const AGUA=aguaDiariaTexto();   // el mismo litraje que ve en "Agua de hoy": si no hay peso, no se inventa
  const nd=p.dias.length;
  let g=`<div class="gi-grid" style="grid-template-columns:150px repeat(${nd},1fr)">`;
  g+=`<div class="gi-hcell gi-corner"></div>`;
  p.dias.forEach((d,i)=>{g+=`<div class="gi-hcell" style="background:${GEN_COLORES[i%GEN_COLORES.length]}">${genDiaLabel(d)}</div>`;});
  p.tomas.forEach(t=>{
    g+=`<div class="gi-tcell" style="background:${GEN_TINTES[t]}"><span class="em">${GEN_TOMAS[t].emoji}</span>${GEN_TOMAS[t].label}<span class="hr">${genHM(GEN_HORAS[t])}</span></div>`;
    p.dias.forEach(d=>{
      const c=p.matriz[t][d];
      g+=`<div class="gi-cell">`+(c?String(c.texto||'').split('|').map(s=>s.trim()).filter(Boolean).map(s=>`<div class="gi-line">${esc(s)}</div>`).join('')+genItemsHTML(c):'<span class="mini">—</span>')+`</div>`;
    });
  });
  g+=`</div>`;
  let marca='';
  for(let i=0;i<12;i++)marca+=`<span style="left:${(i%3)*36+2}%;top:${Math.floor(i/3)*26+6}%">${esc(nom)} · ${uid}</span>`;
  gel('gd_prev').innerHTML=`<div class="gi" id="gd_infografia">
    <div class="gi-head">
      <div class="gi-logo">Saneas<span>·</span></div>
      <div class="gi-tit"><h1>Plan Semanal de Alimentación</h1>
        <div class="gi-sub">${esc(p.dieta.nombre_plan)} · ${esc(nom)} · ${fecha}</div></div>
      <div class="gi-idbox">ID<br>${uid}</div>
    </div>
    <div style="position:relative">${g}<div class="gi-marca">${marca}</div></div>
    <div class="gi-foot">
      <div class="gi-rec"><h5>✅ Recomendaciones importantes</h5>
        <div>✔️ Cocina sin aceite.</div><div>✔️ Usa todas las especias que desees.</div><div>✔️ ${AGUA?`Recuerda que tienes que beber durante estas dos semanas <b>${AGUA} litros al día</b>.`:'Bebe suficiente agua durante el día.'}</div></div>
      <div class="gi-rac"><h5>Raciones por comida</h5>
        <div>✋ Proteína: la palma de la mano abierta.</div><div>✊ Hidratos: el tamaño del puño cerrado.</div><div>🥗 Vegetales, la mitad del plato: recuerda que es la parte más grande del plato.</div></div>
      <div class="gi-agua">🍽️ Recuerda no mezclar hidratos y grasas en la misma digestión durante estas dos semanas.</div>
    </div>
    <div class="gi-pie">Documento personal e intransferible de ${esc(nom)} · ID ${uid} · Generado el ${fecha} · Saneas®</div>
  </div>`;
  gel('gd_pdf').disabled=false;
  genMsg('Aquí lo tienes. Descárgalo en PDF cuando quieras.','ok');
}
function genScript(u){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=u;s.onload=res;s.onerror=()=>rej(new Error('No se pudo cargar '+u));document.head.appendChild(s);});}
async function genLibs(){
  if(!window.html2canvas)await genScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  if(!window.jspdf)await genScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
}
const GEN_IMG_CACHE=new Map();
function genDataURL(url){
  if(GEN_IMG_CACHE.has(url))return GEN_IMG_CACHE.get(url);
  const p=(async()=>{
    const ctl=new AbortController(); const tm=setTimeout(()=>ctl.abort(),6000);
    try{
      const r=await fetch(url,{mode:'cors',signal:ctl.signal}); if(!r.ok)throw new Error('http '+r.status);
      const bl=await r.blob();
      return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(bl);});
    }finally{clearTimeout(tm);}
  })();
  GEN_IMG_CACHE.set(url,p);
  p.catch(()=>GEN_IMG_CACHE.delete(url));
  return p;
}
async function genIncrustaImgs(node){
  await Promise.all([...node.querySelectorAll('img.gi-img')].map(async im=>{
    try{
      if(im.src.startsWith('data:'))return;
      im.src=await genDataURL(im.src);
      if(!im.complete)await new Promise(res=>{im.onload=res;im.onerror=res;setTimeout(res,3000);});
    }catch(e){genImgErr(im);}
  }));
}
async function genPDF(){
  const src=gel('gd_infografia');
  if(!src){genMsg('Dale antes a "Ver mi plan".','err');return;}
  const b=gel('gd_pdf'); b.disabled=true; const t0=b.textContent; b.textContent='Preparando PDF…';
  let node=null;
  try{
    await genLibs();
    node=src.cloneNode(true);
    node.style.position='fixed'; node.style.left='-20000px'; node.style.top='0';
    document.body.appendChild(node);
    await genIncrustaImgs(node);
    const canvas=await html2canvas(node,{scale:2,backgroundColor:'#ffffff',logging:false});
    node.remove(); node=null;
    const ratio=canvas.height/canvas.width;
    // A4 SIEMPRE APAISADO, margenes estrechos y a pagina completa (Oscar, 22/07/2026).
    const M=5, W=297-2*M, H=210-2*M;
    const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    let iw=W, ih=W*ratio;
  if(ih>H){ ih=H; iw=H/ratio; }   // encaja entero en UNA sola pagina
  const ox=M+(W-iw)/2, oy=M+(H-ih)/2;  // centrado
  const h=ih;
    if(h<=H){ pdf.addImage(canvas.toDataURL('image/jpeg',0.92),'JPEG',ox,oy,iw,ih); }
    else{
      const pagePx=Math.floor(canvas.width*H/W); let y=0,primera=true;
      while(y<canvas.height){
        const sh=Math.min(pagePx,canvas.height-y);
        const c2=document.createElement('canvas'); c2.width=canvas.width; c2.height=sh;
        c2.getContext('2d').drawImage(canvas,0,y,canvas.width,sh,0,0,canvas.width,sh);
        if(!primera)pdf.addPage(); primera=false;
        pdf.addImage(c2.toDataURL('image/jpeg',0.92),'JPEG',M,M,W,W*sh/canvas.width);
        y+=sh;
      }
    }
    pdf.save('Saneas_Plan_'+genSlug(GEN_PLAN.dieta.nombre_plan)+'_'+genSlug(GEN_NOM)+'.pdf');
    genMsg('PDF descargado.','ok'); toast('⬇️ PDF descargado');
  }catch(e){
    if(node)node.remove();
    genMsg('No se pudo crear el PDF: '+(e&&e.message||e),'err');
  }
  b.disabled=false; b.textContent=t0;
}
// ================= FIN MI PLAN SEMANAL =================

