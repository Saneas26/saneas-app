// SANEAS · js/09-dieta.js · Pizarra de dieta y lista de la compra
// ====== RENDER DIETA ======
let DIA_SEL=null;
async function renderDieta(){
  const cont=document.getElementById('s-dieta');
  if(!DIETA){cont.innerHTML='<div class="empty">Aún no tienes una dieta asignada.</div>';return;}
  DIA_SEL=DIA_SEL||DIA_MAP[new Date().getDay()];
  const dias=[['1_Dia1','Lun'],['2_Dia2','Mar'],['3_Dia3','Mié'],['4_Dia4','Jue'],['5_Dia5','Vie'],['6_Dia6','Sáb'],['7_Domingo','Dom']];
  const tomas=await tomasDe(DIETA.id,DIA_SEL);
    const soloPautas = tomas.length===0 && await sinTomas(DIETA.id);
  const CAL=calcCalorias();
  const pctMap=repartoComidas(comidasCalDe(tomas));
  cont.innerHTML=`
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:4px 6px 12px">
      <div style="min-width:0">
        <p style="font-size:18px;font-weight:800;margin:0">Tu dieta</p>
        <p style="font-size:16px;font-weight:800;color:#d97757;margin:3px 0 0">${fmt(DIETA.nombre_plan)}</p>
      </div>
        ${soloPautas?'':`
      <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;flex-shrink:0">
        <button onclick="abrirGen()" style="display:flex;align-items:center;justify-content:center;gap:7px;background:var(--teal);color:#fff;border:2px solid var(--teal);border-radius:12px;padding:8px 13px;font-family:inherit;font-weight:800;font-size:14px;white-space:nowrap;cursor:pointer;box-shadow:0 2px 6px rgba(26,46,53,.10)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="10" x2="9" y2="22"/><line x1="15" y1="10" x2="15" y2="22"/></svg>Tu plan semanal</button>
        <button onclick="abrirCompra(CLIENTE.dieta_actual_id)" style="display:flex;align-items:center;justify-content:center;gap:7px;background:#fff;color:var(--teal);border:2px solid var(--teal);border-radius:12px;padding:8px 13px;font-family:inherit;font-weight:800;font-size:14px;white-space:nowrap;cursor:pointer;box-shadow:0 2px 6px rgba(26,46,53,.10)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3890a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M1 1h3l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>Lista de la compra</button>
      </div>`}
    </div>
    ${(!soloPautas&&CAL)?`<div class="card" style="text-align:center;padding:12px"><div style="font-size:14px;color:var(--muted);font-weight:700">Objetivo del día (${CAL.objLabel})</div><div style="font-size:22px;font-weight:800;color:var(--teal)">${CAL.objetivo} kcal</div><div style="font-size:14px;font-weight:700;color:var(--text);margin-top:2px"><span style="white-space:nowrap">P ${macrosDe(CAL.objetivo).prot}g</span> · <span style="white-space:nowrap">HC ${macrosDe(CAL.objetivo).hc}g</span> · <span style="white-space:nowrap">G ${macrosDe(CAL.objetivo).grasa}g</span></div></div>`:''}
        ${soloPautas?'':`<div class="daysel">${dias.map(d=>`<button class="${d[0]===DIA_SEL?'active':''}" onclick="selDia('${d[0]}')">${d[1]}</button>`).join('')}</div>`}
    ${soloPautas?'<div class="card" style="padding:14px 16px"><p style="font-size:18px;font-weight:800;margin:0 0 5px">Sin dieta estas dos semanas</p><p style="font-size:16px;font-weight:600;color:var(--muted);margin:0;line-height:1.45">Trabajas solo con las pautas. Las tienes aquí abajo, en el desplegable.</p></div>':tomas.length===0?'<div class="empty">Sin comidas para este día.</div>':tomas.map(t=>{
      const i=TOMA_INFO[t.toma]||['🍴',t.toma];
      const prods=(t.toma_productos||[]).map(x=>x.productos).filter(p=>p&&p.disponible!==false);
      const recs=(t.toma_recetas||[]).map(x=>x.recetas).filter(Boolean);
      prods.forEach(p=>PRODUCTOS_CACHE[p.id]=p); recs.forEach(r=>RECETAS_CACHE[r.id]=r);
      return `<div class="card"><div class="plato">
        <h4>${i[0]} ${i[1]}</h4><p>${listar(t.texto)}</p>        ${prods.length?`<div class="relh">🛒 Artículos de tienda</div><div class="chips">${prods.map((p,pi)=>`<span class="chip shop link${pi>=3?' mas':''}" onclick="verProducto('${p.id}')">🛒 ${p.nombre} ›</span>`).join('')}</div>${prods.length>3?`<button class="artmas" onclick="toggleArts(this)">Ver ${prods.length-3} más ▾</button>`:''}`:''}
        ${recs.length?`<div class="relh">👩‍🍳 Recetas relacionadas</div><div class="chips">${recs.map(r=>`<span class="chip rec link" onclick="verReceta('${r.id}')">👩‍🍳 ${r.nombre} ›</span>`).join('')}</div>`:''}
      </div></div>`;}).join('')}
    ${btnProponerHTML('margin-top:16px')}`;
}
function toggleArts(b){var x=b.previousElementSibling;var o=x.classList.toggle('open');var n=x.querySelectorAll('.mas').length;b.textContent=o?'Ocultar ▴':('Ver '+n+' más ▾');}
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
  COMPRA_ITEMS=items||[]; COMPRA_CHECKS=checkMap; COMPRA_NOMBRE_PLAN=(d&&d.nombre_plan)||'';
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
  // El PDF se genera con lo que hay EN PANTALLA (respeta el supermercado elegido)
  const btn = `<button class="btn" id="lc-dl" onclick="descargarCompraPDF()" style="margin-top:16px">⬇️ Descargar en PDF</button>`
    + (url?`<a href="${url}" target="_blank" rel="noopener" style="display:block;text-align:center;margin-top:10px;font-size:14px;font-weight:700;color:var(--teal);text-decoration:none">Ver la lista original de la dieta</a>`:'');
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

// ====== PDF de la lista de la compra ======
// Descarga EXACTAMENTE lo que el cliente ve: el supermercado elegido en el
// desplegable y el estado de cada casilla. Usa las mismas librerías que el
// generador de Mi Plan (genScript vive en js/20-miplan.js).
let COMPRA_NOMBRE_PLAN='';
async function descargarCompraPDF(){
  const btn=document.getElementById('lc-dl');
  const t0=btn?btn.textContent:''; if(btn){ btn.disabled=true; btn.textContent='Preparando PDF…'; }
  let node=null;
  try{
    if(!window.html2canvas) await genScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    if(!window.jspdf) await genScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const sup=(document.getElementById('lc_super')||{}).value||'';
    const norma=it=>String(it.supermercado||'').trim();
    const items=!sup?COMPRA_ITEMS:(sup==='__sin__'?COMPRA_ITEMS.filter(it=>!norma(it)):COMPRA_ITEMS.filter(it=>norma(it)===sup));
    if(!items.length){ try{ toast('No hay artículos que descargar'); }catch(e){} if(btn){btn.disabled=false;btn.textContent=t0;} return; }
    const cats={}; items.forEach(it=>{ const c=it.categoria||'Otros'; (cats[c]=cats[c]||[]).push(it); });
    const ahora=new Date();
    const fecha=ahora.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
    const supTxt=!sup?'Todos los supermercados':(sup==='__sin__'?'Sin supermercado':sup);
    const nomCli=((CLIENTE&&CLIENTE.nombre)||'')+' '+((CLIENTE&&CLIENTE.apellido)||'');
    // ID del documento: cliente + minuto de creación. Único y rastreable sin base de datos.
    const docId='LC-'+String((CLIENTE&&CLIENTE.id)||'').replace(/-/g,'').slice(0,6).toUpperCase()
      +'-'+ahora.toISOString().slice(2,16).replace(/[-T:]/g,'');
    let filas='';
    Object.keys(cats).forEach(cat=>{
      filas+='<div style="font-size:15px;font-weight:800;color:#3890a4;text-transform:uppercase;letter-spacing:.5px;margin:18px 0 6px">'+esc(cat)+'</div>';
      cats[cat].forEach(it=>{
        const on=COMPRA_CHECKS[it.id]===true;
        filas+='<div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px dashed #dbe6e9">'
          +'<span style="flex:none;width:18px;height:18px;border-radius:5px;'+(on
            ?'background:#2f9e5f;color:#fff;font-weight:900;font-size:13px;text-align:center;line-height:18px">✓'
            :'border:2px solid #b9cdd3">')+'</span>'
          +'<span style="font-size:15px;font-weight:600;color:'+(on?'#8aa0a7;text-decoration:line-through':'#1a2e35')+'">'+esc(it.producto)
          +(!sup&&it.supermercado?' <span style="font-size:12px;color:#8aa0a7">· '+esc(it.supermercado)+'</span>':'')
          +'</span></div>';
      });
    });
    node=document.createElement('div');
    node.style.cssText='position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:44px 48px;font-family:Quicksand,sans-serif';
    node.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3890a4;padding-bottom:14px;margin-bottom:8px">'
      +'<div><div style="font-size:30px;font-weight:700;color:#3890a4;letter-spacing:.5px">Saneas<span style="font-size:14px;vertical-align:super">®</span></div>'
      +'<div style="font-size:16px;font-weight:800;color:#1a2e35;margin-top:2px">Lista de la compra · '+esc(supTxt)+'</div></div>'
      +'<div style="text-align:right;font-size:12.5px;color:#5f7178;font-weight:600;line-height:1.7">'
        +'<b style="color:#1a2e35">'+esc(nomCli.trim()||'Cliente Saneas')+'</b><br>'
        +'Estrategia: <b style="color:#1a2e35">'+esc(COMPRA_NOMBRE_PLAN||'—')+'</b><br>'
        +fecha+'<br>'
        +'<span style="font-size:11px;color:#8aa0a7">ID '+docId+'</span></div></div>'
      +filas
      +'<div style="margin-top:22px;font-size:12px;color:#8aa0a7;font-weight:600;text-align:center">app.saneas.es · tu lista, tal y como la dejaste</div>';
    document.body.appendChild(node);
    const canvas=await html2canvas(node,{scale:2,backgroundColor:'#ffffff',logging:false});
    node.remove(); node=null;
    const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const M=10, W=210-2*M, H=297-2*M;
    const hTotal=W*(canvas.height/canvas.width);
    if(hTotal<=H){ pdf.addImage(canvas.toDataURL('image/jpeg',0.92),'JPEG',M,M,W,hTotal); }
    else{
      // listas largas: trocear el lienzo en páginas A4
      const pagePx=Math.floor(canvas.width*H/W); let y=0, primera=true;
      while(y<canvas.height){
        const h=Math.min(pagePx,canvas.height-y);
        const c2=document.createElement('canvas'); c2.width=canvas.width; c2.height=h;
        c2.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
        if(!primera) pdf.addPage();
        pdf.addImage(c2.toDataURL('image/jpeg',0.92),'JPEG',M,M,W,W*(h/canvas.width));
        y+=h; primera=false;
      }
    }
    pdf.save('Lista-compra-Saneas'+(sup&&sup!=='__sin__'?'-'+sup.replace(/\s+/g,''):'')+'.pdf');
    try{ toast('⬇️ Lista descargada'); }catch(e){}
  }catch(e){
    if(node) node.remove();
    alert('No se pudo crear el PDF, inténtalo de nuevo.');
  }
  if(btn){ btn.disabled=false; btn.textContent=t0; }
}
