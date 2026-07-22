// SANEAS · js/15-gym.js · Entrenamiento (casa/gym) y registro de pesos
// ====== GYM ======
let GYM={origen:'casa',dias:4,dia:'Dia1',full:false,ejers:[],_key:null};
const EJ_CACHE={};                       // ejercicios por id (para abrir su ficha)
let GYMFULL={origen:null,ejers:[]};      // programa completo (pantalla Gym)
function diasGym(){const col='dia_'+GYM.dias;return [...new Set(GYM.ejers.map(e=>e[col]))].filter(Boolean).sort();}
// Reparto de los días de entreno en la semana según cuántos días entrena (1=Lun … 6=Sáb; domingo descanso)
const HORARIO={3:{1:1,3:2,5:3},4:{1:1,2:2,4:3,5:4},5:{1:1,2:2,3:3,4:4,5:5},6:{1:1,2:2,3:3,4:4,5:5,6:6}};
function diaHoyGym(){const wd=new Date().getDay();const m=HORARIO[GYM.dias]||{};const n=m[wd];return n?('Dia'+n):null;}
async function cargarGym(){
  const key=GYM.origen+'|'+GYM.dias;
  if(GYM._key===key) return;
  const col='dia_'+GYM.dias;
  // cada nº de días es un programa distinto (tanto en gimnasio como en casa) → filtrar por total_dias
  const {data}=await sb.from('gym_ejercicios').select('*').eq('origen',GYM.origen).eq('total_dias',GYM.dias).not(col,'is',null).order('orden');
  GYM.ejers=data||[]; GYM._key=key; GYM.ejers.forEach(e=>EJ_CACHE[e.id]=e);
  const dias=diasGym(); if(!dias.includes(GYM.dia)) GYM.dia=dias[0]||'Dia1';
}
async function renderGym(){
  const cont=document.getElementById('s-gym');
  cont.innerHTML='<div class="spinner"></div>';
  const origen=GYMFULL.origen||GYM.origen||'casa'; GYMFULL.origen=origen;
  const {data}=await sb.from('gym_ejercicios').select('*').eq('origen',origen).eq('total_dias',6).not('dia_6','is',null).order('orden');
  const ejers=data||[]; ejers.forEach(e=>EJ_CACHE[e.id]=e); GYMFULL.ejers=ejers;
  const dias=[...new Set(ejers.map(e=>e.dia_6))].filter(Boolean).sort();
  const segOrigen=`<div class="seg2">
    <button class="${origen==='casa'?'active':''}" onclick="setGymFull('casa')">🏠 Casa</button>
    <button class="${origen==='gym'?'active':''}" onclick="setGymFull('gym')">🏋️ Gimnasio</button></div>`;
  const body=dias.length? dias.map((d,i)=>`<h2 class="sec">Día ${i+1}</h2>`+ejers.filter(e=>e.dia_6===d).map(exCard).join('')).join('') : '<div class="empty">Sin ejercicios.</div>';
  cont.innerHTML=`
    <p style="font-size:20px;font-weight:700;margin:4px 6px 2px">Programa completo</p>
    <p style="font-size:14px;color:var(--muted);margin:0 6px 10px">Todos los ejercicios clasificados por día (programa de 6 días).</p>
    ${segOrigen}${body}`;
}
function setGymFull(o){GYMFULL.origen=o;renderGym();}
function exCard(e){
  const vis=e.img1?`<img src="${e.img1}" loading="lazy" alt="">`:'<div class="ph">🏋️</div>';
  return `<div class="exitem" onclick="verEjercicio('${e.id}')">
    ${vis}
    <div class="en"><b>${e.ejercicio}</b><small>Descanso ${e.descanso||'-'}</small></div>
    <div class="rr">${e.series||''}${e.reps?'<br>× '+e.reps:''}</div></div>`;
}
function verEjercicio(id){
  const e=EJ_CACHE[id]; if(!e)return;
  const hero=e.img1?`<img src="${e.img1}" alt="" style="width:100%;max-height:280px;object-fit:contain;background:var(--light);border-radius:16px;margin-bottom:14px">`:'<div class="hero">🏋️</div>';
  const emb=(e.video&&String(e.video).trim().startsWith('<'))?`<div class="dsec">Vídeo</div><div style="border-radius:14px;overflow:hidden">${e.video}</div>`:'';
  abrirDetalle(e.ejercicio,`
    ${hero}
    <h3 style="font-size:20px;margin-bottom:6px">${e.ejercicio}</h3>
    <div class="price-big" style="font-size:18px">${e.series||'-'} series × ${e.reps||'-'}</div>
    <div class="kv">Descanso: ${e.descanso||'-'}</div>
    ${e.notas?`<div class="dsec">Notas biomecánicas</div><div class="dtext">${e.notas}</div>`:''}
    ${emb}
    <div class="dsec">Tu registro</div>
    <div id="gymlog" class="gymlog">Cargando…</div>`);
  renderGymLog(id);
}

// Registro de gimnasio: series, reps y peso de la última serie por ejercicio
async function renderGymLog(ejId){
  const cont=document.getElementById('gymlog'); if(!cont) return;
  const e=EJ_CACHE[ejId]; const ejNombre=e?e.ejercicio:'';
  let logs=[];
  if(CLIENTE&&CLIENTE.id&&ejNombre){
    try{ const {data}=await sb.from('gym_logs').select('*').eq('cliente_id',CLIENTE.id).eq('ejercicio_nombre',ejNombre)
        .order('fecha',{ascending:false}).order('created_at',{ascending:false}); logs=data||[]; }catch(err){console.error('gymlog',err);}
  }
  const fmt=l=>`${l.series!=null?l.series:'-'} × ${l.reps!=null?l.reps:'-'} · ${l.peso!=null?l.peso+' kg':'-'}`;
  const ult=logs[0];
  const ref=ult
    ? `<div class="gl-ref">La última vez (${fechaCorta(ult.fecha)}): <b>${fmt(ult)}</b></div>`
    : `<div class="gl-ref gl-empty">Aún no has anotado este ejercicio.</div>`;
  const hist=logs.length>1
    ? `<div class="gl-hist"><div class="gl-h">Historial</div>${logs.slice(0,20).map(l=>`<div class="gl-row"><span>${fechaCorta(l.fecha)}</span><b>${fmt(l)}</b></div>`).join('')}</div>`
    : '';
  cont.innerHTML=`
    ${ref}
    <div class="gl-form">
      <div class="gl-f"><label>Series</label><input id="gl_series" type="number" inputmode="numeric" min="0" placeholder="${ult&&ult.series!=null?ult.series:''}"></div>
      <div class="gl-f"><label>Reps (última)</label><input id="gl_reps" type="number" inputmode="numeric" min="0" placeholder="${ult&&ult.reps!=null?ult.reps:''}"></div>
      <div class="gl-f"><label>Peso (kg)</label><input id="gl_peso" type="number" inputmode="decimal" min="0" step="0.5" placeholder="${ult&&ult.peso!=null?ult.peso:''}"></div>
    </div>
    <button class="btn gl-save" onclick="guardarGymLog('${ejId}')">Guardar lo de hoy</button>
    <div id="gl_msg" class="gl-msg"></div>
    ${hist}`;
}
async function guardarGymLog(ejId){
  const e=EJ_CACHE[ejId]; const ejNombre=e?e.ejercicio:''; const msg=document.getElementById('gl_msg');
  if(!CLIENTE||!CLIENTE.id){ if(msg){msg.className='gl-msg err';msg.textContent='Inicia sesión para guardar.';} return; }
  const gv=id=>{const el=document.getElementById(id);return el?el.value.trim():'';};
  const s=gv('gl_series'), r=gv('gl_reps'), p=gv('gl_peso');
  if(!s&&!r&&!p){ if(msg){msg.className='gl-msg err';msg.textContent='Escribe al menos un dato.';} return; }
  const btn=document.querySelector('.gl-save'); if(btn){btn.disabled=true;btn.textContent='Guardando...';}
  const row={cliente_id:CLIENTE.id,ejercicio_ref:String(ejId),ejercicio_nombre:ejNombre,
    series:s?parseInt(s,10):null,reps:r?parseInt(r,10):null,peso:p?parseFloat(p.replace(',','.')):null};
  const {error}=await sb.from('gym_logs').insert(row);
  if(error){ if(btn){btn.disabled=false;btn.textContent='Guardar lo de hoy';} if(msg){msg.className='gl-msg err';msg.textContent='No se pudo guardar: '+error.message;} return; }
  await renderGymLog(ejId);
}
async function setGym(k,v){
  GYM[k]=v; GYM.full=false;
  await renderGym();
  if(CLIENTE&&CLIENTE.id){
    const upd={dias_entreno:GYM.dias,gym_origen:GYM.origen,gym_dia:GYM.dia};
    sb.from('clientes').update(upd).eq('id',CLIENTE.id); Object.assign(CLIENTE,upd);
  }
}
function setGymDia(d){
  GYM.dia=d; GYM.full=false; renderGym();
  if(CLIENTE&&CLIENTE.id){ sb.from('clientes').update({gym_dia:d}).eq('id',CLIENTE.id); CLIENTE.gym_dia=d; }
}
function toggleFull(){GYM.full=!GYM.full;renderGym();}

