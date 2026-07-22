// SANEAS · js/07-inicio.js · Pantalla de inicio: agua, narrativa (capítulo/misión/niveles/victorias) y datos fiscales
// ====== RENDER INICIO ======
// Agua diaria = peso actual / 30, con TECHO de 3 L. Ej: 80 kg -> 2,7 L
// Decision clinica de Oscar (22/07/2026) tras la revision de nutri: el /20 daba 5 L
// a 100 kg, con riesgo de hiponatremia en quien toma tiazidas o ISRS. NO subirlo.
// UNA sola formula: la tarjeta "Agua de hoy" (inicio) y el plan semanal en PDF
// leen las dos de aqui. No se copia el /30 ni el techo a ningun otro sitio.
function aguaDiariaL(){
  const pesoHoy=(ULTIMO&&ULTIMO.peso!=null)?Number(ULTIMO.peso):null;
  const pesoIni=(PRIMERO&&PRIMERO.peso!=null)?Number(PRIMERO.peso)
               :(CLIENTE&&CLIENTE.peso_inicial!=null?Number(CLIENTE.peso_inicial):null);
  const p=pesoHoy||pesoIni||null;
  return p?Math.min(3, p/30):null;
}
function aguaDiariaTexto(){
  const l=aguaDiariaL();
  return l!=null?l.toFixed(1).replace('.',','):null;
}
// ====== NARRATIVA: capítulo, nivel, misión del día, victorias ======
// El cliente no entra en una app: entra en su historia. Cada semana es un
// capítulo, cada día una misión y cada mejora una batalla ganada.
const NIVELES=[
  {n:1,nombre:'Despertar',desde:1,d:'Decidiste empezar. El paso más difícil ya está dado.'},
  {n:2,nombre:'Aprender',desde:5,d:'Estás descubriendo cómo funciona tu cuerpo.'},
  {n:3,nombre:'Constancia',desde:13,d:'Ya no es motivación: es hábito.'},
  {n:4,nombre:'Disciplina',desde:25,d:'Haces lo que toca, también los días difíciles.'},
  {n:5,nombre:'Transformación',desde:41,d:'Los demás ya notan el cambio.'},
  {n:6,nombre:'Referente',desde:65,d:'Eres la prueba viva de que se puede.'},
  {n:7,nombre:'Embajador Saneas',desde:null,d:'Tu ejemplo ya está ayudando a otras personas.'}
];
function nivelSaneas(){
  if(esEmbajador()) return NIVELES[6];   // el nivel 7 no se gana por semanas: se gana trayendo a un Saneamigo
  const s=Number(CLIENTE&&CLIENTE.semana)||1;
  let out=NIVELES[0];
  for(const l of NIVELES){ if(l.desde!=null&&s>=l.desde) out=l; }
  return out;
}
function verNiveles(){
  const act=nivelSaneas();
  const html=NIVELES.map(l=>{
    const now=l.n===act.n;
    const como=l.desde!=null?('Desde la semana '+l.desde):'Se gana invitando a un Saneamigo';
    return `<div class="lvlRow${now?' now':''}"><span class="n">${l.n<act.n?'✓':l.n}</span><span style="flex:1">${l.nombre}<span class="d">${l.d}</span><span class="d">${como}</span></span>${now?'<span style="font-size:18px">📍</span>':''}</div>`;
  }).join('');
  abrirDetalle('Tu camino de niveles',`<p style="font-size:14px;color:var(--muted);line-height:1.5;margin-bottom:14px">En Saneas no subes de nivel por suerte: lo ganas con tu comportamiento, semana a semana.</p>${html}`);
}
const FRASES_CAP=[
  'Cada semana te pareces menos a quien empezó y más a quien quieres ser.',
  'Hoy continúa tu historia. ¿Cuál es tu siguiente misión?',
  'El cuerpo es el resultado de todas tus pequeñas victorias.',
  'No estás haciendo una dieta: estás escribiendo tu historia.',
  'El enemigo no es la báscula: es el sedentarismo. Y le estás ganando.'
];
// Título del capítulo: el de la fase (hoja de ruta de Oscar) si existe; si no, una frase del pool
function tituloCapitulo(){
  if(typeof __FASE!=='undefined'&&__FASE&&__FASE.titulo) return '«'+__FASE.titulo+'»';
  const s=Number(CLIENTE&&CLIENTE.semana)||0;
  return FRASES_CAP[s%FRASES_CAP.length];
}
function pintarCapitulo(){
  const el=document.getElementById('capFrase'); if(!el) return;
  const t=tituloCapitulo();
  if(el.textContent!==t) el.textContent=t;
}
// --- Misión de hoy: checklist diaria. Agua/dieta/entreno los marca el cliente
// (localStorage, clave por día); pasos y datos de consulta se marcan solos.
function _misionKey(){ try{ return 'saneas_mision_'+_hoyCanarias(); }catch(e){ return 'saneas_mision'; } }
function _misionGet(){ try{ return JSON.parse(localStorage.getItem(_misionKey())||'{}'); }catch(e){ return {}; } }
let MSN_PASOS_ABIERTO=false;   // el editor de pasos dentro de la misión (se abre tocando el ítem)
function misionItems(){
  const m=_misionGet();
  const litros=aguaDiariaTexto();
  const aguaLn=aguaDiariaL();
  const vasos=aguaLn!=null?Math.round(aguaLn*4):0;   // vasos de 250 ml
  const it=[
    {k:'agua',ico:'💧',t:'Beber '+(litros?litros+' L de agua'+(vasos?' <small>(≈ '+vasos+' vasos)</small>':''):'tu agua del día'),done:!!m.agua,manual:true},
    {k:'pasos',ico:'👟',t:PASOS_HOY.toLocaleString('es-ES')+' / '+META_DIA.toLocaleString('es-ES')+' pasos',done:PASOS_HOY>=META_DIA,manual:false},
    {k:'dieta',ico:'🥗',t:'Seguir la dieta de hoy',done:!!m.dieta,manual:true},
    {k:'entreno',ico:'💪',t:'Completar tu entrenamiento',done:!!m.entreno,manual:true}
  ];
  // Fase 2 del diario: si el diario está activo, apuntar 3 comidas es parte de la misión
  if(typeof DIARIO_HOY!=='undefined'&&DIARIO_HOY!==null&&!DIARIO_ERROR){
    const n=DIARIO_HOY.length;
    it.push({k:'diario',ico:'📒',t:'Apuntar tus comidas <small>('+Math.min(n,3)+'/3)</small>',done:n>=3,manual:false});
  }
  if(esDiaConsultaHoy()) it.push({k:'datos',ico:'📝',t:'Enviar tus datos de consulta',done:consultaProcesada()||enviadoATiempo(),manual:false});
  return it;
}
function misionTap(k){
  const it=misionItems().find(x=>x.k===k); if(!it) return;
  if(it.manual){ const m=_misionGet(); m[k]=!m[k]; try{ localStorage.setItem(_misionKey(),JSON.stringify(m)); }catch(e){} pintarMision(); return; }
  if(k==='pasos'){ MSN_PASOS_ABIERTO=!MSN_PASOS_ABIERTO; pintarMision(); if(MSN_PASOS_ABIERTO){ const e=document.getElementById('pasosInput'); if(e) e.focus(); } return; }
  if(k==='diario'){ irA('dieta'); return; }
  if(k==='datos') irA('registro');
}
function irA(id){ const bts=document.querySelectorAll('.nav button'); const idx={inicio:0,dieta:1,gym:2,registro:3,mas:4}[id]; if(bts[idx]) go(id,bts[idx]); }
function pintarMision(){
  const el=document.getElementById('msnCard'); if(!el) return;
  const items=misionItems();
  const hechas=items.filter(i=>i.done).length;
  const pct=Math.round(hechas/items.length*100);
  const sig=items.map(i=>i.k+(i.done?'1':'0')).join('')+'|'+PASOS_HOY+'|'+(MSN_PASOS_ABIERTO?'1':'0')+'|'+((typeof DIARIO_HOY!=='undefined'&&DIARIO_HOY)?DIARIO_HOY.length:'x');
  if(el.getAttribute('data-msn')===sig) return;   // el interval repinta: solo tocar el DOM si algo cambió
  const faltan=META_SEMANA-PASOS_SEM;
  el.innerHTML=`<h3>🎯 Tu misión de hoy</h3>
    <div class="msnSub">Gana el día de hoy y estarás un paso más cerca.</div>
    ${items.map(i=>`<button class="msnIt${i.done?' done':''}" onclick="misionTap('${i.k}')"><span class="chk">✓</span><span style="font-size:18px;flex:none">${i.ico}</span><span class="t">${i.t}</span>${i.k==='pasos'&&!i.done?'<span class="auto">➕ AÑADIR</span>':!i.manual&&!i.done?'<span class="auto">AUTO</span>':''}</button>${i.k==='pasos'&&MSN_PASOS_ABIERTO?`
      <div class="msnPasos">
        <input id="pasosInput" type="number" inputmode="numeric" min="1" placeholder="Añade los pasos que hiciste hoy">
        <button onclick="sumarPasos()">Sumar</button>
      </div>
      <div class="msnPasosSem">${PASOS_SEM>=META_SEMANA?'✅ ¡Reto semanal conseguido! 🎉':'Esta semana: '+PASOS_SEM.toLocaleString('es-ES')+' de '+META_SEMANA.toLocaleString('es-ES')+' · te quedan '+faltan.toLocaleString('es-ES')+' 👟'}</div>`:''}`).join('')}
    <div class="msnBarW"><i style="width:${pct}%"></i></div>
    <div class="msnPie"><span>${pct===100?'🏆 ¡Día ganado!':'Hoy puedes ganar el día'}</span><span class="pct">${pct}%</span></div>
    <div class="msnPrem">${pct===100?'Recompensa conseguida: <b>+1 día</b> hacia tu objetivo 🎉':'Recompensa: <b>+1 día</b> hacia tu objetivo'}</div>`;
  el.setAttribute('data-msn',sig);
}
// --- Victorias: lo que el cliente ya ha derrotado desde su primer registro
function victoriasCliente(){
  if(!PRIMERO||!ULTIMO) return [];
  const d=(a,b)=>(a!=null&&b!=null)?Number(a)-Number(b):null;
  const v=[];
  const peso=d(PRIMERO.peso,ULTIMO.peso);          if(peso!=null&&peso>=0.5) v.push(['⚖️',`<b>${r1(peso)} kg</b> derrotados`]);
  const cin=d(PRIMERO.per_cintura,ULTIMO.per_cintura); if(cin!=null&&cin>=1)   v.push(['📏',`<b>${r1(cin)} cm</b> menos de cintura`]);
  const gra=d(PRIMERO.grasa_rfm,ULTIMO.grasa_rfm); if(gra!=null&&gra>=0.5)    v.push(['🔥',`<b>${r1(gra)} puntos</b> menos de grasa corporal`]);
  const vis=d(PRIMERO.grasa_visceral,ULTIMO.grasa_visceral); if(vis!=null&&vis>=0.5) v.push(['🛡️',`<b>${r1(vis)} puntos</b> menos de grasa visceral`]);
  const mus=d(ULTIMO.masa_muscular,PRIMERO.masa_muscular); if(mus!=null&&mus>=0.3)   v.push(['💪',`<b>${r1(mus)} kg</b> más de músculo`]);
  return v;
}
// Hito del viaje por días recorridos (semana × 7): dopamina honesta, sin inventar datos
function hitoViaje(){
  const dias=(Number(CLIENTE&&CLIENTE.semana)||0)*7;
  const HITOS=[[730,'🏅 Más de 2 años caminando hacia tu mejor versión'],[500,'🔥 Más de 500 días de viaje. Imparable'],[365,'🏆 Más de un año escribiendo tu historia'],[200,'💪 Más de 200 días de constancia'],[100,'🎉 Más de 100 días de viaje. La mayoría nunca llega hasta aquí']];
  for(const h of HITOS){ if(dias>=h[0]) return h[1]; }
  return null;
}

function renderInicio(){
  const hoy=new Date();
  const esConsulta=(CLIENTE.dia_consulta||'').toLowerCase()===DIA_NOMBRE[hoy.getDay()];
  const altura=CLIENTE.altura||null;
  const imc=(p)=>(p&&altura)?+(p/Math.pow(altura/100,2)).toFixed(1):null;
  const pesoIni=(PRIMERO&&PRIMERO.peso!=null)?PRIMERO.peso:CLIENTE.peso_inicial;
  const grasaIni=(PRIMERO&&PRIMERO.grasa_rfm!=null)?PRIMERO.grasa_rfm:CLIENTE.grasa_inicial;
  const pesoHoy=ULTIMO?ULTIMO.peso:null, grasaHoy=ULTIMO?ULTIMO.grasa_rfm:null;
  const imcIni=imc(pesoIni), imcHoy=imc(pesoHoy);
  const OBJ=calcObjetivos();
  const CAL=calcCalorias();
  const MAC=CAL?macrosDe(CAL.objetivo):null;
  const hito=OBJ?hitoPeso(pesoHoy,OBJ):null;
  const metaPeso=hito?hito.meta:CLIENTE.peso_objetivo;
  const metaGrasa=OBJ?OBJ.grasaObj:CLIENTE.grasa_objetivo;
  const metaImc=OBJ?OBJ.imcObj:null;
  const metaFinal=OBJ?OBJ.promedio:CLIENTE.peso_objetivo;
  const prog=(pesoIni&&metaFinal&&pesoHoy)?
    Math.max(0,Math.min(100,Math.round((pesoIni-pesoHoy)/(pesoIni-metaFinal)*100))):0;
  const vid=CLIENTE.video_semana_url;
  // La miniatura la pone YouTube a partir del id, y el id sale de la URL guardada.
  // Sirve tanto youtu.be/ID como youtube.com/watch?v=ID o /embed/ID.
  const _ytId=u=>{ const m=String(u||'').match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/); return m?m[1]:null; };
  const vidThumb=_ytId(vid);

  const nivel=nivelSaneas();
  const vics=victoriasCliente();

  document.getElementById('s-inicio').innerHTML=`
    <div class="holaRow">
      <p style="font-size:20px;font-weight:700;margin:4px 6px 4px">Hola, ${CLIENTE.nombre||''}${esEmbajador()?` <img src="${SANEAMIGO_BADGE}" title="Embajador Saneas" style="height:24px;vertical-align:-5px">`:''} 👋</p>
      <div id="repBadge"></div>
    </div>
    <div class="capChip" onclick="verNiveles()">📖 Capítulo ${fmt(CLIENTE.semana)} · Nivel ${nivel.n} — ${nivel.nombre} <span class="chev">›</span></div>
    <p class="capFrase" id="capFrase">${tituloCapitulo()}</p>

    <div class="card" id="datosFaltanCard" style="display:none"></div>

    ${avisoTarjeta()}

    <div class="card" id="pushCard" style="display:none"></div>

    <div class="card msnCard" id="msnCard"></div>

    <div id="progCard"></div>

    <div class="card agenda">
      <h3>🏁 Tu próxima victoria</h3>
      <div class="lema">Cada revisión es una oportunidad para subir de nivel.</div>
      <div style="font-size:14px;font-weight:700;margin:-2px 0 8px">Hoy es ${hoy.toLocaleDateString('es-ES',{day:'numeric',month:'long'})}</div>
      <div class="row" style="font-weight:800"><span>Tu revisión semanal</span><span>${fechaLarga(fechaProximaConsulta())}</span></div>
      <div class="row" style="font-weight:800"><span>Próxima renovación</span><span>${fechaCorta(CLIENTE.fecha_renovacion)}</span></div>
      <div class="today">${consultaHoyPendiente()
        ? '💬 La constancia vence al impulso. El cambio real no ocurre en un día de dieta perfecta, sino en los cien días que decidiste no tirar la toalla.'  /* el mensaje de consulta ya sale arriba; aquí una frase fija, no aleatoria */
        : 'Hoy no es día de consulta. Recuerda enviar tus datos antes de las 10:00 (hora Madrid) del '+fmt(CLIENTE.dia_consulta)+', tu día de consulta 🕙'}</div>
      ${(CAL&&(CAL.get-CAL.objetivo)>0)?`<div class="objsem">
        <div class="cap">🎯 TU BATALLA DE ESTA SEMANA</div>
        <div class="big">${CAL.get-CAL.objetivo}<em>g</em></div>
        <div class="sub">es lo que toca derrotar</div>
      </div>`:''}
    </div>

    ${vics.length?`<div class="card vicCard">
      <div class="vicT">⚔️ Así has cambiado</div>
      <div class="vicD">Desde que empezaste este camino has derrotado:</div>
      <div style="margin-top:8px">${vics.map(v=>`<div class="vicIt"><span class="ok">✓</span><span style="font-size:18px;flex:none">${v[0]}</span><span>${v[1]}</span></div>`).join('')}</div>
      ${hito&&hito.texto?`<div class="hitomsg">${hito.texto}</div>`:''}
    </div>`:''}

    <h2 class="sec">🧭 Tu pizarra de hoy</h2>
    <div class="choices">
      <div class="choice active" onclick="pizarra('dieta',this)"><span class="ic">🥗</span>Dieta de hoy</div>
      <div class="choice" onclick="pizarra('gym',this)"><span class="ic">💪</span>Entreno de hoy</div>
      <div class="choice" onclick="pizarra('prox',this)"><span class="ic">🛒</span>Próxima dieta + compra</div>
    </div>
    <div class="card" id="pizarra"></div>

    <h2 class="sec">🎬 Vídeo de la semana</h2>
    <div class="video">
      ${vidThumb?`<img class="thumb" src="https://img.youtube.com/vi/${vidThumb}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()">`:''}
      ${vid?`<a class="play" href="${vid}" target="_blank" rel="noopener">▶</a>`:'<div class="play">▶</div>'}
      <div class="cap">${vid?'Toca para ver el vídeo de esta semana':'Sin vídeo esta semana'}</div>
    </div>

    <div id="reflexHost"></div>

    <h2 class="sec">🏆 Tu transformación y logros</h2>
    <div class="card">
      <div class="evo"><div class="lbl">Peso (kg)</div>
        <div class="stat">
          <div><span class="k">Inicio</span><span class="v">${fmt(pesoIni)}</span></div>
          <div><span class="k">Hoy</span><span class="v now">${fmt(pesoHoy)}</span></div>
          <div><span class="k">Meta</span><span class="v goal">${metaPeso!=null?r1(metaPeso):'—'}</span></div>
        </div>
      </div>
      <div class="bar"><span style="width:${prog}%"></span></div>
      <div class="evo-split">
        <div class="evo-col"><div class="evo"><div class="lbl">Grasa %</div><div class="stat">
          <div><span class="k">Ini</span><span class="v">${fmt(grasaIni)}</span></div>
          <div><span class="k">Hoy</span><span class="v now">${fmt(grasaHoy)}</span></div>
          <div><span class="k">Meta</span><span class="v goal">${metaGrasa!=null?r1(metaGrasa):'—'}</span></div>
        </div></div></div>
        <div class="evo-div"></div>
        <div class="evo-col"><div class="evo"><div class="lbl">IMC</div><div class="stat">
          <div><span class="k">Ini</span><span class="v">${fmt(imcIni)}</span></div>
          <div><span class="k">Hoy</span><span class="v now">${fmt(imcHoy)}</span></div>
          <div><span class="k">Meta</span><span class="v goal">${metaImc!=null?r1(metaImc):'—'}</span></div>
        </div></div></div>
      </div>
      ${hito&&hito.texto?`<div class="hitomsg">${hito.texto}</div>`:''}
      <div class="evo-actions">
        <button class="erow" onclick="verObjetivos()"><span class="ei">🎯</span><span class="et">Tus objetivos</span><span class="ec">›</span></button>
        <button class="erow" onclick="verHistorial()"><span class="ei">📊</span><span class="et">Ver evolución completa</span><span class="ec">›</span></button>
        <button class="erow" onclick="abrirCompartir()"><span class="ei">📤</span><span class="et">Compartir progreso</span><span class="ec">›</span></button>
      </div>
    </div>

    ${CAL?`<h2 class="sec">🔥 Tus calorías</h2>
    <div class="card">
      <div style="display:flex;gap:10px;text-align:center">
        <div style="flex:1"><div style="font-size:14px;color:var(--muted);font-weight:700">Basal</div><div style="font-size:20px;font-weight:800">${CAL.tmb}</div><div style="font-size:14px;color:var(--muted)">kcal</div></div>
        <div style="flex:1"><div style="font-size:14px;color:var(--muted);font-weight:700">Gasto día</div><div style="font-size:20px;font-weight:800">${CAL.get}</div><div style="font-size:14px;color:var(--muted)">kcal</div></div>
        <div style="flex:1"><div style="font-size:14px;color:var(--muted);font-weight:700">Objetivo</div><div style="font-size:20px;font-weight:800;color:var(--teal)">${CAL.objetivo}</div><div style="font-size:14px;color:var(--muted)">${CAL.objLabel}</div></div>
      </div>
      <div style="margin-top:14px;font-size:14px;font-weight:800;color:var(--teal);text-align:center;line-height:1.3">Estas son las calorías y macronutrientes<br>que debes comer en un día</div>
      <div class="prom">
        <div class="c">PROMEDIO DIARIO DE LA SEMANA</div>
        <div class="n">${CAL.objetivo}<em>kcal</em></div>
      </div>
      <div class="macros">
        <div class="mcol"><div class="mn">Proteínas</div><div class="mv">${MAC.prot}<em>g</em></div></div>
        <div class="mdiv"></div>
        <div class="mcol"><div class="mn">Hidratos</div><div class="mv">${MAC.hc}<em>g</em></div></div>
        <div class="mdiv"></div>
        <div class="mcol"><div class="mn">Grasas</div><div class="mv">${MAC.grasa}<em>g</em></div></div>
      </div>
    </div>`:''}

    <div id="faqHost"></div>

    ${esPlanPC()?`<div class="card qdCard" onclick="queDecir()"><span class="qdIco">&#128172;</span><span class="qdTxt"><span class="qdT">&iquest;Y qu&eacute; digo cuando me pregunten?</span><span class="qdD">4 mensajes listos para enviar</span></span><span class="qdChev">&rsaquo;</span></div><div style="padding:6px 4px;margin-bottom:20px" onclick="abrirInvitar()">
      <div style="background:linear-gradient(135deg,#a7f3d0 0%,#e6fffa 100%);padding:20px 18px;border-radius:28px;box-shadow:0 12px 24px rgba(20,184,166,0.12);display:flex;align-items:center;gap:14px;cursor:pointer">
        <div style="flex:1;text-align:left">
          <div style="font-size:18px;font-weight:800;color:#022c22;line-height:1.2;margin-bottom:4px">Hay un Saneamigo en ti</div>
          <div style="font-size:14px;font-weight:600;color:#115e59;line-height:1.3;margin-bottom:8px">Ahorra dinero mes a mes al contagiar Saneas<br>a un amigo o amiga.</div>
          <div style="font-size:16px;font-weight:700;color:#fff;background:#064e3b;padding:5px 12px;border-radius:12px;display:inline-block;line-height:1.1">${esEmbajador()?`Ya ahorras ${CLIENTE.descuento_invitados}€`:'Le harás un gran favor'}</div>
        </div>
      </div>
    </div>`:''}`;
  pizarra('dieta',document.querySelector('#s-inicio .choice'));
  pintarMision();
  pintarPasos();
  pintarPushCard();
  pintarDatosCard(); pintarFAQCard();
}

// ====== Datos fiscales incompletos (para poder facturar) ======
function _faltanDatosFiscales(){
  const c=CLIENTE||{}; const req=['dni','calle','codigo_postal','municipio','provincia'];
  return req.filter(k=>!String(c[k]||'').trim());
}
function pintarDatosCard(){
  const el=document.getElementById('datosFaltanCard'); if(!el) return;
  if(!_faltanDatosFiscales().length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display=''; el.style.border='2px solid #ef9e92'; el.style.background='#fdecea';
  el.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:22px;line-height:1">⚠️</span>
      <div style="flex:1">
        <div style="font-weight:800;color:#b42318;margin-bottom:2px">Falta tu DNI en tu Ficha Personal</div>
        <div style="font-size:14px;color:var(--muted)">Complétalo para que Óscar pueda emitir tus facturas.</div>
        <button class="btn" style="margin-top:10px" onclick="abrirMisDatos()">Completar mis datos</button>
      </div></div>`;
}
function abrirMisDatos(){
  const c=CLIENTE||{}; const falta=_faltanDatosFiscales();
  const CAMPOS=[['dni','DNI (con letra)'],['calle','Calle y número'],['codigo_postal','Código postal'],['municipio','Municipio'],['provincia','Provincia']];
  const rows=CAMPOS.filter(f=>falta.includes(f[0])).map(f=>`<div class="field"><label>${f[1]}</label><input id="md_${f[0]}" value="${String(c[f[0]]||'').replace(/"/g,'&quot;')}"></div>`).join('');
  abrirDetalle('Completa tu Ficha Personal', `
    <p style="color:var(--muted);font-size:14px;margin:0 0 12px">Solo te pedimos lo que falta. Estos datos aparecen en tus facturas.</p>
    ${rows}
    <div id="mdMsg" style="font-size:14px;min-height:18px;margin-top:6px"></div>
    <button class="btn" id="btnMisDatos" onclick="guardarMisDatos()">Guardar</button>`);
}
async function guardarMisDatos(){
  const msg=document.getElementById('mdMsg'); const upd={};
  for(const k of _faltanDatosFiscales()){ const inp=document.getElementById('md_'+k); const v=inp?inp.value.trim():''; if(!v){ msg.style.color='var(--bad)'; msg.textContent='Rellena todos los campos.'; return; } upd[k]=v; }
  if(upd.dni && !/[A-Za-z]$/.test(upd.dni)){ msg.style.color='var(--bad)'; msg.textContent='El DNI debe incluir la letra (ej. 12345678Z).'; return; }
  const btn=document.getElementById('btnMisDatos'); if(btn){ btn.disabled=true; btn.textContent='Guardando…'; }
  const {error}=await sb.from('clientes').update(upd).eq('id',CLIENTE.id);
  if(error){ if(btn){ btn.disabled=false; btn.textContent='Guardar'; } msg.style.color='var(--bad)'; msg.textContent='Error: '+error.message; return; }
  Object.assign(CLIENTE,upd); cerrarDetalle(); renderInicio();
}

