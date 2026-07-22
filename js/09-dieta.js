// SANEAS · js/09-dieta.js · Pizarra de dieta y lista de la compra
// ====== RENDER DIETA ======
let DIA_SEL=null;
async function renderDieta(){
  const cont=document.getElementById('s-dieta');
  if(!DIETA){cont.innerHTML='<div class="empty">Aún no tienes una dieta asignada.</div>';return;}
  DIA_SEL=DIA_SEL||DIA_MAP[new Date().getDay()];
  const dias=[['1_Dia1','Lun'],['2_Dia2','Mar'],['3_Dia3','Mié'],['4_Dia4','Jue'],['5_Dia5','Vie'],['6_Dia6','Sáb'],['7_Domingo','Dom']];
  const tomas=await tomasDe(DIETA.id,DIA_SEL);
  const CAL=calcCalorias();
  const pctMap=repartoComidas(comidasCalDe(tomas));
  cont.innerHTML=`
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:4px 6px 12px">
      <div style="min-width:0">
        <p style="font-size:18px;font-weight:800;margin:0">Tu dieta</p>
        <p style="font-size:16px;font-weight:800;color:#d97757;margin:3px 0 0">${fmt(DIETA.nombre_plan)}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;flex-shrink:0">
        <button onclick="abrirGen()" style="display:flex;align-items:center;justify-content:center;gap:7px;background:var(--teal);color:#fff;border:2px solid var(--teal);border-radius:12px;padding:8px 13px;font-family:inherit;font-weight:800;font-size:14px;white-space:nowrap;cursor:pointer;box-shadow:0 2px 6px rgba(26,46,53,.10)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="10" x2="9" y2="22"/><line x1="15" y1="10" x2="15" y2="22"/></svg>Tu plan semanal</button>
        <button onclick="abrirCompra(CLIENTE.dieta_actual_id)" style="display:flex;align-items:center;justify-content:center;gap:7px;background:#fff;color:var(--teal);border:2px solid var(--teal);border-radius:12px;padding:8px 13px;font-family:inherit;font-weight:800;font-size:14px;white-space:nowrap;cursor:pointer;box-shadow:0 2px 6px rgba(26,46,53,.10)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3890a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M1 1h3l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>Lista de la compra</button>
      </div>
    </div>
    ${CAL?`<div class="card" style="text-align:center;padding:12px"><div style="font-size:14px;color:var(--muted);font-weight:700">Objetivo del día (${CAL.objLabel})</div><div style="font-size:22px;font-weight:800;color:var(--teal)">${CAL.objetivo} kcal</div><div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px"><span style="white-space:nowrap">P ${macrosDe(CAL.objetivo).prot}g</span> · <span style="white-space:nowrap">HC ${macrosDe(CAL.objetivo).hc}g</span> · <span style="white-space:nowrap">G ${macrosDe(CAL.objetivo).grasa}g</span></div></div>`:''}
    <div class="daysel">${dias.map(d=>`<button class="${d[0]===DIA_SEL?'active':''}" onclick="selDia('${d[0]}')">${d[1]}</button>`).join('')}</div>
    ${tomas.length===0?'<div class="empty">Sin comidas para este día.</div>':tomas.map(t=>{
      const i=TOMA_INFO[t.toma]||['🍴',t.toma];
      const prods=(t.toma_productos||[]).map(x=>x.productos).filter(p=>p&&p.disponible!==false);
      const recs=(t.toma_recetas||[]).map(x=>x.recetas).filter(Boolean);
      prods.forEach(p=>PRODUCTOS_CACHE[p.id]=p); recs.forEach(r=>RECETAS_CACHE[r.id]=r);
      return `<div class="card"><div class="plato">
        <h4>${i[0]} ${i[1]}</h4><p>${listar(t.texto)}</p>        ${prods.length?`<div class="relh">🛒 Artículos de tienda</div><div class="chips">${prods.map(p=>`<span class="chip shop link" onclick="verProducto('${p.id}')">🛒 ${p.nombre} ›</span>`).join('')}</div>`:''}
        ${recs.length?`<div class="relh">👩‍🍳 Recetas relacionadas</div><div class="chips">${recs.map(r=>`<span class="chip rec link" onclick="verReceta('${r.id}')">👩‍🍳 ${r.nombre} ›</span>`).join('')}</div>`:''}
      </div></div>`;}).join('')}`;
}
function selDia(d){DIA_SEL=d;renderDieta();}

// ====== LISTA DE LA COMPRA (dieta actual + próxima) ======
let COMPRA_DIETA=null, COMPRA_ITEMS=[], COMPRA_CHECKS={};
function abrirCompra(dietaId){
  COMPRA_DIETA=dietaId||CLIENTE.dieta_actual_id||null;
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  const c=document.getElementById('s-compra'); c.classList.remove('hidden'); c.scrollTop=0;
  renderCompra();
}
function volverDieta(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  document.getElementById('s-dieta').classList.remove('hidden');
}
// Nombre base del plan (quita el sufijo de semana "_sN"): "Fase 1 - Insulina_s1" -> "Fase 1 - Insulina"
function planBase(n){ return String(n||'').replace(/_s\d+\s*$/i,'').trim(); }
async function renderCompra(){
  const cont=document.getElementById('s-compra');
  const header=`<div style="display:flex;align-items:center;gap:12px;margin:4px 6px 12px">
      <button onclick="volverDieta()" style="background:none;border:none;color:var(--teal);font-family:inherit;font-weight:800;font-size:16px;cursor:pointer;padding:4px 0">← Volver</button>
      <p style="font-size:18px;font-weight:800">Lista de la compra</p>
    </div>`;
  cont.innerHTML=header+'<div class="empty">Cargando tu lista…</div>';
  const id=COMPRA_DIETA;
  if(!id){ cont.innerHTML=header+'<div class="empty">Aún no tienes una dieta asignada.</div>'; return; }
  const label = (id===CLIENTE.dieta_proxima_id) ? 'Próxima dieta' : 'Dieta actual';
  const checkMap={};
  try{ const {data:chks}=await sb.from('lista_compra_check').select('item_id,checked').eq('cliente_id',CLIENTE.id); (chks||[]).forEach(c=>{ checkMap[c.item_id]=c.checked; }); }catch(e){}
  const {data:d}=await sb.from('dietas').select('*').eq('id',id).maybeSingle();
  if(!d){ cont.innerHTML=header+'<div class="empty">No se encontró la dieta.</div>'; return; }
  const {data:items}=await sb.from('lista_compra').select('id,categoria,supermercado,producto').eq('nombre_plan',planBase(d.nombre_plan)).order('categoria').order('id');
  COMPRA_ITEMS=items||[]; COMPRA_CHECKS=checkMap;
  cont.innerHTML=header+_seccionCompra(label,d,COMPRA_ITEMS,checkMap);
}
// Cuerpo de la lista, filtrado por supermercado ('' = todos, '__sin__' = sin asignar)
function _cuerpoCompra(items,checkMap,sup){
  const norma=it=>String(it.supermercado||'').trim();
  const f = !sup ? items
    : (sup==='__sin__' ? items.filter(it=>!norma(it)) : items.filter(it=>norma(it)===sup));
  if(!f.length) return '<p style="font-size:14px;font-weight:600;color:var(--muted)">No hay artículos de ese supermercado en esta lista.</p>';
  let body='';
  const cats={}; f.forEach(it=>{ const c=it.categoria||'Otros'; (cats[c]=cats[c]||[]).push(it); });
  Object.keys(cats).forEach(cat=>{
    body+=`<div class="lc-cat">${cat}</div>`;
    cats[cat].forEach(it=>{ const on=checkMap[it.id]===true;
      body+=`<div class="lc-item${on?' done':''}" id="lc-${it.id}">
        <div class="lc-name">${it.producto}${it.supermercado?`<div class="lc-sup">${it.supermercado}</div>`:''}</div>
        <button class="lc-chk ${on?'on':'off'}" onclick="toggleCompra(${it.id},this)" aria-label="marcar como comprado">${on?'✓':'✕'}</button>
      </div>`;
    });
  });
  return body;
}
function filtrarCompra(){
  const sup=(document.getElementById('lc_super')||{}).value||'';
  const b=document.getElementById('lc-body');
  if(b) b.innerHTML=_cuerpoCompra(COMPRA_ITEMS,COMPRA_CHECKS,sup);
}
function _seccionCompra(label,d,items,checkMap){
  const url=d&&d.lista_compra_url;
  const btn = url
    ? `<a class="btn" style="display:block;text-align:center;text-decoration:none;margin-top:16px" href="${url}" target="_blank" rel="noopener">⬇️ Descargar la lista</a>`
    : `<button class="btn" disabled style="margin-top:16px;opacity:.55">⬇️ Descarga próximamente</button>`;
  const head=`<h2 class="sec">${label}</h2>
    <p style="font-size:16px;font-weight:800;color:#d97757;margin:0 6px 10px">${fmt(d&&d.nombre_plan)}</p>`;
  if(!items.length) return head+`<div class="card"><p style="font-size:14px;font-weight:600;color:var(--muted)">Sin artículos para esta dieta todavía.</p>${btn}</div>`;
  // Desplegable con los supermercados que aparecen en ESTA lista (sin opciones vacías)
  const sups=[...new Set(items.map(it=>String(it.supermercado||'').trim()).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'es'));
  const haySin=items.some(it=>!String(it.supermercado||'').trim()); const porDefecto=sups.includes('Mercadona')?'Mercadona':'';
  const opts=['<option value="">🏪 Todos los supermercados</option>']
    .concat(sups.map(s=>`<option value="${s}"${s===porDefecto?' selected':''}>${s}</option>`))
    .concat(haySin?['<option value="__sin__">Sin supermercado</option>']:[]).join('');
  const sel=sups.length?`<select class="search" id="lc_super" onchange="filtrarCompra()" style="margin:0 6px 10px">${opts}</select>`:'';
  return head+sel+`<div class="card"><div id="lc-body">${_cuerpoCompra(items,checkMap,porDefecto)}</div>${btn}</div>`;
}
async function toggleCompra(id, btn){
  const on=!btn.classList.contains('on');
  btn.classList.toggle('on',on); btn.classList.toggle('off',!on); btn.textContent=on?'✓':'✕';
  const it=document.getElementById('lc-'+id); if(it) it.classList.toggle('done',on);
  try{ await sb.from('lista_compra_check').upsert({cliente_id:CLIENTE.id,item_id:id,checked:on},{onConflict:'cliente_id,item_id'}); }catch(e){ console.error('check',e); }
}

