// SANEAS · js/17-mas.js · Pestaña Más: tienda, recetas y opinión
// ====== MÁS: Tienda / Recetas / Pagos / Opinión ======
function masTab(k,el){
  ['tienda','recetas','pagos','opinion'].forEach(x=>document.getElementById('m-'+x).classList.toggle('hidden',x!==k));
  document.querySelectorAll('#s-mas .tabs button').forEach(b=>b.classList.remove('active'));el.classList.add('active');
  if(k==='tienda') abrirTienda();
  else if(k==='recetas') abrirRecetas();
  else if(k==='pagos') renderPagos('m-pagos');
  else if(k==='opinion') renderOpinion();
}

// ====== Tu opinión (anónima) ======
let OP_ESTRELLAS=0, OP_TEMA='';
function renderOpinion(){
  OP_ESTRELLAS=0; OP_TEMA='';
  const temas=['La app','Dietas','Atención','Gimnasio','Tienda'];
  document.getElementById('m-opinion').innerHTML=`
    <div style="background:var(--light);border:1px solid #bfe0e8;border-radius:12px;padding:12px;margin-bottom:16px">
      <div style="font-size:13.5px;font-weight:800;color:var(--dark);display:flex;align-items:center;gap:6px">🔒 Totalmente anónimo</div>
      <div style="font-size:13px;color:var(--muted);line-height:1.5;margin-top:5px">Tu mensaje se envía de forma anónima. Solo sabremos quién eres si escribes tu nombre y primer apellido más abajo.</div>
    </div>
    <div style="font-size:14px;font-weight:700;color:var(--dark);margin-bottom:6px">¿Qué harías para mejorar Saneas?</div>
    <textarea id="op_texto" rows="4" placeholder="Escribe aquí tu idea, sugerencia o lo que echas de menos…" style="width:100%;box-sizing:border-box;border:1px solid #d7e2e6;border-radius:12px;padding:11px;font-size:14px;font-family:inherit;color:var(--dark);resize:vertical"></textarea>

    <div style="font-size:13px;font-weight:700;color:var(--muted);margin:14px 0 6px">Valoración general <span style="font-weight:400;color:#9aa9ae">(opcional)</span></div>
    <div id="op_stars" style="font-size:30px;letter-spacing:6px;cursor:pointer;user-select:none;color:#d7e2e6">
      ${[1,2,3,4,5].map(n=>`<span onclick="setOpStar(${n})" data-n="${n}">★</span>`).join('')}
    </div>

    <div style="font-size:13px;font-weight:700;color:var(--muted);margin:16px 0 6px">¿Sobre qué es? <span style="font-weight:400;color:#9aa9ae">(opcional)</span></div>
    <div id="op_temas" style="display:flex;flex-wrap:wrap;gap:7px">
      ${temas.map(t=>`<span onclick="setOpTema(this,'${t}')" style="padding:7px 12px;border-radius:20px;background:#fff;border:1px solid #d7e2e6;color:var(--muted);font-size:13px;font-weight:600;cursor:pointer">${t}</span>`).join('')}
    </div>

    <div style="font-size:13px;font-weight:700;color:var(--muted);margin:16px 0 6px">Nombre y primer apellido <span style="font-weight:400;color:#9aa9ae">(opcional)</span></div>
    <input id="op_nombre" placeholder="Déjalo vacío para enviar en anónimo" style="width:100%;box-sizing:border-box;border:1px solid #d7e2e6;border-radius:12px;padding:11px;font-size:14px;font-family:inherit;color:var(--dark)">

    <button id="op_btn" onclick="enviarOpinion()" style="width:100%;margin-top:18px;background:#d97757;color:#fff;border:0;padding:14px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer">Enviar mi opinión</button>
    <div style="text-align:center;font-size:12px;color:#8aa0a7;margin-top:9px">🛡️ No guardamos ningún dato que no escribas tú</div>
    <div id="op_msg" style="text-align:center;font-size:13.5px;font-weight:700;margin-top:10px;min-height:18px"></div>`;
}
function setOpStar(n){
  OP_ESTRELLAS=(OP_ESTRELLAS===n)?0:n;
  document.querySelectorAll('#op_stars span').forEach(s=>{
    s.style.color = (Number(s.dataset.n)<=OP_ESTRELLAS)?'#e0a800':'#d7e2e6';
  });
}
function setOpTema(el,t){
  const on=OP_TEMA!==t; OP_TEMA=on?t:'';
  document.querySelectorAll('#op_temas span').forEach(s=>{
    s.style.background='#fff'; s.style.color='var(--muted)'; s.style.border='1px solid #d7e2e6';
  });
  if(on){ el.style.background='var(--teal)'; el.style.color='#fff'; el.style.border='1px solid var(--teal)'; }
}
async function enviarOpinion(){
  const texto=(document.getElementById('op_texto').value||'').trim();
  const nombre=(document.getElementById('op_nombre').value||'').trim();
  const msg=document.getElementById('op_msg'), btn=document.getElementById('op_btn');
  if(texto.length<3){ msg.style.color='var(--red)'; msg.textContent='Escribe tu opinión antes de enviar.'; return; }
  btn.disabled=true; btn.style.opacity='.6'; btn.textContent='Enviando…'; msg.textContent='';
  const {error}=await sb.rpc('enviar_opinion',{p_texto:texto,p_estrellas:OP_ESTRELLAS||null,p_tema:OP_TEMA||null,p_nombre:nombre||null});
  if(error){ msg.style.color='var(--red)'; msg.textContent='No se pudo enviar. Inténtalo de nuevo.'; btn.disabled=false; btn.style.opacity='1'; btn.textContent='Enviar mi opinión'; return; }
  document.getElementById('m-opinion').innerHTML=`
    <div style="text-align:center;padding:40px 16px">
      <div style="font-size:46px">✅</div>
      <div style="font-size:17px;font-weight:800;color:var(--dark);margin-top:10px">¡Gracias por tu opinión!</div>
      <div style="font-size:13.5px;color:var(--muted);line-height:1.5;margin-top:8px">La hemos recibido${nombre?'':' de forma anónima'}. Nos ayuda muchísimo a mejorar Saneas.</div>
      <button onclick="renderOpinion()" style="margin-top:18px;background:#fff;color:var(--teal);border:2px solid var(--teal);padding:11px 18px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">Dejar otra opinión</button>
    </div>`;
}
// Catálogos completos cacheados en memoria (búsqueda instantánea e insensible a tildes)
const PALL={productos:null,recetas:null,ofertas:null};
const sinTilde = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
async function fetchAll(table,cols,orderCol){
  let all=[],from=0,sz=1000;
  for(;;){ let query=sb.from(table).select(cols).order(orderCol||'nombre').range(from,from+sz-1);
    if(table==='productos') query=query.eq('disponible',true);   // ocultar los quitados de CAT_Tienda
    const {data,error}=await query;
    if(error){console.error(error);break;} all=all.concat(data||[]);
    if(!data||data.length<sz) break; from+=sz; }
  return all;
}
function filaCat(x,fn,icon){
  return `<div class="lrow" onclick="${fn}('${x.id}')">
    <div class="th" style="${x.imagen_url?`background-image:url('${x.imagen_url}')`:''}">${x.imagen_url?'':icon}</div>
    <div class="info"><b>${x.nombre}</b><small>${x.categoria||''}${x.supermercado?' · '+x.supermercado:''}</small></div>
    ${x.precio!=null?`<div class="pr">${Number(x.precio).toFixed(2).replace('.',',')} €</div>`:'<div class="pr">›</div>'}</div>`;
}
function acordeon(items,fn,icon){
  const g={}; items.forEach(x=>{const c=(x.categoria||'Otros');(g[c]=g[c]||[]).push(x);});
  const cats=Object.keys(g).sort((a,b)=>a.localeCompare(b,'es'));
  if(!cats.length) return '<div class="empty">No hay elementos.</div>';
  return cats.map(c=>`<div class="cat">
    <div class="cathead" onclick="this.parentNode.classList.toggle('open');this.nextElementSibling.classList.toggle('hidden')">
      <span>${c}</span><span class="cnt">${g[c].length}</span><span class="arw">›</span></div>
    <div class="catbody hidden">${g[c].map(x=>filaCat(x,fn,icon)).join('')}</div></div>`).join('');
}
async function abrirTienda(){
  const cont=document.getElementById('tienda-list');
  if(!PALL.productos){cont.innerHTML='<div class="spinner"></div>';PALL.productos=await fetchAll('productos','id,nombre,categoria,supermercado,precio,imagen_url');}
  if(!PALL.ofertas){PALL.ofertas=await fetchAll('ofertas','alimento_id,supermercado,precio,imagen_url','alimento_id');}
  buscarTienda();
}
// Items de la tienda según el supermercado elegido (Todos = precio base del alimento)
function tiendaItems(){
  const sup=(document.getElementById('q_super')||{}).value||'';
  if(!sup) return PALL.productos||[];
  const ns=sinTilde(sup.toLowerCase());
  const byAlim={}; (PALL.productos||[]).forEach(p=>byAlim[p.id]=p);
  const seen={}, out=[];
  (PALL.ofertas||[]).forEach(o=>{ if(sinTilde((o.supermercado||'').toLowerCase())!==ns) return;
    const p=byAlim[o.alimento_id]; if(!p||seen[p.id]) return; seen[p.id]=1;
    out.push({id:p.id,nombre:p.nombre,categoria:p.categoria,supermercado:o.supermercado,precio:o.precio,imagen_url:o.imagen_url||p.imagen_url}); });
  return out;
}
function buscarTienda(){
  const q=sinTilde(document.getElementById('q_tienda').value.trim());
  const cont=document.getElementById('tienda-list');
  if(!PALL.productos){return;}
  const items=tiendaItems();
  if(!q){cont.innerHTML=items.length?acordeon(items,'verProducto','🛒'):'<div class="empty">No hay productos de ese supermercado todavía.</div>';return;}
  const res=items.filter(x=>sinTilde(x.nombre).includes(q)||sinTilde(x.categoria).includes(q)).slice(0,100);
  cont.innerHTML=res.length?res.map(x=>filaCat(x,'verProducto','🛒')).join(''):'<div class="empty">Sin resultados.</div>';
}
async function abrirRecetas(){
  const cont=document.getElementById('recetas-list');
  if(!PALL.recetas){cont.innerHTML='<div class="spinner"></div>';PALL.recetas=await fetchAll('recetas','id,nombre,categoria,imagen_url');}
  buscarRecetas();
}
function buscarRecetas(){
  const q=sinTilde(document.getElementById('q_recetas').value.trim());
  const cont=document.getElementById('recetas-list');
  if(!PALL.recetas){return;}
  if(!q){cont.innerHTML=acordeon(PALL.recetas,'verReceta','👩‍🍳');return;}
  const res=PALL.recetas.filter(x=>sinTilde(x.nombre).includes(q)||sinTilde(x.categoria).includes(q)).slice(0,100);
  cont.innerHTML=res.length?res.map(x=>filaCat(x,'verReceta','👩‍🍳')).join(''):'<div class="empty">Sin resultados.</div>';
}
const PLAN_LIST=[
  {id:'basico',label:'Básico',amount:30,sub:'/mes'},
  {id:'completo_mensual',label:'Completo Mensual',amount:60,sub:'/mes'},
  {id:'completo_trimestral',label:'Completo Trimestral',amount:170,sub:''},
  {id:'completo_semestral',label:'Completo Semestral',amount:300,sub:''},
  {id:'completo_anual',label:'Completo Anual',amount:600,sub:''},
  {id:'premium',label:'Premium VIP',amount:120,sub:'/mes'},
];
let CUOTA=PLAN_LIST.find(p=>p.id==='completo_mensual')||PLAN_LIST[0];   // por defecto Completo Mensual
function setCuota(id){CUOTA=PLAN_LIST.find(p=>p.id===id)||CUOTA;renderPagos();}
// Tarjeta de tarifas (escaparate oscuro). Tocar una tarifa la selecciona y actualiza el importe a pagar.
function _tarifaTile(id,tit,precio,nota,promo){
  const sel=CUOTA&&CUOTA.id===id; const selectable=PLAN_LIST.some(p=>p.id===id);
  const border=sel?'2px solid #34d399':'1px solid rgba(255,255,255,0.06)';
  const pie=promo
    ? `<div style="display:inline-block;font-size:10px;color:#34d399;font-weight:700;background:rgba(52,211,153,0.12);padding:2px 6px;border-radius:6px;margin-top:5px">${promo}</div>`
    : `<div style="font-size:11px;color:#94a3b8;font-weight:500;margin-top:4px;line-height:1.2">${nota||''}</div>`;
  return `<td style="width:50%;background:rgba(255,255,255,0.03);border:${border};border-radius:14px;padding:12px 10px;vertical-align:top;${selectable?'cursor:pointer':''}" ${selectable?`onclick="setCuota('${id}')"`:''}>
      <div style="font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">${tit}${sel?' ✓':''}</div>
      <div style="font-size:26px;color:#fff;font-weight:800;line-height:1">${precio}€</div>${pie}</td>`;
}
function tarjetaTarifas(){
  const vip=CUOTA&&CUOTA.id==='premium';
  return `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:22px;padding:16px 12px;margin-top:6px;box-shadow:0 10px 30px rgba(0,0,0,.3)">
    <div style="margin-bottom:12px"><span style="font-weight:800;font-size:24px;color:#34d399">Saneas</span><span style="font-weight:800;font-size:24px;color:#fff"> Tarifas</span></div>
    <table style="width:100%;border-collapse:separate;border-spacing:8px">
      <tr>${_tarifaTile('prueba','Prueba',15,'2 semanas')}${_tarifaTile('basico','Básico',30,'En modo automático')}</tr>
      <tr>${_tarifaTile('completo_mensual','Mensual',60,'Mes a mes')}${_tarifaTile('completo_trimestral','Trimestre',170,'Pago trimestral')}</tr>
      <tr>${_tarifaTile('completo_semestral','Bono 6 Meses',300,'','1 mes gratis')}${_tarifaTile('completo_anual','Bono 1 Año',600,'','2 meses gratis')}</tr>
    </table>
    <div onclick="setCuota('premium')" style="cursor:pointer;margin-top:6px;background:linear-gradient(90deg,rgba(147,51,234,.18),rgba(192,132,252,.05));border:${vip?'2px solid #34d399':'1px solid rgba(147,51,234,.4)'};border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:18px;color:#fff;font-weight:800;line-height:1.1">Tarifa VIP${vip?' ✓':''}</div><div style="font-size:12px;color:#c084fc;font-weight:500;margin-top:2px">Todas las consultas telefónicas</div></div>
      <div style="text-align:right"><div style="font-size:26px;color:#c084fc;font-weight:800;line-height:1">120€</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">al mes</div></div>
    </div>
  </div>`;
}
