// SANEAS · js/13-registro-envio.js · Envío del registro: validación y guardado
function seccionEnviada(sec){
  try{
    if(!ULTIMO) return false;
    var c = SECCIONES[sec] && SECCIONES[sec].campos;
    if(!c) return false;
    for(var i=0;i<c.length;i++){
      var v = ULTIMO[c[i]];
      if(v !== null && v !== undefined && v !== "") return true;
    }
    return false;
  }catch(e){ return false; }
}
function pintarBotonesRegistro(){
  ["imp","pli","per"].forEach(function(sec){
    var b = document.getElementById("btnReg_"+sec);
    if(!b) return;
    if(!window.__regCargado || typeof CLIENTE === "undefined" || !CLIENTE){
      var c0 = document.getElementById("r-"+sec);
      if(c0) b.classList.toggle("hidden", c0.classList.contains("hidden"));
      b.disabled = true; b.style.opacity = ".45"; b.textContent = "Cargando…"; return;
    }
    var cont = document.getElementById("r-"+sec);
    if(cont) b.classList.toggle("hidden", cont.classList.contains("hidden"));
    b.disabled = false; b.style.opacity = "";
    b.textContent = seccionEnviada(sec) ? "Enviado ✓ · Corregir" : "Enviar";
  });
}
function vigilarPestanas(){
  ["imp","pli","per"].forEach(function(sec){
    var c = document.getElementById("r-"+sec);
    if(!c || c.__vigilado) return;
    c.__vigilado = true;
    new MutationObserver(function(){ pintarBotonesRegistro(); })
      .observe(c, { attributes:true, attributeFilter:["class"] });
  });
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", vigilarPestanas);
else vigilarPestanas();
setInterval(function(){
  vigilarPestanas();
  var f;
  try{ f = (window.__regCargado?"1":"0") + ((typeof CLIENTE!=="undefined" && CLIENTE)?"1":"0") + "|" + ["imp","pli","per"].map(seccionEnviada).join(""); }
  catch(e){ f = "x"; }
  if(f !== window.__regFirma){ window.__regFirma = f; pintarBotonesRegistro(); }
}, 400);
async function guardarSeccion(sec){
  const S=SECCIONES[sec], btn=document.getElementById('btnReg_'+sec);
  const estado=REG_SEM?(REG_SEM[S.col]??0):0;
  if(estado>=2){ setMsg('regSaveMsg','Ya enviaste y corregiste tus '+S.nom+' esta semana. Podrás volver el lunes.','err'); return; }

  // Impedancia: o esta completa o no entra. Y se dice QUE falta, por su nombre.
  if(S.obligatorios){
    const faltan=S.campos.filter(c=>campoVisible(c) && num(document.getElementById('f_'+c).value)===null);
    if(faltan.length){
      const n=faltan.map(c=>NOMBRE_CAMPO[c]||c);
      setMsg('regSaveMsg', n.length===1?('Aún falta '+n[0]+' por rellenar.'):('Aún faltan por rellenar: '+listaNatural(n)+'.'),'err');
      let primero=null;
      S.campos.forEach(c=>{ const el=document.getElementById('f_'+c); if(!el) return;
        const vacio=campoVisible(c)&&num(el.value)===null;
        el.style.borderColor=vacio?'#e05252':''; if(vacio&&!primero) primero=el; });
      if(primero){ primero.focus(); primero.scrollIntoView({block:'center',behavior:'smooth'}); }
      return;
    }
  }
  S.campos.forEach(c=>{ const el=document.getElementById('f_'+c); if(el) el.style.borderColor=''; });

  // Solo los campos con valor: asi un envio nunca pisa lo ya guardado.
  const row={}; let algo=false;
  S.campos.forEach(c=>{ const el=document.getElementById('f_'+c); if(!el) return;
    const v=num(el.value); if(v!==null){ row[c]=v; algo=true; } });
  if(!algo){ setMsg('regSaveMsg','Rellena al menos un dato de '+S.nom+' antes de enviar.','err'); return; }

  btn.disabled=true; const txtPrev=btn.textContent; btn.textContent='Guardando…';
  try{
    if(sec==='imp'){
      // % a kg
      ['masa_muscular','masa_esqueletica'].forEach(k=>{ const chk=document.getElementById('f_'+k+'_pct');
        if(chk&&chk.checked&&row[k]!=null&&row.peso!=null){ row[k]=Math.round(row.peso*(row[k]/100)*10)/10; } });
      const g=row.grasa_corporal;
      if(row.peso!=null && CLIENTE && CLIENTE.altura){ const h=CLIENTE.altura/100; row.imc=Math.round((row.peso/(h*h))*10)/10; }
      if(row.peso!=null && g!=null){ row.peso_sin_grasa=Math.round(row.peso*(1-g/100)*10)/10; }
      const edadHoy=edadEn(new Date().toISOString().slice(0,10));
      const esM=esMujerDe(CLIENTE.genero);
      if(edadHoy!=null && g!=null && esM!==null){ const ideal=esM?24:19; row.edad_metabolica=Math.round(edadHoy*(1+(g-ideal)/100)); }
      // SOLO la impedancia decide la consulta. Mandar perimetros a las 15:00 no puede
      // marcar Sin Consulta: lo que se consulta es el peso.
      row.hora_envio=new Date().toISOString();
      row.enviado_tarde=(esDiaConsultaHoy() && deadlinePasado());
    }
    row[SECCIONES[sec].col]=Math.min(estado+1,2);

    let error;
    if(REG_SEM){ ({error}=await sb.from('registros').update(row).eq('id',REG_SEM.id)); }
    else { row.cliente_id=CLIENTE.id; row.fecha=_hoyCanarias(); row.semana=CLIENTE.semana||null;
           ({error}=await sb.from('registros').insert(row)); }
    if(error) throw error;

    setMsg('regSaveMsg', row[SECCIONES[sec].col]===1
      ? ('✅ '+S.nom.charAt(0).toUpperCase()+S.nom.slice(1)+' guardados. Si te equivocaste, puedes corregir una vez.')
      : ('✅ Corregido. Tus '+S.nom+' quedan cerrados hasta la semana que viene.'), 'ok');
    await cargarEstadoRegistro();
    if(sec==='imp'){ ULTIMO=Object.assign({},REG_SEM); renderInicio(); }
  }catch(e){
    setMsg('regSaveMsg','Error al guardar: '+(e.message||e),'err');
    btn.disabled=false; btn.textContent=txtPrev;
  }
}

