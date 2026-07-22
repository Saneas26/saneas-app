// SANEAS · js/21-diario.js · Diario de comidas (fase 1): buscador sobre la biblioteca + entrada a mano
// La biblioteca es la tabla `alimentos`: capa nutricional del CAT_Tienda (productos) + genéricos.
// Cada apunte guarda una FOTO de kcal/macros: si la biblioteca se corrige, el histórico no cambia.

let DIARIO_HOY=null;      // filas de hoy (null = aún cargando)
let DIARIO_ERROR=false;   // true si las tablas aún no existen en Supabase (fase 1 sin instalar)
let DIARIO_SEL=null;      // alimento elegido en el buscador
let _aliTimer=null;
let _aliRes=[];

async function cargarDiario(){
  if(typeof CLIENTE==='undefined'||!CLIENTE||!CLIENTE.id) return;
  try{
    const {data,error}=await sb.from('diario_comidas').select('*')
      .eq('cliente_id',CLIENTE.id).eq('fecha',_hoyCanarias()).order('creado_en');
    if(error){ DIARIO_ERROR=true; DIARIO_HOY=[]; }
    else { DIARIO_ERROR=false; DIARIO_HOY=data||[]; }
  }catch(e){ DIARIO_ERROR=true; DIARIO_HOY=[]; }
  pintarDiario();
}

function _diaTomaDefecto(){
  try{
    const h=(new Intl.DateTimeFormat('en-GB',{timeZone:'Atlantic/Canary',hour:'2-digit',hour12:false}).format(new Date()))|0;
    if(h<11) return 'Desayuno';
    if(h<13) return 'MediaManana';
    if(h<16) return 'Almuerzo';
    if(h<19) return 'Merienda';
    if(h<23) return 'Cena';
    return 'AntesDormir';
  }catch(e){ return 'Almuerzo'; }
}
function _diaIcoToma(t){ return (TOMA_INFO[t]&&TOMA_INFO[t][0])||'🍴'; }
const _r0=x=>Math.round(Number(x)||0);

function pintarDiario(){
  const cont=document.getElementById('s-dieta'); if(!cont) return;
  if(DIARIO_HOY===null) return;                       // aún cargando: no pintar nada a medias
  let host=document.getElementById('diarioPanel');
  if(!host){ host=document.createElement('div'); host.id='diarioPanel'; }
  const fase=document.getElementById('fasePanel');    // el diario va justo debajo de la fase
  const bien = fase ? (fase.nextElementSibling===host) : (cont.firstElementChild===host);
  if(host.parentNode!==cont || !bien) cont.insertBefore(host, fase?fase.nextSibling:cont.firstChild);

  const kcal=DIARIO_HOY.reduce((s,r)=>s+(+r.kcal||0),0);
  const prot=DIARIO_HOY.reduce((s,r)=>s+(+r.prot||0),0);
  const hc=DIARIO_HOY.reduce((s,r)=>s+(+r.hc||0),0);
  const gra=DIARIO_HOY.reduce((s,r)=>s+(+r.grasa||0),0);
  const CAL=(typeof calcCalorias==='function')?calcCalorias():null;
  const obj=CAL?CAL.objetivo:null;
  const MAC=(obj&&typeof macrosDe==='function')?macrosDe(obj):null;
  const pct=obj?Math.min(100,Math.round(kcal/obj*100)):0;

  const sig=DIARIO_HOY.map(r=>r.id).join(',')+'|'+_r0(kcal)+'|'+(DIARIO_ERROR?'e':'')+'|'+(obj||'');
  if(host.getAttribute('data-dia')===sig) return;

  if(DIARIO_ERROR){
    host.innerHTML='<div class="card diaCard"><div class="diaTit">📒 Tu diario de comidas</div>'
      +'<p class="diaVacio">Muy pronto podrás apuntar aquí lo que comes y ver tus calorías del día en tiempo real.</p></div>';
    host.setAttribute('data-dia',sig); return;
  }

  host.innerHTML=`<div class="card diaCard">
    <div class="diaTit">📒 Tu diario de hoy</div>
    ${obj?`<div class="diaTotal"><span class="n">${_r0(kcal)}</span><span class="de"> / ${obj} kcal</span></div>
    <div class="diaBar"><i style="width:${pct}%;${kcal>obj?'background:var(--orange)':''}"></i></div>
    <div class="diaMacros">
      <span>P <b>${_r0(prot)}</b>${MAC?'<em>/'+MAC.prot+'g</em>':'<em>g</em>'}</span>
      <span>HC <b>${_r0(hc)}</b>${MAC?'<em>/'+MAC.hc+'g</em>':'<em>g</em>'}</span>
      <span>G <b>${_r0(gra)}</b>${MAC?'<em>/'+MAC.grasa+'g</em>':'<em>g</em>'}</span>
    </div>`
    :`<div class="diaTotal"><span class="n">${_r0(kcal)}</span><span class="de"> kcal hoy</span></div>`}
    ${DIARIO_HOY.length?DIARIO_HOY.map(r=>`<div class="diaItem">
      <span class="ico">${_diaIcoToma(r.toma)}</span>
      <span class="tx">${esc(r.nombre)}<small>${_r0(r.gramos)} g · ${_r0(r.kcal)} kcal</small></span>
      <button class="quitar" onclick="borrarDiario('${r.id}')" title="Quitar">✕</button>
    </div>`).join(''):'<p class="diaVacio">Aún no has apuntado nada hoy. Cada comida apuntada es una decisión consciente 💚</p>'}
    <button class="diaBtn" onclick="abrirDiarioBuscar()">➕ Añadir alimento</button>
  </div>`;
  host.setAttribute('data-dia',sig);
}

// ---------- Buscador (biblioteca unificada: tienda + genéricos) ----------
function abrirDiarioBuscar(){
  DIARIO_SEL=null; _aliRes=[];
  const tomas=Object.keys(TOMA_INFO).concat(['Otra']);
  const def=_diaTomaDefecto();
  abrirDetalle('Añadir a tu diario',`
    <select id="aliToma" class="search" style="margin-bottom:8px">
      ${tomas.map(t=>`<option value="${t}"${t===def?' selected':''}>${t==='Otra'?'🍴 Otra':_diaIcoToma(t)+' '+((TOMA_INFO[t]&&TOMA_INFO[t][1])||t)}</option>`).join('')}
    </select>
    <input class="search" id="aliQ" oninput="buscarAli()" placeholder="🔎 Busca un alimento (ej: pollo, yogur...)" autocomplete="off">
    <div id="aliRes"><div class="empty">Escribe arriba para buscar en la biblioteca Saneas.</div></div>
    <button class="diaScan" onclick="escanearAli()">📷 Escanear código de barras</button>
    <button class="diaMano" onclick="aManoAli()">✍️ ¿No lo encuentras? Apúntalo a mano</button>
    <p class="diaFuente">Biblioteca: Saneas · BEDCA · Open Food Facts (ODbL)</p>`);
  const q=document.getElementById('aliQ'); if(q) setTimeout(()=>q.focus(),250);
}
function buscarAli(){
  clearTimeout(_aliTimer);
  _aliTimer=setTimeout(async ()=>{
    pararEscaner();
    const q=(document.getElementById('aliQ')||{}).value||'';
    const res=document.getElementById('aliRes'); if(!res) return;
    if(q.trim().length<2){ res.innerHTML='<div class="empty">Escribe al menos 2 letras.</div>'; return; }
    res.innerHTML='<div class="spinner"></div>';
    try{
      const {data,error}=await sb.from('alimentos')
        .select('id,nombre,marca,kcal_100,prot_100,hc_100,grasa_100')
        .ilike('nombre','%'+q.trim()+'%').eq('activo',true).order('nombre').limit(25);
      if(error) throw error;
      _aliRes=data||[];
      res.innerHTML=_aliRes.length?_aliRes.map((a,i)=>`<button class="diaRes" onclick="elegirAli(${i})">
          <span class="tx">${esc(a.nombre)}${a.marca?`<small>${esc(a.marca)}</small>`:''}</span>
          <span class="kc">${_r0(a.kcal_100)}<small>kcal/100g</small></span>
        </button>`).join('')
        :'<div class="empty">Nada con ese nombre. Prueba con otra palabra o apúntalo a mano 👇</div>';
    }catch(e){ res.innerHTML='<div class="empty">La biblioteca aún no está disponible. Apúntalo a mano 👇</div>'; }
  },300);
}
function elegirAli(i){ _porcionUI(_aliRes[i]); }
function _porcionUI(a){
  DIARIO_SEL=a; if(!DIARIO_SEL) return;
  const res=document.getElementById('aliRes'); if(!res) return;
  res.innerHTML=`<div class="card diaPorcion">
    <div class="nom">${esc(a.nombre)}${a.marca?` <small>· ${esc(a.marca)}</small>`:''}</div>
    <div class="c100">${_r0(a.kcal_100)} kcal · P ${_r0(a.prot_100)} · HC ${_r0(a.hc_100)} · G ${_r0(a.grasa_100)} (por 100 g)</div>
    <div class="chips">${[50,100,150,200,250].map(g=>`<button onclick="document.getElementById('aliG').value=${g};previewAli()">${g} g</button>`).join('')}</div>
    <div class="fila"><input id="aliG" type="number" inputmode="numeric" min="1" max="3000" value="100" oninput="previewAli()"><span>gramos</span></div>
    <div class="prev" id="aliPrev">= ${_r0(a.kcal_100)} kcal</div>
    <button class="diaBtn" onclick="anadirAli()">Añadir a mi diario</button>
  </div>`;
}
function previewAli(){
  const a=DIARIO_SEL; if(!a) return;
  const g=Number((document.getElementById('aliG')||{}).value)||0;
  const p=document.getElementById('aliPrev');
  if(p) p.textContent='= '+_r0(a.kcal_100*g/100)+' kcal · P '+_r0(a.prot_100*g/100)+' · HC '+_r0(a.hc_100*g/100)+' · G '+_r0(a.grasa_100*g/100);
}
async function anadirAli(){
  const a=DIARIO_SEL; if(!a) return;
  const g=Number((document.getElementById('aliG')||{}).value)||0;
  if(g<=0||g>3000) return;
  await _insertarDiario({ alimento_id:a.id||null, nombre:a.nombre, gramos:g,
    kcal:+(a.kcal_100*g/100).toFixed(1), prot:+(a.prot_100*g/100).toFixed(1),
    hc:+(a.hc_100*g/100).toFixed(1), grasa:+(a.grasa_100*g/100).toFixed(1) });
}

// ---------- Entrada a mano (nombres genéricos, decisión de Oscar) ----------
function aManoAli(){
  pararEscaner();
  const res=document.getElementById('aliRes'); if(!res) return;
  res.innerHTML=`<div class="card diaPorcion">
    <div class="nom">✍️ Apuntar a mano</div>
    <div class="field"><label>¿Qué has comido?</label><input id="mNom" placeholder="ej: Lentejas de mi madre"></div>
    <div class="fila"><input id="mG" type="number" inputmode="numeric" min="1" max="3000" value="100"><span>gramos (aprox)</span></div>
    <div class="field"><label>Calorías aproximadas de esa ración</label><input id="mKcal" type="number" inputmode="numeric" min="0" placeholder="ej: 250"></div>
    <p class="diaFuente" style="text-align:left">Si no sabes las calorías, pon tu mejor estimación: apuntar ya es la mitad del trabajo.</p>
    <button class="diaBtn" onclick="anadirMano()">Añadir a mi diario</button>
  </div>`;
  const n=document.getElementById('mNom'); if(n) n.focus();
}
async function anadirMano(){
  const nom=((document.getElementById('mNom')||{}).value||'').trim();
  const g=Number((document.getElementById('mG')||{}).value)||100;
  const k=Number((document.getElementById('mKcal')||{}).value);
  if(!nom){ const n=document.getElementById('mNom'); if(n) n.focus(); return; }
  if(!(k>=0)||g<=0||g>3000){ const e=document.getElementById('mKcal'); if(e) e.focus(); return; }
  await _insertarDiario({ alimento_id:null, nombre:nom, gramos:g, kcal:k, prot:0, hc:0, grasa:0 });
}

async function _insertarDiario(row){
  const toma=((document.getElementById('aliToma')||{}).value)||'Otra';
  try{
    const {error}=await sb.from('diario_comidas').insert(Object.assign({
      cliente_id:CLIENTE.id, fecha:_hoyCanarias(), toma:toma },row));
    if(error) throw error;
    cerrarDetalle();
    try{ toast('Apuntado en tu diario 🥗'); }catch(e){}
    await cargarDiario();
  }catch(e){ alert('No se pudo guardar, inténtalo de nuevo.'); }
}
// ---------- Escáner de código de barras (fase 3) ----------
// 1º busca el código en NUESTRA biblioteca; si no está, pregunta a Open Food
// Facts al vuelo (solo lectura; el apunte se guarda como foto, sin tocar la
// biblioteca: los códigos nuevos entran por el importador que revisa Oscar).
let _scanReader=null;
function _cargarZXing(){
  return new Promise((ok,ko)=>{
    if(window.ZXing) return ok();
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
    s.onload=()=>ok(); s.onerror=()=>ko(new Error('No se pudo cargar el lector'));
    document.head.appendChild(s);
  });
}
function pararEscaner(){ try{ if(_scanReader){ _scanReader.reset(); _scanReader=null; } }catch(e){} }
async function escanearAli(){
  const res=document.getElementById('aliRes'); if(!res) return;
  res.innerHTML=`<div class="card diaPorcion" style="text-align:center">
    <div class="nom">📷 Apunta al código de barras</div>
    <video id="scanVid" playsinline muted style="width:100%;border-radius:12px;background:#000;min-height:190px;margin-top:8px"></video>
    <div class="c100" id="scanMsg" style="margin-top:8px">Encendiendo la cámara…</div>
    <div class="fila" style="margin-top:6px"><input id="scanManual" type="number" inputmode="numeric" placeholder="o escribe aquí los números del código"></div>
    <button class="diaMano" style="margin-top:8px" onclick="buscarPorCodigo((document.getElementById('scanManual')||{}).value)">Buscar este código</button>
    <button class="diaBtn" style="background:#8aa4ad;margin-top:8px" onclick="pararEscaner();abrirDiarioBuscar()">Cancelar</button>
  </div>`;
  try{
    await _cargarZXing();
    _scanReader=new ZXing.BrowserMultiFormatReader();
    _scanReader.decodeFromVideoDevice(null,'scanVid',function(r){
      if(r){ const c=r.getText(); pararEscaner(); buscarPorCodigo(c); }
    });
    const m=document.getElementById('scanMsg'); if(m) m.textContent='Centra el código en la imagen';
  }catch(e){
    const m=document.getElementById('scanMsg');
    if(m) m.textContent='No se pudo abrir la cámara. Escribe el código a mano 👇';
  }
}
async function buscarPorCodigo(code){
  pararEscaner();
  code=String(code||'').replace(/\D/g,'');
  const res=document.getElementById('aliRes'); if(!res) return;
  if(code.length<8){ res.innerHTML='<div class="empty">Ese código no parece completo (mínimo 8 números).</div>'; return; }
  res.innerHTML='<div class="spinner"></div>';
  try{
    const {data}=await sb.from('alimentos')
      .select('id,nombre,marca,kcal_100,prot_100,hc_100,grasa_100')
      .eq('codigo_barras',code).eq('activo',true).limit(1);
    if(data&&data[0]){ _porcionUI(data[0]); return; }
  }catch(e){}
  try{
    const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+code+'.json?fields=product_name_es,product_name,brands,nutriments');
    const j=await r.json();
    const p=j&&j.product, n=(p&&p.nutriments)||{};
    let kcal=n['energy-kcal_100g'];
    if(kcal==null&&n.energy_100g!=null) kcal=Math.round(n.energy_100g/4.184);
    if(p&&kcal!=null){
      _porcionUI({ id:null, nombre:(p.product_name_es||p.product_name||('Producto '+code)),
        marca:(p.brands||'').split(',')[0]||null,
        kcal_100:+kcal, prot_100:+(n.proteins_100g||0), hc_100:+(n.carbohydrates_100g||0), grasa_100:+(n.fat_100g||0) });
      return;
    }
  }catch(e){}
  res.innerHTML='<div class="empty">No encontramos ese código. Apúntalo a mano 👇</div>';
}
// La cámara se apaga SIEMPRE al cerrar el panel de detalle, se cierre como se cierre
const _cerrarDetalleSinEscaner=cerrarDetalle;
cerrarDetalle=function(){ pararEscaner(); _cerrarDetalleSinEscaner(); };

async function borrarDiario(id){
  try{
    const {error}=await sb.from('diario_comidas').delete().eq('id',id).eq('cliente_id',CLIENTE.id);
    if(error) throw error;
    DIARIO_HOY=(DIARIO_HOY||[]).filter(r=>r.id!==id);
    pintarDiario();
  }catch(e){ alert('No se pudo quitar, inténtalo de nuevo.'); }
}
