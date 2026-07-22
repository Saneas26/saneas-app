// SANEAS · js/14-nav.js · Navegación entre pestañas
// ====== NAV ======
function go(id,el){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  document.getElementById('s-'+id).classList.remove('hidden');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));el.classList.add('active');
  if(id==='registro'){ajustarPerimetros();cargarEstadoRegistro();}
  if(id==='dieta')renderDieta();
  if(id==='gym')renderGym();
  document.getElementById('s-'+id).scrollTop=0;
}

