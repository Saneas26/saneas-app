// SANEAS · js/22-recarga.js · Recarga automática al volver de un descanso largo
// El iPhone congela la PWA en segundo plano: al volver días después se ve la
// versión vieja aunque Vercel sirva todo con no-store (guardar-es-desplegar).
// Al volver tras ≥10 minutos en segundo plano recargamos para traer la última
// versión — y NUNCA si hay algo a medio escribir o sonando.
(function(){
  var RECARGA_MIN = 10;   // minutos seguidos en segundo plano para recargar
  var oculta = null;      // cuándo se fue la app al fondo

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
    if(oculta===null) return;
    var min=(Date.now()-oculta)/60000; oculta=null;
    if(min>=RECARGA_MIN && !aMedias()) location.reload();
  });
})();
