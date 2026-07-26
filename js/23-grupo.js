// SANEAS · js/23-grupo.js · El grupo Saneas dentro de la app
// Dos piezas: el desplegable al tocar el logo «Saneas» de la barra, y el
// pie del grupo en miniatura al final del inicio (debajo del reporte).
// Mismas fichas que el pie de saneas.es; los logos viven en img/.
var GRUPO_APPS=[
  {n:'Programa de Asesorías', s:'Monta tu consulta Saneas', url:'https://saneas.es/asesorias', ico:1},
  {n:'APP Pordondevoy', s:'La nueva app del grupo', url:'https://pordondevoy-saneas.vercel.app', img:'img/app-pordondevoy.png'},
  {n:'Activala', s:'El alquiler activo del sur', url:'https://activala.es', img:'img/app-activala.png'},
  {n:'APP laOra', s:'Muy pronto', img:'img/app-laora.png', soon:true},
];
function _gmCard(a){
  var ico=a.img
    ? '<img src="'+a.img+'" alt="" loading="lazy">'
    : '<span class="gmIco"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>';
  var tx='<span class="tx"><b>'+a.n+'</b><small'+(a.soon?' class="soon"':'')+'>'+a.s+'</small></span>';
  return a.url
    ? '<a class="gmCard" href="'+a.url+'" target="_blank" rel="noopener">'+ico+tx+'</a>'
    : '<span class="gmCard off">'+ico+tx+'</span>';
}
function _gmLista(){ return GRUPO_APPS.map(_gmCard).join(''); }
// Norma corporativa: «Saneas» siempre con S mayúscula y el resto en
// minúsculas, Quicksand Bold, en teal o blanco (naranja solo para detalles).
function _gmTitulo(){ return '<div class="gmTit">Grupo <span class="gmS">Saneas</span></div>'; }

// ---- Desplegable del logo ----
function _gmMenu(){
  var m=document.getElementById('grupoMenu');
  if(m) return m;
  var b=document.createElement('div'); b.id='grupoBack'; b.className='gm-back'; b.onclick=cerrarGrupo;
  m=document.createElement('div'); m.id='grupoMenu';
  m.innerHTML=_gmTitulo()+_gmLista();
  document.body.appendChild(b); document.body.appendChild(m);
  return m;
}
function toggleGrupo(){
  var m=_gmMenu(), abre=!m.classList.contains('open');
  m.classList.toggle('open',abre);
  document.getElementById('grupoBack').classList.toggle('open',abre);
}
function cerrarGrupo(){
  var m=document.getElementById('grupoMenu'); if(m) m.classList.remove('open');
  var b=document.getElementById('grupoBack'); if(b) b.classList.remove('open');
}

// ---- Pie del grupo al final del inicio (debajo del reporte de voz) ----
function pintarPieGrupo(){
  var cont=document.getElementById('s-inicio'); if(!cont) return;
  if(cont.querySelector('.spinner')) return;                 // aún cargando
  var pie=document.getElementById('grupoPie');
  if(!pie){
    pie=document.createElement('div'); pie.id='grupoPie';
    pie.innerHTML=_gmTitulo()+_gmLista();
    cont.appendChild(pie);
  } else if(cont.lastElementChild!==pie){ cont.appendChild(pie); }
}
setInterval(pintarPieGrupo, 1000);
