// SANEAS · js/11-registro.js · Registro semanal: secciones y aviso de plazo
// ====== REGISTRO ======
// Perímetros según sexo: mujer → cintura + cadera; hombre → cintura + hombros
function ajustarPerimetros(){
  const mujer=String(CLIENTE&&CLIENTE.genero||'').toLowerCase().startsWith('m');
  const cad=document.getElementById('perCadera'), hom=document.getElementById('perHombros');
  if(cad) cad.style.display = mujer ? '' : 'none';
  if(hom) hom.style.display = mujer ? 'none' : '';
  renderCanon();
}
// Canon de belleza: cintura ideal (altura × factor1) e índice cintura/(cadera|hombro).
// cadera ideal (mujer) u hombros ideales (hombre) = cintura ideal ÷ índice.
function canonBelleza(){
  const alt=Number(CLIENTE&&CLIENTE.altura)||null;
  const ed=edadEn(_hoyCanarias());
  if(!alt||ed==null) return null;
  const hombre=String(CLIENTE.genero||'').toLowerCase().startsWith('h');
  const f1 = hombre ? (ed<30?0.42:(ed<40?0.45:0.49)) : (ed<30?0.38:(ed<40?0.40:0.42));
  const idx = hombre ? (ed<20?0.62:(ed<30?0.68:0.72)) : (ed<20?0.62:(ed<30?0.68:0.74));
  const cinturaIdeal = alt*f1;
  return { hombre, cinturaIdeal, idx, objetivoIdeal: cinturaIdeal/idx, objLabel: hombre?'Hombros':'Cadera' };
}
function renderCanon(){
  const el=document.getElementById('canonCard'); if(!el) return;
  const c=canonBelleza(); if(!c){ el.innerHTML=''; return; }
  const ri=v=>Math.round(v);
  const medC=(ULTIMO&&ULTIMO.per_cintura!=null)?Number(ULTIMO.per_cintura):null;
  const medO=(ULTIMO&&(c.hombre?ULTIMO.per_hombro:ULTIMO.per_cadera)!=null)?Number(c.hombre?ULTIMO.per_hombro:ULTIMO.per_cadera):null;
  el.innerHTML=`<div style="background:#eaf6f9;border-radius:14px;padding:12px;margin-bottom:14px;text-align:center">
    <div style="font-size:16px;font-weight:800;color:var(--dark);margin-bottom:8px">🎯 Tu canon de belleza</div>
    <div style="display:flex;gap:10px">
      <div style="flex:1"><div style="font-size:14px;color:var(--muted);font-weight:700">Cintura ideal</div><div style="font-size:22px;font-weight:800;color:var(--teal)">${ri(c.cinturaIdeal)} cm</div>${medC!=null?`<div style="font-size:14px;color:var(--muted);font-weight:600">la tuya: ${r1(medC)}</div>`:''}</div>
      <div style="flex:1"><div style="font-size:14px;color:var(--muted);font-weight:700">${c.objLabel} ideal</div><div style="font-size:22px;font-weight:800;color:var(--teal)">${ri(c.objetivoIdeal)} cm</div>${medO!=null?`<div style="font-size:14px;color:var(--muted);font-weight:600">la tuya: ${r1(medO)}</div>`:''}</div>
    </div>
  </div>`;
}
function regTab(k,el){['imp','pli','per'].forEach(x=>{document.getElementById('r-'+x).classList.add('hidden');
    const b=document.getElementById('btnReg_'+x); if(b) b.classList.add('hidden');});
  document.getElementById('r-'+k).classList.remove('hidden');
  const bk=document.getElementById('btnReg_'+k); if(bk) bk.classList.remove('hidden');
  document.querySelectorAll('#s-registro .tabs button').forEach(b=>b.classList.remove('active'));el.classList.add('active');}

// ====== REGISTRO POR SECCIONES ======
// Cada seccion se envia sola y lleva su cuenta: 0 sin enviar · 1 enviado · 2 corregido (bloqueado).
// Mandar los perimetros el viernes no puede tocar el peso del lunes: los campos vacios NO se mandan.
const SECCIONES = {
  imp: { nom:'impedancia', col:'env_impedancia', obligatorios:true,
         campos:['peso','grasa_corporal','grasa_subcutanea','grasa_visceral','agua',
                 'musculo_esqueletico','masa_muscular','masa_esqueletica','proteina'] },
  pli: { nom:'pliegues', col:'env_pliegues', obligatorios:false,
         campos:['pli_bicipital','pli_abdominal','pli_cuadricipital',
                 'pli_subescapular','pli_tricipital','pli_suprailiaco'] },
  per: { nom:'perimetros', col:'env_perimetros', obligatorios:false,
         campos:['per_cintura','per_cadera','per_hombro'] },
};
const NOMBRE_CAMPO = {
  peso:'el peso', grasa_corporal:'la grasa corporal', grasa_subcutanea:'la grasa subcutánea',
  grasa_visceral:'la grasa visceral', agua:'el agua', musculo_esqueletico:'el músculo esquelético',
  masa_muscular:'la masa muscular', masa_esqueletica:'la masa ósea', proteina:'la proteína',
  pli_bicipital:'el pliegue bicipital', pli_abdominal:'el pliegue abdominal',
  pli_cuadricipital:'el pliegue cuadricipital', pli_subescapular:'el pliegue subescapular',
  pli_tricipital:'el pliegue tricipital', pli_suprailiaco:'el pliegue suprailíaco',
  per_cintura:'la cintura', per_cadera:'la cadera', per_hombro:'los hombros',
};
let REG_SEM = null;   // el registro de esta semana, o null

function lunesStrHoy(){
  const hoy=new Date(); const dow=(hoy.getDay()+6)%7;
  const l=new Date(hoy); l.setDate(hoy.getDate()-dow);
  return l.toISOString().slice(0,10);
}
function campoVisible(c){
  // Cadera/hombros se ocultan segun sexo: lo oculto no puede ser obligatorio.
  const el=document.getElementById('f_'+c); if(!el) return false;
  const cont=el.closest('.field');
  return !(cont && cont.style.display==='none');
}
function etiquetaBoton(estado){
  return estado===0 ? 'Enviar' : estado===1 ? '✏️ Corregir' : '🔒 Ya enviado y corregido';
}

// Carga el registro de la semana, precarga los campos y pinta los tres botones.
async function cargarEstadoRegistro(){
  if(!CLIENTE || !CLIENTE.id) return;
  const {data}=await sb.from('registros').select('*').eq('cliente_id',CLIENTE.id)
    .eq('ciclo', (await sb.rpc('saneas_ciclo_hoy',{p_cliente_id:CLIENTE.id})).data).limit(1);
  REG_SEM=(data&&data[0])||null;
  Object.keys(SECCIONES).forEach(sec=>{
    const S=SECCIONES[sec], estado=REG_SEM?(REG_SEM[S.col]??0):0;
    // Precargar lo guardado: antes se borraba el formulario y parecia que no habia enviado nada.
    S.campos.forEach(c=>{ const el=document.getElementById('f_'+c); if(!el) return;
      el.value=(REG_SEM&&REG_SEM[c]!=null)?String(REG_SEM[c]).replace('.',','):''; el.style.borderColor=''; });
    const btn=document.getElementById('btnReg_'+sec); if(!btn) return;
    btn.textContent=etiquetaBoton(estado); btn.disabled=estado>=2; btn.style.opacity=estado>=2?'.55':'';
  });
  pintarAvisoPlazo();
}

// Aviso cuando la impedancia llego fuera de plazo: los datos SI estan, pero no hay consulta.
// ⚠️ Al cliente se le habla SIEMPRE en hora de Madrid: el corte son "las 10:00".
function pintarAvisoPlazo(){
  const box=document.getElementById('avisoPlazo'); if(!box) return;
  const tarde=!!(REG_SEM && REG_SEM.enviado_tarde && REG_SEM.peso!=null);
  box.style.display=tarde?'block':'none';
  if(tarde) box.innerHTML='⏰ <b>Tus datos de esta semana se han grabado correctamente</b>, pero llegaron fuera de plazo, '
    +'así que esta semana no podremos pasarte consulta.<br>Recuerda: el límite es a las <b>10:00 de la mañana</b> '
    +'de tu día asignado. La semana que viene te esperamos a tiempo.';
}

var MSG_AMIGA = [
  { t: "La sencilla",
    m: "Oye, \u00bfte acuerdas que te dije que estaba haciendo una cosa con la comida? Es esto. Llevo {S} semanas y por primera vez no lo he dejado. Te paso el enlace por si te sirve, y si no, lo ignoras. https://saneas.es" },
  { t: "No es una dieta",
    m: "No s\u00e9 si te interesa, pero por si acaso. Llevo unos meses con un nutricionista, \u00d3scar. No va de pasar hambre ni de prohibirte cosas, va m\u00e1s de que haya alguien encima cada semana. A m\u00ed lo que me est\u00e1 sirviendo es no estar sola en esto. https://saneas.es" },
  { t: "Si te han preguntado",
    m: "Es Saneas, lo que te cont\u00e9. Te mandan la comida de la semana y cada semana hablas con \u00e9l y te lo va ajustando. Nada raro: ni batidos, ni pastillas, ni productos. Si quieres te cuento con calma. https://saneas.es" },
  { t: "Para alguien de confianza",
    m: "Te lo digo a ti porque s\u00e9 que llevas tiempo d\u00e1ndole vueltas, no para meterte prisa. Yo llevo {S} semanas y lo que m\u00e1s me ha cambiado no es el peso, es dejar de empezar de cero cada lunes. Si alg\u00fan d\u00eda te apetece mirarlo, aqu\u00ed est\u00e1. https://saneas.es" }
];
function _semanasClienta(){
  var s = (window.__PROG && window.__PROG.semanas) || (typeof CLIENTE !== "undefined" && CLIENTE && CLIENTE.semana) || null;
  return s ? String(s) : "unas cuantas";
}
function enviarAmiga(i){
  var t = MSG_AMIGA[i]; if(!t) return;
  var txt = t.m.split("{S}").join(_semanasClienta());
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
}
