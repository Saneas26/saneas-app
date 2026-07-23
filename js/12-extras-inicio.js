// SANEAS · js/12-extras-inicio.js · Qué decir, mapa de progreso, legado (100 días), reporte de voz y fase
function queDecir(){
  var s = _semanasClienta();
  var h = '<div class="faqBody">'
    + '<div class="fqHero"><div class="fqHeroT">Alguien te habr\u00e1 <em>preguntado</em></div><div class="fqRaya"></div></div>'
    + '<p class="fqLead">Cuando llevas ' + s + ' semanas y se te empieza a notar, la gente pregunta. Aqu\u00ed tienes preparado qu\u00e9 contestar.</p>';
  for(var i = 0; i < MSG_AMIGA.length; i++){
    h += '<div class="amCard"><div class="amTit">' + MSG_AMIGA[i].t + '</div>'
      + '<div class="amTxt">' + MSG_AMIGA[i].m.split("{S}").join(s).replace(" https://saneas.es","") + '</div>'
      + '<button class="amBtn" onclick="enviarAmiga(' + i + ')">Enviar por WhatsApp</button></div>';
  }
  h += '<div class="fqPie"><span class="e">&#8505;</span><span>Se abre WhatsApp con el texto puesto. Eliges t\u00fa a qui\u00e9n y puedes cambiar lo que quieras antes de enviarlo.</span></div>'
    + '<div class="amPie">Si alguien entra por ti, tu cuota baja 10 &euro; al mes mientras sig\u00e1is las dos.</div>'
    + '</div>';
  abrirDetalle("Qu\u00e9 decir si te preguntan", h);
}
function _pg(ini, act, obj){
  if(ini == null || act == null || obj == null) return null;
  if(ini === obj) return 1;
  return Math.max(0, Math.min(1, (ini - act) / (ini - obj)));
}
function _media3(regs, hasta, campo){
  var v = [];
  for(var i = hasta; i >= 0 && v.length < 3; i--){ if(regs[i][campo] != null) v.push(Number(regs[i][campo])); }
  if(!v.length) return null;
  var s = 0; for(var j = 0; j < v.length; j++) s += v[j];
  return s / v.length;
}
function _primero(regs, campo){
  for(var i = 0; i < regs.length; i++){ if(regs[i][campo] != null) return Number(regs[i][campo]); }
  return null;
}
function _progresoEn(regs, hasta, obj){
  var P = [
    ["grasa_corporal", obj.iniGrasa,   obj.objGrasa,   30],
    ["peso",           obj.iniPeso,    obj.objPeso,    20],
    ["per_cintura",    obj.iniCintura, obj.objCintura, 20],
    ["masa_muscular",  obj.iniMusculo, obj.objMusculo, 15],
    ["agua",           obj.iniAgua,    obj.objAgua,    10],
    ["proteina",       obj.iniProt,    obj.objProt,     5]
  ];
  var num = 0, den = 0;
  for(var i = 0; i < P.length; i++){
    var v = _pg(P[i][1], _media3(regs, hasta, P[i][0]), P[i][2]);
    if(v == null) continue;
    num += v * P[i][3]; den += P[i][3];
  }
  if(!den) return null;
  return num / den;
}
async function calcularProgreso(){
  try{
    if(typeof CLIENTE === "undefined" || !CLIENTE || !CLIENTE.id) return;
    var r = await sb.from("registros")
      .select("fecha,peso,per_cintura,grasa_corporal,agua,masa_muscular,proteina,sin_consulta")
      .eq("cliente_id", CLIENTE.id)
      .order("fecha", { ascending: true });
    var regs = ((r && r.data) || []).filter(function(x){
      return x.peso != null || x.per_cintura != null || x.grasa_corporal != null;
    });
    if(regs.length < 2) return;
    var esHombre = ((CLIENTE.genero || "") + "").toLowerCase().charAt(0) === "h";
    var alt = Number(CLIENTE.altura) || null;
    var iniPeso = _primero(regs, "peso");
    var iniMus  = _primero(regs, "masa_muscular");
    var obj = {
      iniGrasa:   _primero(regs, "grasa_corporal"),
      iniPeso:    iniPeso,
      iniCintura: _primero(regs, "per_cintura"),
      iniMusculo: iniMus,
      iniAgua:    _primero(regs, "agua"),
      iniProt:    _primero(regs, "proteina"),
      objGrasa:   esHombre ? 19 : 24,
      objPeso:    iniPeso ? iniPeso * 0.90 : null,
      objCintura: alt ? alt * 0.48 : null,
      objMusculo: iniMus ? iniMus + 1 : null,
      objAgua:    esHombre ? 57 : 52,
      objProt:    17
    };
    var mejor = 0, hubo = false;
    for(var i = 1; i < regs.length; i++){
      var v = _progresoEn(regs, i, obj);
      if(v == null) continue;
      hubo = true;
      if(v > mejor) mejor = v;
    }
    if(!hubo) return;
    // Tope del 90%: los numeros no son todo el objetivo de una clienta,
    // mostrar un 100% seria decirle que ya no queda nada por hacer.
    window.__PROG = { pct: Math.min(90, Math.round(mejor * 100)), semanas: regs.length, pedir: _elegible(regs) };
    pintarProgreso();
    cargarFrase100();
  }catch(e){ }
}
function _silenciado(){
  try{
    var h = localStorage.getItem("saneas_pedir_no");
    if(!h) return false;
    return (Date.now() - Number(h)) < 90*24*3600*1000;
  }catch(e){ return false; }
}
function ahoraNo(){
  try{ localStorage.setItem("saneas_pedir_no", String(Date.now())); }catch(e){}
  var el = document.getElementById("pedirCard"); if(el) el.remove();
}
function _elegible(regs){
  // 1. al menos 8 semanas de recorrido
  if(!regs || regs.length < 8) return false;
  // 2. VETO: llego tarde en alguno de los 2 ultimos envios
  for(var i = regs.length-1; i >= Math.max(0, regs.length-2); i--){
    if(regs[i].sin_consulta === true) return false;
  }
  // 3. VETO: el peso ha subido respecto a hace 4 semanas
  var ult = _media3(regs, regs.length-1, "peso");
  var ant = _media3(regs, Math.max(0, regs.length-5), "peso");
  if(ult != null && ant != null && ult > ant + 0.3) return false;
  // 4. VETO: ya dijo que ahora no
  if(_silenciado()) return false;
  return true;
}
function pintarPedir(){
  // La reflexión y "qué contestar" viven al final de la historia (reflexHost); si no existe, junto al mapa
  var host = document.getElementById("reflexHost") || document.getElementById("progCard");
  if(!host || !window.__PROG || !window.__PROG.pedir) return;
  if(document.getElementById("pedirCard")) return;
  var d = document.createElement("div");
  d.id = "pedirCard";
  d.className = "card pdCard";
  d.innerHTML = '<div class="pdT">Alguien te habr&aacute; preguntado ya</div>'
    + '<div class="pdD">Cuando llevas ' + window.__PROG.semanas + ' semanas y se te empieza a notar, la gente pregunta. Te dejamos preparado qu&eacute; contestar.</div>'
    + '<div class="pdBtns"><button class="pdSi" onclick="queDecir()">Ver qu&eacute; puedo mandar</button>'
    + '<button class="pdNo" onclick="ahoraNo()">Ahora no</button></div>';
  if(host.id==="reflexHost") host.appendChild(d);
  else host.parentNode.insertBefore(d, host.nextSibling);
}
var FRASE100 = null;
async function cargarFrase100(){
  try{
    if(typeof CLIENTE === "undefined" || !CLIENTE || !CLIENTE.id) return;
    var r = await sb.from("saneas_frases").select("id,texto,creado_en,devuelta_en")
      .eq("cliente_id", CLIENTE.id).order("creado_en", { ascending:false }).limit(1);
    FRASE100 = (r && r.data && r.data[0]) || null;
    pintar100();
  }catch(e){ }
}
async function guardar100(){
  var ta = document.getElementById("f100txt");
  if(!ta || !ta.value.trim()) return;
  var b = document.getElementById("f100ok"); if(b){ b.disabled = true; b.textContent = "Guardando..."; }
  try{
    await sb.from("saneas_frases").insert({ cliente_id: CLIENTE.id,
      texto: ta.value.trim(), semanas: (window.__PROG && window.__PROG.semanas) || null });
    var c = document.getElementById("f100"); if(c) c.remove();
    await cargarFrase100();
  }catch(e){ if(b){ b.disabled=false; b.textContent="Guardar"; } }
}
function enviar100(){
  if(!FRASE100) return;
  var txt = FRASE100.texto + "\n\nhttps://saneas.es";
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
  try{ sb.from("saneas_frases").update({ devuelta_en: new Date().toISOString() }).eq("id", FRASE100.id); }catch(e){}
  var c = document.getElementById("f100dev"); if(c) c.remove();
}
function ocultar100(){ var c = document.getElementById("f100dev"); if(c) c.remove();
  try{ sb.from("saneas_frases").update({ devuelta_en: new Date().toISOString() }).eq("id", FRASE100.id); }catch(e){} }
function pintar100(){
  var host = document.getElementById("reflexHost") || document.getElementById("progCard");
  if(!host || !window.__PROG) return;
  var mete = function(el){ if(host.id==="reflexHost") host.appendChild(el); else host.parentNode.insertBefore(el, host.nextSibling); };
  var sem = window.__PROG.semanas || 0;
  if(!FRASE100 && sem >= 14 && !document.getElementById("f100")){
    var d = document.createElement("div");
    d.id = "f100"; d.className = "card f1Card";
    d.innerHTML = '<div class="f1T">&#128172; Tu legado: &iquest;qu&eacute; le dir&iacute;as a la persona que empez&oacute; este camino?</div>'
      + '<textarea id="f100txt" rows="3" class="f1Ta" placeholder="Escr&iacute;belo. Cuando llegues a tu objetivo volver&aacute;s a leerlo."></textarea>'
      + '<button id="f100ok" class="f1Btn" onclick="guardar100()">Guardar</button>';
    mete(d);
    return;
  }
  if(FRASE100 && !FRASE100.devuelta_en && !document.getElementById("f100dev")){
    var dias = (Date.now() - new Date(FRASE100.creado_en).getTime()) / 86400000;
    if(dias < 2) return;
    var e = document.createElement("div");
    e.id = "f100dev"; e.className = "card f1Card";
    e.innerHTML = '<div class="f1T">Esto lo escribiste t&uacute;</div>'
      + '<div class="f1Cita">&laquo;' + esc(FRASE100.texto) + '&raquo;</div>'
      + '<div class="f1D">&iquest;Hay alguien a quien le vendr&iacute;a bien leerlo?</div>'
      + '<div class="pdBtns"><button class="pdSi" onclick="enviar100()">Mand&aacute;rselo</button>'
      + '<button class="pdNo" onclick="ocultar100()">Ahora no</button></div>';
    mete(e);
  }
}
function pintarProgreso(){
  var el = document.getElementById("progCard");
  if(!el || !window.__PROG) return;
  var p = window.__PROG.pct, sem = window.__PROG.semanas;
  var sig = p + "|" + sem;
  if(el.getAttribute("data-prog") === sig) return;   // el interval repinta: no tocar el DOM si nada cambió
  var dots = "";
  [0,25,50,75].forEach(function(q){ dots += '<span class="mapDot' + (p>=q?' on':'') + '" style="left:' + q + '%"></span>'; });
  var hv = hitoViaje();
  el.innerHTML = '<div class="card mapCard">'
    + '<div class="mapTit">🗺️ El mapa de tu viaje</div>'
    + '<div class="mapTrack">'
    +   '<span class="mapLine"></span>'
    +   '<span class="mapFill" style="width:' + p + '%"></span>'
    +   dots
    +   '<span class="mapYo" style="left:' + p + '%">🚶</span>'
    +   '<span class="mapMeta">🏁</span>'
    + '</div>'
    + '<div class="mapRow"><span>Semana 1</span><span>Tu objetivo</span></div>'
    + '<div class="mapPie">Empezaste hace ' + sem + ' semanas · Has recorrido el ' + p + '%</div>'
    + '<div class="mapSub">El camino que ya has andado nadie te lo puede quitar.</div>'
    + (hv ? '<div class="mapHito">' + hv + '</div>' : '')
    + '</div>';
  el.setAttribute("data-prog", sig);
}
setInterval(function(){ pintarReporte(); pintarFase(); pintarCapitulo(); pintarMision(); if(typeof pintarDiario==='function') pintarDiario(); if(window.__PROG){ pintarProgreso(); pintarPedir(); pintar100(); } }, 800);
var __REP;
async function cargarReporte(){
  try{
    if(typeof CLIENTE==="undefined"||!CLIENTE||!CLIENTE.id) return;
    var r=await sb.storage.from("reportes").list(CLIENTE.id,{ limit:10, sortBy:{ column:"created_at", order:"desc" } });
    var files=((r&&r.data)||[]).filter(function(f){ return f.name && f.name.indexOf(".")>0; }).slice(0,3);
    if(!files.length){ __REP=[]; return; }
    var out=[];
    for(var i=0;i<files.length;i++){
      var s=await sb.storage.from("reportes").createSignedUrl(CLIENTE.id+"/"+files[i].name, 3600);
      var url=s && s.data && s.data.signedUrl;
      if(url){
        var ms=parseInt(files[i].name,10);
        var fecha=(ms && !isNaN(ms)) ? new Date(ms) : (files[i].created_at ? new Date(files[i].created_at) : null);
        out.push({ url:url, fecha:fecha });
      }
    }
    __REP=out;
  }catch(e){ __REP=[]; }
}
function _repFecha(d){
  if(!d) return "";
  try{ var s=d.toLocaleString("es-ES",{ timeZone:"Europe/Madrid", weekday:"long", day:"2-digit", month:"long", hour:"2-digit", minute:"2-digit" });
    return s.charAt(0).toUpperCase()+s.slice(1); }catch(e){ return ""; }
}
var __FASE;
async function _calcCrea(){
  window.__CREA = null; window.__PESO_HOY = null;
  try{
    if(!__FASE || !__FASE.texto || __FASE.texto.indexOf("{{CREA}}") < 0) return;
    var pesoHoy = null;
    try{
      var hoy = new Date().toISOString().slice(0,10);
      var rp = await sb.from("registros").select("fecha,peso").eq("cliente_id", CLIENTE.id).not("peso","is",null).lte("fecha", hoy).order("fecha",{ascending:false}).limit(1);
      if(rp && rp.data && rp.data[0] && rp.data[0].peso) pesoHoy = Number(rp.data[0].peso);
    }catch(e){}
    if((!pesoHoy || !(pesoHoy > 0)) && CLIENTE && CLIENTE.peso_inicial) pesoHoy = Number(CLIENTE.peso_inicial);
    window.__PESO_HOY = pesoHoy;
    if(pesoHoy && pesoHoy > 0) window.__CREA = Math.round(pesoHoy/10) + " g/día";
  }catch(e){ window.__CREA = null; }
}
function _faseHtml(){
  var t = (__FASE && __FASE.texto) || "";
  var c = window.__CREA || "1 g por cada 10 kg de tu peso";
  return t.split("{{CREA}}").join(c);
}
async function cargarFase(){
  try{
    if(typeof CLIENTE==="undefined"||!CLIENTE) return;
    var did = CLIENTE.dieta_actual_id;
    if(!did){ __FASE=null; return; }
    var bl = (typeof DIETA!=="undefined" && DIETA && DIETA.id===did) ? DIETA.comentario_bloque : null;
    if(bl===null||bl===undefined){
      var rd = await sb.from("dietas").select("comentario_bloque").eq("id",did).maybeSingle();
      bl = (rd && rd.data) ? rd.data.comentario_bloque : null;
    }
    if(bl===null||bl===undefined){ __FASE=null; return; }
    var r = await sb.from("saneas_comentarios_fase").select("*")
      .eq("semana", bl).eq("publicado", true).limit(1);
    __FASE = (r && r.data && r.data[0]) || null;
    await _calcCrea();
  }catch(e){ __FASE=null; }
}
function _faseLeida(k){ try{ return localStorage.getItem("saneas_fase_"+k)==="1"; }catch(e){ return false; } }
function toggleFase(){
  if(!__FASE) return;
  var c=document.getElementById("faseCuerpo"), ch=document.getElementById("faseChev");
  if(!c) return;
  var abierto = c.style.display!=="none";
  c.style.display = abierto ? "none" : "block";
  if(ch) ch.style.transform = abierto ? "" : "rotate(90deg)";
  var lb = document.getElementById("faseLbl"); if(lb) lb.textContent = abierto ? "Desplegar" : "Ocultar";
  if(abierto){ try{ localStorage.setItem("saneas_fase_"+__FASE.semana,"1"); }catch(e){} }
}
function pintarFase(){
  if(typeof __FASE==="undefined") return;
  var cont=document.getElementById("s-dieta"); if(!cont) return;
  var host=document.getElementById("fasePanel");
  if(!__FASE){ if(host) host.remove(); return; }
  if(!host){ host=document.createElement("div"); host.id="fasePanel"; cont.insertBefore(host, cont.firstElementChild); }
  else if(cont.firstElementChild!==host){ cont.insertBefore(host, cont.firstElementChild); }
  if(host.getAttribute("data-fase")===String(__FASE.semana)) return;
  var abierta = !_faseLeida(__FASE.semana);
    var _nd = (typeof DIETA!=="undefined" && DIETA && DIETA.nombre_plan) ? String(DIETA.nombre_plan).replace(/_S\d+$/,"").replace(/_/g," ").trim() : "";
    var sub = (_nd && _nd.toLowerCase()!==String(__FASE.titulo||"").toLowerCase()) ? _nd : (__FASE.fase||"");
  host.innerHTML = '<div class="card faCard">'
    + '<button class="faHead" onclick="toggleFase()">'
    + '<span class="faIco">&#128220;</span>'
    + '<span class="faTxt"><span class="faTit">'+esc(__FASE.titulo||"Tu fase")+'</span>'
    + '<span class="faSub">'+esc(sub)+'</span></span>'
      + '<span id="faseLbl" style="font-size:14px;font-weight:700;color:var(--muted);margin-right:8px;white-space:nowrap">'+(abierta?"Ocultar":"Desplegar")+'</span>'
    + '<span class="faChev" id="faseChev" style="'+(abierta?"transform:rotate(90deg)":"")+'">&rsaquo;</span></button>'
    + '<div class="faBody" id="faseCuerpo" style="display:'+(abierta?"block":"none")+'">'
    + _faseHtml()
    + '</div></div>';
  host.setAttribute("data-fase", String(__FASE.semana));
}
// El distintivo "Audio listo" vive arriba a la derecha, a la altura del "Hola".
// Se enciende solo cuando el panel sube un reporte (__REP) y al tocarlo baja al reproductor.
function irAlReporte(){ var p=document.getElementById("repPlayer"); if(p) p.scrollIntoView({behavior:"smooth",block:"center"}); }
function pintarReporte(){
  if(typeof __REP==="undefined") return;
  var cont=document.getElementById("s-inicio");
  var host=document.getElementById("repBadge");
  // El reproductor vive abajo del todo de la página (decidido por Oscar el 22/07)
  var pl=document.getElementById("repPlayer");
  if(cont){
    if(!pl){ pl=document.createElement("div"); pl.id="repPlayer"; cont.appendChild(pl); }
    else if(cont.lastElementChild!==pl){ cont.appendChild(pl); }
  }
  if(!__REP.length){
    if(host && host.innerHTML!==""){ host.innerHTML=""; host.removeAttribute("data-rep"); }
    if(pl && pl.innerHTML!==""){ pl.innerHTML=""; pl.removeAttribute("data-rep"); }
    return;
  }
  var sig=__REP.map(function(a){ return a.url; }).join("|");
  if(host && host.getAttribute("data-rep")!==sig){
    host.innerHTML='<button class="repBadge" onclick="irAlReporte()">'
      +'<span class="rbTop">&#127911; Audio listo <span class="rbFlecha">&darr;</span></span>'
      +'<span class="rbSub">Tu reporte te espera al final de la p&aacute;gina</span></button>';
    host.setAttribute("data-rep",sig);
  }
  if(pl && pl.getAttribute("data-rep")!==sig){
    var h='<div class="card rpCard"><div class="rpT"><span class="rpIco">&#127908;</span>Tu reporte de voz</div>';
    __REP.forEach(function(a,idx){
      h+='<div class="rpItem"'+(idx>0?' style="border-top:1px solid var(--light);padding-top:12px"':'')+'>'
        +'<div class="rpFecha">'+_repFecha(a.fecha)+'</div>'
        +'<audio controls preload="none" src="'+a.url+'"></audio></div>';
    });
    h+='</div>';
    pl.innerHTML=h;
    pl.setAttribute("data-rep",sig);
  }
}
