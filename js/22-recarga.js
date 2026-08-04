// SANEAS · js/22-recarga.js · Recarga automática: 20 min en segundo plano + aviso forzado desde el panel
// El iPhone (y algún Android) congela la PWA en segundo plano: al volver
// horas o días después se ve la versión y los datos del momento en que se
// fue. Recargar trae todo al día (saludo, misión, pasos, diario, dieta, y
// cualquier cambio hecho desde el panel) sin mantener a mano una lista de
// qué re-ejecutar cada vez que se añade algo nuevo a Inicio.
// No afecta al login: la sesión de Supabase vive en el almacenamiento del
// navegador (no en memoria de la página), así que al recargar sb.auth.getUser()
// la encuentra igual que en cualquier apertura normal — es el mismo flujo que
// ya ocurre cuando el móvil mata la pestaña en segundo plano por memoria.
// Y NUNCA recargamos si hay algo a medio escribir o sonando (aMedias).
(function(){
  var RECARGA_MIN = 20;        // minutos seguidos en segundo plano para recargar
  var oculta = null;           // cuándo se fue la app al fondo
  var FORZAR_CHECK_MIN = 5;    // cada cuántos minutos se comprueba la bandera de recarga forzada
  var LS_KEY = 'saneas_forzar_recarga_visto';

  // No tiene sentido recargar la pantalla de login/splash, ni antes de que exista CLIENTE.
  function sesionActiva(){
    try{
      var main = document.getElementById('main');
      return !!(main && !main.classList.contains('hidden') && typeof CLIENTE!=='undefined' && CLIENTE && CLIENTE.id);
    }catch(e){ return false; }
  }

  // El registro semanal se precarga con lo ya guardado, así que "a medias"
  // no es "no vacío": es "distinto de como lo dejó la precarga". Guardamos
  // una foto de los campos cada vez que la app los precarga.
  var fotoReg = null;
  function sacarFotoReg(){
    fotoReg = {};
    var l = document.querySelectorAll('#s-registro input');
    for(var i=0;i<l.length;i++){ if(l[i].id) fotoReg[l[i].id]=String(l[i].value||''); }
  }
  if(typeof cargarEstadoRegistro === 'function'){
    var _cER = cargarEstadoRegistro;
    cargarEstadoRegistro = function(){
      var r = _cER.apply(this, arguments);
      Promise.resolve(r).then(sacarFotoReg).catch(function(){});
      return r;
    };
  }

  function aMedias(){
    try{
      var d = document.getElementById('detail');
      if(d && d.classList.contains('open')) return true;                       // ficha o formulario abiertos
      var a = document.activeElement;
      if(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;        // escribiendo ahora mismo
      var meds = document.querySelectorAll('audio,video');
      for(var i=0;i<meds.length;i++){ if(!meds[i].paused) return true; }       // reporte o vídeo sonando
      var campos = document.querySelectorAll('input,textarea');
      for(var j=0;j<campos.length;j++){ var el=campos[j];
        if(!el.offsetParent) continue;                                         // solo lo que se ve
        if(el.type==='checkbox' || el.type==='radio') continue;
        if(el.id && el.id.indexOf('f_')===0 && el.closest('#s-registro')){
          var base = (fotoReg && (el.id in fotoReg)) ? fotoReg[el.id] : '';
          if(String(el.value||'') !== base) return true;                       // registro: solo si difiere de la precarga
          continue;
        }
        if(String(el.value||'').trim() !== String(el.defaultValue||'').trim()) return true;  // cualquier otro campo tocado
      }
    }catch(e){}
    return false;
  }

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='hidden'){ oculta=Date.now(); return; }
    if(oculta!==null){
      var min=(Date.now()-oculta)/60000; oculta=null;
      if(sesionActiva() && min>=RECARGA_MIN && !aMedias()){ location.reload(); return; }
    }
    comprobarForzada();   // oportunidad extra al volver a primer plano, aunque no lleve 20 min fuera
  });

  // ---- Recarga forzada desde el panel (config.forzar_recarga) ----
  // Para lanzar algo nuevo (p.ej. una promo) a todos los clientes con la app
  // abierta ahora mismo, sin esperar a que caduque su sesión: en el SQL editor,
  //   update config set forzar_recarga = now() where id = 1;
  var comprobando = false;
  async function comprobarForzada(){
    if(comprobando) return; comprobando = true;
    try{
      if(!sesionActiva()) return;
      if(typeof sb === 'undefined') return;
      var r = await sb.from('config').select('forzar_recarga').eq('id',1).maybeSingle();
      var val = r && r.data && r.data.forzar_recarga;
      if(!val) return;
      var visto = null;
      try{ visto = localStorage.getItem(LS_KEY); }catch(e){}
      if(visto && new Date(visto) >= new Date(val)) return;   // ya vista, nada nuevo
      if(aMedias()) return;   // no le tiramos el formulario a medio escribir: se reintenta en el próximo check
      try{ localStorage.setItem(LS_KEY, val); }catch(e){}     // ANTES del reload, para no entrar en bucle
      location.reload();
    }catch(e){ /* sin ruido: si falla el check, se reintenta en el próximo ciclo */ }
    finally{ comprobando = false; }
  }
  setInterval(comprobarForzada, FORZAR_CHECK_MIN*60*1000);
})();
