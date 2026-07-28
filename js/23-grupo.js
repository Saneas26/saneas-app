// SANEAS · js/23-grupo.js · El grupo Saneas dentro de la app
// El contenido común vive en js/24-grupo-saneas.js (igual en todo el
// grupo). Aquí solo se dice quiénes somos, dónde están los logos y en
// qué dos sitios aparece: el logo de la barra y el pie del inicio.
GrupoSaneas.init({
  actual: 'saneas',
  logos : 'img/',
  extras: [{ id:'asesorias', nombre:'Asesora Saneas',
             url:'https://saneas.es/asesorias',
             texto:'Si te gusta el mundo de la nutrición, ahora tú también puedes. Más fácil que nunca.' }]
});

// El logo «Saneas ▾» de la barra abre el desplegable
function toggleGrupo(){ GrupoSaneas.abrirMenu(); }
function cerrarGrupo(){ GrupoSaneas.cerrar(); }

// Y el pie del inicio, debajo del reporte de voz
function pintarPieGrupo(){
  var cont=document.getElementById('s-inicio'); if(!cont) return;
  if(cont.querySelector('.spinner')) return;                 // aún cargando
  var pie=document.getElementById('grupoPie');
  if(!pie){
    pie=document.createElement('div'); pie.id='grupoPie';
    pie.innerHTML='<div class="gmTit">Grupo <span class="gmS">Saneas</span></div>'+GrupoSaneas.gridHTML();
    cont.appendChild(pie);
  } else if(cont.lastElementChild!==pie){ cont.appendChild(pie); }
}
setInterval(pintarPieGrupo, 1000);
