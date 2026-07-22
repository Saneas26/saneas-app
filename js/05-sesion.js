// SANEAS · js/05-sesion.js · Arranque de sesión: carga de datos, push, pasos, avisos, dieta
// ====== CARGA DE DATOS ======
function saludo(){const h=new Date().getHours();return h<6?'Buenas noches':h<12?'Buenos días':h<20?'Buenas tardes':'Buenas noches';}
function mostrarSplash(){
  const s=document.getElementById('splash');
  document.getElementById('splashTxt').innerHTML=`${saludo()},`;
  document.getElementById('splashNom').innerHTML=`${(CLIENTE.nombre||'').split(' ')[0]} 👋`;
  s.classList.remove('hidden'); void s.offsetWidth; s.classList.add('show');
  return new Promise(r=>setTimeout(r,3300));
}
async function registrarAcceso(){ try{ if(CLIENTE&&CLIENTE.id) await sb.from('accesos').insert({cliente_id:CLIENTE.id}); }catch(e){console.error('acceso',e);} }

// ---- Notificaciones push (Web Push) ----
const VAPID_PUB='BHOoBIztagSU5gGdWI-z76JI40CN1nWbix5rZgh2NQzRL8X7Zp51_UsY9JY69lr9ToBcZyb8QyaEZdCGLBc-aTg';
function _b64ToU8(s){ const p='='.repeat((4-s.length%4)%4); const b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')); const a=new Uint8Array(b.length); for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i); return a; }
async function initPush(soloSiYaConcedido){ try{
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!CLIENTE||!CLIENTE.id) return;
  const reg=await navigator.serviceWorker.register('sw.js');
  if(!('Notification' in window)||Notification.permission==='denied') return;
  // soloSiYaConcedido: refresca la suscripcion sin abrir el popup. Para la pantalla de bloqueo.
  if(soloSiYaConcedido && Notification.permission!=='granted') return;
  const perm=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(perm!=='granted') return;
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:_b64ToU8(VAPID_PUB)});
  const j=sub.toJSON();
  await sb.from('push_subs').upsert({cliente_id:CLIENTE.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth},{onConflict:'endpoint'});
}catch(e){ console.error('push',e); } }

// ---- Reto de pasos (semanal: 61.600 = 8.800/día × 7; reinicia domingo 00:00) ----
const META_DIA=8800, META_SEMANA=61600;
let PASOS_HOY=0, PASOS_SEM=0;
function _hoyCanarias(){ return new Date().toLocaleDateString('en-CA',{timeZone:'Atlantic/Canary'}); }
function _inicioSemana(){ const d=new Date(_hoyCanarias()+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-d.getUTCDay()); return d.toISOString().slice(0,10); }
async function cargarPasos(){ try{ if(!CLIENTE||!CLIENTE.id) return; const {data}=await sb.from('pasos').select('pasos,fecha').eq('cliente_id',CLIENTE.id).gte('fecha',_inicioSemana()); const hoy=_hoyCanarias(); PASOS_SEM=(data||[]).reduce((s,r)=>s+(+r.pasos||0),0); PASOS_HOY=(data||[]).filter(r=>r.fecha===hoy).reduce((s,r)=>s+(+r.pasos||0),0); pintarPasos(); }catch(e){ console.error('pasos',e); } }
function pintarPasos(){ if(typeof pintarMision==='function') pintarMision(); /* los pasos viven en la misión; el resto queda por si vuelve una tarjeta propia */ const el=document.getElementById('pasosTotal'); if(!el) return; el.textContent=PASOS_HOY.toLocaleString('es-ES'); const pct=Math.min(100,Math.round(PASOS_SEM/META_SEMANA*100)); const b=document.getElementById('pasosBar'); if(b) b.style.width=pct+'%'; const m=document.getElementById('pasosMsg'); if(m){ m.textContent = PASOS_SEM>=META_SEMANA ? '✅ ¡Reto de la semana conseguido! 🎉' : ('Te quedan '+(META_SEMANA-PASOS_SEM).toLocaleString('es-ES')+' pasos para esta semana 👟'); } }
async function sumarPasos(){ const inp=document.getElementById('pasosInput'); if(!inp) return; const v=parseInt(inp.value,10); if(!v||v<=0){ inp.focus(); return; } const btn=inp.nextElementSibling; inp.disabled=true; if(btn) btn.disabled=true; try{ await sb.from('pasos').insert({cliente_id:CLIENTE.id, fecha:_hoyCanarias(), pasos:v}); PASOS_HOY+=v; PASOS_SEM+=v; inp.value=''; pintarPasos(); }catch(e){ alert('No se pudieron guardar los pasos, inténtalo de nuevo.'); } inp.disabled=false; if(btn) btn.disabled=false; inp.focus(); }
// ---- Tarjeta para activar las notificaciones (iOS exige un toque del usuario) ----
function pintarPushCard(){
  const el=document.getElementById('pushCard'); if(!el) return;
  // El dia de consulta ya tiene su aviso arriba hablando de las 10:00. No repetirlo.
  if(typeof consultaHoyPendiente==='function' && consultaHoyPendiente()){ el.style.display='none'; return; }
  const esIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalada=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  const soporta=('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
  let html='';
  if(!soporta){
    if(esIOS&&!instalada) html='<h3 style="margin:0 0 6px">🔔 Avisos de Saneas</h3><div style="font-size:14px;line-height:1.45">Para recibir notificaciones, añade la app a tu pantalla de inicio: toca <b>Compartir</b> y después <b>«Añadir a pantalla de inicio»</b>. Luego entra desde el icono y actívalas aquí.</div>';
  } else if(Notification.permission==='default'){
    html='<h3 style="margin:0 0 8px;font-size:17px">🔔 Que no se te escape la consulta</h3>'
      +'<div style="font-size:14px;line-height:1.55;margin-bottom:9px">Tus datos tienen que llegar <b>antes de las 10:00</b> del día de tu consulta. Si no llegan, esa semana te quedas sin ella.</div>'
      +'<div style="font-size:14px;line-height:1.55;margin-bottom:9px">Con los avisos puestos te recuerdo la tarde antes, y otra vez por la mañana si todavía no me han llegado. Y te aviso de tu renovación con tiempo, para que no te pille de sorpresa.</div>'
      +'<div style="font-size:13px;line-height:1.5;color:var(--muted);margin-bottom:12px;padding-left:10px;border-left:3px solid var(--light)">Nada más. Ni publicidad, ni mensajes a deshora. Y los quitas cuando quieras.</div>'
      +'<button class="btn" style="margin:0" onclick="activarPush()">Activar avisos</button>';
  } else if(Notification.permission==='denied'){
    // No hay forma de abrir los ajustes desde la web. Lo unico util es darle la ruta exacta de SU movil.
    const ruta = esIOS
      ? 'Ajustes <span style="color:#9ab5bd">›</span> Notificaciones <span style="color:#9ab5bd">›</span> <b>Saneas</b><br><span style="color:#9ab5bd">›</span> Permitir notificaciones'
      : 'Ajustes <span style="color:#9ab5bd">›</span> Aplicaciones <span style="color:#9ab5bd">›</span> <b>Saneas</b><br><span style="color:#9ab5bd">›</span> Notificaciones <span style="color:#9ab5bd">›</span> Permitir';
    html='<h3 style="margin:0 0 8px;font-size:17px">🔔 Tienes los avisos apagados</h3>'
      +'<div style="font-size:14px;line-height:1.55;margin-bottom:10px">Así no puedo recordarte el envío de las 10:00 ni tu consulta. Desde aquí ya no puedo pedírtelo: tiene que ser en los ajustes de tu '+(esIOS?'iPhone':'móvil')+'.</div>'
      +'<div style="background:var(--light);border-radius:10px;padding:11px 13px;font-size:14px;line-height:1.9;color:var(--dark);margin-bottom:10px">'+ruta+'</div>'
      +'<div style="font-size:13px;line-height:1.5;color:var(--muted)">Vuelve aquí después y ya está.</div>';
  }
  if(html){ el.innerHTML=html; el.style.display='block'; } else { el.style.display='none'; }
}
async function activarPush(){
  await initPush();
  if(('Notification' in window)&&Notification.permission==='granted'){
    const el=document.getElementById('pushCard');
    if(el){ el.innerHTML='<div style="font-size:15px;font-weight:700">✅ Listo. Te aviso la tarde antes de cada consulta y si tus datos no me han llegado por la mañana.</div>'; el.style.display='block'; setTimeout(()=>{ el.style.display='none'; },6000); }
  } else { pintarPushCard(); }
}

// ---- Tarjeta de aviso automática (prioridad: consulta > renovación > mensaje del pool) ----
let MENSAJES=[];
async function cargarMensajes(){ try{ const {data}=await sb.from('mensajes_tarjeta').select('mensaje,importancia').eq('activo',true); MENSAJES=data||[]; }catch(e){ MENSAJES=[]; } }
function diffDias(f){ if(!f) return null; const d=new Date(String(f).slice(0,10)+'T00:00:00'); if(isNaN(d)) return null; const t=new Date(); t.setHours(0,0,0,0); return Math.round((d-t)/86400000); }
function avisoTarjeta(){
  const nom=(CLIENTE.nombre||'').split(' ')[0]||'';
  // Día de consulta: antes de las 10:00 (Madrid) recordamos subir datos; después, según haya enviado a tiempo o no
  if(consultaHoyPendiente()){
    if(deadlinePasado()){
      if(enviadoATiempo())
        return `<div class="card aviso"><span class="ico">📊</span><span>Ya tengo tus datos, ${nom}. Estoy con ellos y en un rato tienes tu informe.</span></div>`;
      return `<div class="card aviso"><span class="ico">📅</span><span>${nom}, esta semana no me llegaron tus datos a tiempo, así que tu consulta pasa a la semana que viene. Nos vemos el ${fmt(CLIENTE.dia_consulta)}. Puedes mandármelos cualquier día y a cualquier hora: solo tienen que estar antes de las 10:00 del día de tu consulta.</span></div>`;
    }
    return `<div class="card aviso"><span class="ico">👋</span><span>Hola ${nom}, hoy tenemos consulta. Cuando te venga bien, mándame tus datos antes de las 10:00 y te preparo el informe.</span></div>`;
  }
  const dc=diffDias(fechaProximaConsulta()), dr=diffDias(CLIENTE.fecha_renovacion);
  const cand=[];
  if(dc!=null&&dc>=0&&dc<=2) cand.push({t:'consulta',d:dc});
  if(dr!=null&&dr>=0&&dr<=2) cand.push({t:'renov',d:dr});
  cand.sort((a,b)=> (a.d-b.d) || (a.t==='consulta'?-1:1));
  let txt='', urgente=false, icoCand='';
  // El naranja SOLO para la renovación cuando falta 1 día o menos. Su día de consulta no es una alarma.
  if(cand.length){
    const c=cand[0], cuando=c.d===0?'hoy':(c.d===1?'mañana':'en 2 días');
    if(c.t==='consulta'){ icoCand='🗓️';
      txt = c.d===0
        ? `Hola ${nom}, hoy tenemos consulta. Cuando te venga bien, mándame tus datos antes de las 10:00.`
        : `${nom}, ${cuando} tenemos consulta. Puedes mandarme tus datos ya si quieres: solo tienen que estar antes de las 10:00.`;
    } else { icoCand='🔔'; urgente = c.d<=1;
      txt = c.d===0
        ? `${nom}, hoy toca renovar tu cuota. En cuanto la tengas, seguimos donde lo dejamos.`
        : `${nom}, ${cuando} toca renovar tu cuota. Te lo digo con tiempo para que no te pille de sorpresa.`;
    }
  } else {
    let pool=(MENSAJES||[]).slice();
    const pIni=(PRIMERO&&PRIMERO.peso!=null)?PRIMERO.peso:CLIENTE.peso_inicial;
    const pHoy=(ULTIMO&&ULTIMO.peso!=null)?ULTIMO.peso:null;
    const kg=(pIni&&pHoy)?+(pIni-pHoy).toFixed(1):0;
    if(kg>=1) pool.push({mensaje:`{nombre}, llevas perdidos {kg} kg. ¡Vamos, que no decaiga esa motivación! 🔥`,importancia:0});
    if(!pool.length) return '';
    const maxImp=Math.max.apply(null,pool.map(m=>+m.importancia||0));
    const top=pool.filter(m=>(+m.importancia||0)===maxImp);
    txt=(top[Math.floor(Math.random()*top.length)].mensaje||'')
        .replace(/\{nombre\}/gi,nom).replace(/\{kg\}/gi,String(kg).replace('.',','));
  }
  if(!txt) return '';
  const ico = icoCand || (urgente ? '⏰' : '💬');
  return `<div class="card aviso${urgente?' urgente':''}"><span class="ico">${ico}</span><span>${txt}</span></div>`;
}

async function iniciarSesion(){
  document.getElementById('auth').classList.add('hidden');
  const {data:{user}}=await sb.auth.getUser();
  let {data:cli}=await sb.from('clientes').select('*').eq('id',user.id).maybeSingle();
  CLIENTE=cli||{nombre:REG_NOMBRE||'',email:user.email};
  if(bloqueado(CLIENTE)){ initPush(true); mostrarBloqueo(); return; }   // renovación caducada → bloquear. initPush(true) refresca su suscripción sin pedirle nada.
  // Al corriente pero con huecos: el alta de Oscar solo trae correo y telefono.
  if(fichaIncompleta(CLIENTE)){ pintarFichaPendiente(CLIENTE); return; }
  const splash=mostrarSplash();   // bienvenida con saludo + nombre
  registrarAcceso();              // contar la entrada del cliente
  cargarMensajes();               // pool de mensajes para la tarjeta de aviso
  cargarPasos();                  // pasos de hoy (reto 8.800)
  initPush();                     // notificaciones push (pide permiso 1 vez)
  document.getElementById('avatar').textContent=((CLIENTE.nombre||'?')[0]||'?').toUpperCase()+((CLIENTE.apellido||'')[0]||'').toUpperCase();
  const {data:regs}=await sb.from('registros').select('*').eq('cliente_id',user.id).not('peso','is',null).order('fecha',{ascending:false}).order('semana',{ascending:false,nullsFirst:false}).limit(1);
  ULTIMO=(regs&&regs[0])||null;
  window.__regCargado = true;
  calcularProgreso();
  cargarReporte();
  cargarFase();
  if(typeof cargarDiario==='function') cargarDiario();   // diario de comidas (fase 1)
  const {data:regs0}=await sb.from('registros').select('*').eq('cliente_id',user.id).order('semana',{ascending:true,nullsFirst:false}).order('fecha',{ascending:true}).limit(1);
  PRIMERO=(regs0&&regs0[0])||null;
  await cargarDieta();
  // gym: recuperar la última elección del cliente (o valores por defecto)
  GYM.origen=CLIENTE.gym_origen || (String(CLIENTE.casa_gym||'Casa').toLowerCase().includes('gym')?'gym':'casa');
  GYM.dias=Math.min(6,Math.max(3,parseInt(CLIENTE.dias_entreno)||4));
  GYM.dia=CLIENTE.gym_dia||'Dia1';
  GYM._key=null;
  await cargarGym();
  await splash;                   // esperar el mínimo de tiempo del splash
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('main').classList.remove('hidden');
  renderInicio();
}

async function cargarDieta(){
  TOMAS_HOY=[];DIETA=null;
  let dietaId=CLIENTE.dieta_actual_id;
  if(!dietaId){ // sin dieta asignada: elige una que tenga el día de hoy (evita caer en una de un solo día)
    const hoyCod0=DIA_MAP[new Date().getDay()];
    const {data:dt}=await sb.from('dieta_tomas').select('dieta_id').eq('dia_semana',hoyCod0).limit(1);
    if(dt&&dt[0])dietaId=dt[0].dieta_id;
    if(!dietaId){const {data:d}=await sb.from('dietas').select('id').limit(1);if(d&&d[0])dietaId=d[0].id;}
  }
  if(!dietaId)return;
  const {data:dieta}=await sb.from('dietas').select('*').eq('id',dietaId).maybeSingle();
  DIETA=dieta;
  const hoyCod=DIA_MAP[new Date().getDay()];
  TOMAS_HOY=await tomasDe(dietaId,hoyCod);
  if(TOMAS_HOY.length===0) TOMAS_HOY=await tomasDe(dietaId,'1_Dia1'); // fallback demo
}
async function tomasDe(dietaId,dia){
  const {data,error}=await sb.from('dieta_tomas')
    .select('*, toma_productos(productos(id,nombre,descripcion,precio,formato_venta,imagen_url,url_compra,disponible)), toma_recetas(recetas(id,nombre,descripcion,ingredientes,pasos,tiempo_min,imagen_url))')
    .eq('dieta_id',dietaId).eq('dia_semana',dia).order('orden');
  if(error){console.error(error);return[];}
  return data||[];
}
async function sinTomas(dietaId){
  if(!dietaId) return false;
  const {count,error} = await sb.from('dieta_tomas').select('*',{count:'exact',head:true}).eq('dieta_id',dietaId);
  if(error){console.error(error);return false;}
  return !count;
}
// Cachés para abrir la ficha concreta al tocar un chip
const PRODUCTOS_CACHE={}, RECETAS_CACHE={};

