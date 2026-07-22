// SANEAS · js/06-objetivos.js · Objetivos (peso/grasa/IMC), validación, historial y calorías
// ====== OBJETIVOS (peso, grasa, IMC) ======
const r1 = x => (x==null||isNaN(x))?'—':(Math.round(x*10)/10).toString().replace('.',',');
// ====== DATOS BASICOS: validacion compartida ======
// La altura va en CENTIMETROS (148-185 en la base real). Un "1,67" reventaria el IMC.
function alturaValida(v){ const n=num(v); if(n===null||isNaN(n)) return null; if(n<3) return 'metros'; if(n<120||n>220) return 'rango'; return n; }
// Devuelve true (mujer), false (hombre) o null (no lo sabemos: '', 'Otro', null).
// Antes esto devolvia false por defecto y calculaba a las mujeres como hombres.
function esMujerDe(g){ const t=String(g||'').trim().toLowerCase();
  if(t.startsWith('m')) return true; if(t.startsWith('h')) return false; return null; }
function nacimientoValido(v){ const t=String(v||'').trim(); if(!t) return null;
  const d=new Date(t+'T00:00:00'); if(isNaN(d)) return 'invalida';
  const hoy=new Date(); if(d>=hoy) return 'futuro';
  const edad=(hoy-d)/31557600000; if(edad>100) return 'invalida'; return t; }
function listaNatural(xs){ return xs.length===1?xs[0]:xs.slice(0,-1).join(', ')+' y '+xs[xs.length-1]; }
// Revisa altura/sexo/nacimiento de un formulario. Devuelve un mensaje o null si todo va bien.
function revisarDatosBasicos(pref){
  const gv=id=>{const e=document.getElementById(pref+id); return e?e.value:'';};
  const faltan=[];
  const a=alturaValida(gv('altura'));
  if(a==='metros') return 'La altura va en centímetros (por ejemplo 167, no 1,67).';
  if(a==='rango')  return 'Revisa la altura: debe estar entre 120 y 220 cm.';
  if(a===null) faltan.push('la altura');
  if(esMujerDe(gv('genero'))===null) faltan.push('el sexo');
  const n=nacimientoValido(gv('nacimiento'));
  if(n==='futuro')   return 'La fecha de nacimiento no puede estar en el futuro.';
  if(n==='invalida') return 'Revisa la fecha de nacimiento.';
  if(n===null) faltan.push('la fecha de nacimiento');
  if(!faltan.length) return null;
  return faltan.length===1 ? 'Aún falta '+faltan[0]+' por rellenar.'
                           : 'Aún faltan por rellenar: '+listaNatural(faltan)+'.';
}

// La grasa la calcula la BASE (saneas_rfm + trigger), no la app. Aqui solo se lee.
// Estuvo escrita aqui y en panel.html, divergieron, y ademas la formula restaba
// kilos a un porcentaje. Si falta, falta: no se inventa un numero.
function grasaReal(rec){ return (rec && rec.grasa_rfm != null) ? Number(rec.grasa_rfm) : null; }
function calcObjetivos(){
  const alt=parseFloat(CLIENTE.altura), esMujer=esMujerDe(CLIENTE.genero);
  if(!alt||esMujer===null) return null;
  const a2=alt*alt;
  const POb=(29.9*a2)/10000;                     // límite obesidad (IMC 29,9)
  const PO1=(24.9*a2)/10000;                     // límite sobrepeso (IMC 24,9)
  const PO2=alt-100-((alt-150)/(esMujer?2.5:4)); // peso mínimo saludable (Lorentz)
  const promedio=(PO1+PO2)/2;                    // objetivo total
  const grasaObj=esMujer?24:19;
  const masaMuscObj=promedio*(1-grasaObj/100)*0.95;   // peso objetivo − grasa ideal − 5% (órganos/piel/hueso)
  return {alt,esMujer,POb,PO1,PO2,promedio,grasaObj,imcObj:22,
    visceralIdeal:7,visceralMax:8.9,aguaMin:52,muscEsqObj:esMujer?48:52,masaMuscObj};
}
function hitoPeso(peso,o){
  if(peso==null) return {meta:o.promedio,texto:''};
  if(peso>o.POb) return {meta:o.POb,texto:`Te faltan ${r1(peso-o.POb)} kg para salir de la obesidad 💪`};
  if(peso>o.PO1) return {meta:o.PO1,texto:`Te faltan ${r1(peso-o.PO1)} kg para dejar el sobrepeso 💪`};
  if(peso<o.PO2) return {meta:o.PO2,texto:`Te faltan ${r1(o.PO2-peso)} kg para tu peso mínimo saludable`};
  if(peso>o.promedio) return {meta:o.promedio,texto:`Te faltan ${r1(peso-o.promedio)} kg para tu objetivo total 🎯`};
  return {meta:o.promedio,texto:'¡Enhorabuena! Estás en tu peso objetivo 🎉'};
}
function verObjetivos(){
  const o=calcObjetivos();
  if(!o){abrirDetalle('Tus objetivos','<div class="empty">Necesitamos tu altura para calcular tus objetivos.</div>');return;}
  const peso=ULTIMO?ULTIMO.peso:(CLIENTE.peso_inicial||null);
  const h=hitoPeso(peso,o);
  let estado='—';
  if(peso!=null){ estado = peso>o.POb?'Obesidad' : peso>o.PO1?'Sobrepeso' : peso<o.PO2?'Por debajo del mínimo' : 'Peso saludable'; }
  abrirDetalle('Tus objetivos',`
    <div class="card" style="text-align:center;box-shadow:none;background:var(--light)">
      <div style="font-size:14px;color:var(--muted);font-weight:700;letter-spacing:.5px">TU PESO HOY</div>
      <div style="font-size:34px;font-weight:800;color:var(--teal);line-height:1.1">${peso!=null?r1(peso)+' kg':'—'}</div>
      <div style="font-size:14px;font-weight:700">${estado}</div>
    </div>
    ${h.texto?`<div class="hitomsg" style="margin-bottom:14px">${h.texto}</div>`:''}
    <div class="dsec">Referencias de peso (según tu altura ${o.alt} cm)</div>
    <div class="orow"><span>Límite de obesidad (IMC 29,9)</span><b>${r1(o.POb)} kg</b></div>
    <div class="orow"><span>Límite de sobrepeso (IMC 24,9)</span><b>${r1(o.PO1)} kg</b></div>
    <div class="orow"><span>🎯 Objetivo total (peso ideal)</span><b style="color:var(--teal)">${r1(o.promedio)} kg</b></div>
    <div class="orow"><span>Peso mínimo saludable</span><b>${r1(o.PO2)} kg</b></div>
    <div class="dsec">Composición corporal</div>
    ${bloquesComposicion(o)}
    ${(()=>{ const c=canonBelleza(); if(!c) return '';
      const ri=v=>Math.round(v);
      const medC=(ULTIMO&&ULTIMO.per_cintura!=null)?Number(ULTIMO.per_cintura):null;
      const medO=(ULTIMO&&(c.hombre?ULTIMO.per_hombro:ULTIMO.per_cadera)!=null)?Number(c.hombre?ULTIMO.per_hombro:ULTIMO.per_cadera):null;
      return `<div class="dsec">Canon de belleza (según tu altura y edad)</div>
      <div class="orow" style="border-bottom:none;padding-bottom:2px"><span>🎯 Cintura ideal</span><b style="color:var(--teal)">${ri(c.cinturaIdeal)} cm</b></div>
      <div class="orow"><span style="color:var(--muted)">Actualmente es de</span><b>${medC!=null?r1(medC)+' cm':'—'}</b></div>
      <div class="orow" style="border-bottom:none;padding-bottom:2px"><span>🎯 ${c.objLabel} ideal</span><b style="color:var(--teal)">${ri(c.objetivoIdeal)} cm</b></div>
      <div class="orow"><span style="color:var(--muted)">Actualmente es de</span><b>${medO!=null?r1(medO)+' cm':'—'}</b></div>`;
    })()}
    <p style="font-size:14px;color:var(--muted);margin-top:14px;line-height:1.5">Tu objetivo total es el promedio entre el límite de sobrepeso y tu peso mínimo saludable. El camino: primero salir de la obesidad, luego del sobrepeso y por último alcanzar tu peso ideal.</p>`);
}
function objBloque(nombre,actualTxt,objTxt,msg,ok){
  return `<div style="padding:10px 0;border-bottom:1px dashed #dbe6e9">
    <div style="display:flex;justify-content:space-between;font-size:14px;gap:8px"><b>${nombre}</b><span style="white-space:nowrap">${actualTxt} → <b style="color:var(--teal)">${objTxt}</b></span></div>
    <div style="font-size:14px;color:${ok?'var(--green)':'var(--muted)'};margin-top:3px">${msg}</div></div>`;
}
function bloquesComposicion(o){
  const u=ULTIMO||{};
  const alt=o.alt; const peso=u.peso;
  const imcHoy=(peso&&alt)?+(peso/Math.pow(alt/100,2)).toFixed(1):null;
  let out='';
  // Grasa corporal
  { const g=grasaReal(u); let m,ok=false;
    if(g==null)m='Registra tu grasa corporal';
    else if(g<=o.grasaObj){m='✅ Objetivo cumplido';ok=true;}
    else m=`Te sobra ${r1(g-o.grasaObj)}% de grasa`;
    out+=objBloque('Grasa corporal', g!=null?r1(g)+'%':'—', o.grasaObj+'%', m, ok); }
  // IMC
  { let m,ok=false;
    if(imcHoy==null)m='Registra tu peso';
    else if(imcHoy<=o.imcObj){m='✅ En tu IMC ideal';ok=true;}
    else m=`Te falta bajar a un IMC de ${o.imcObj}`;
    out+=objBloque('IMC', imcHoy!=null?r1(imcHoy):'—', String(o.imcObj), m, ok); }
  // Grasa visceral
  { const v=u.grasa_visceral; let m,ok=false;
    if(v==null)m='Registra tu grasa visceral';
    else if(v<2.5)m='⚠️ Demasiado baja. Sigue las pautas de Oscar.';
    else if(v<=7){m='✅ Objetivo cumplido';ok=true;}
    else if(v<=8.9)m=`Te sobran ${r1(v-7)} para el ideal (7)`;
    else m='Hay que seguir trabajando en limpiar tus órganos';
    out+=objBloque('Grasa visceral', v!=null?r1(v):'—', '7', m, ok); }
  // Hidratación
  { const a=u.agua; let m,ok=false;
    if(a==null)m='Registra tu hidratación';
    else if(a>=o.aguaMin){m='✅ Objetivo cumplido';ok=true;}
    else m=`Te falta ${r1(o.aguaMin-a)}% · mejora hidratación y baja grasa`;
    out+=objBloque('Hidratación', a!=null?r1(a)+'%':'—', o.aguaMin+'%', m, ok); }
  // Músculo esquelético
  { const me=u.musculo_esqueletico; let m,ok=false;
    if(me==null)m='Registra tu músculo esquelético';
    else if(me>=o.muscEsqObj){m='✅ Objetivo cumplido';ok=true;}
    else m=`Te falta ${r1(o.muscEsqObj-me)}% para tu objetivo`;
    out+=objBloque('Músculo esquelético', me!=null?r1(me)+'%':'—', o.muscEsqObj+'%', m, ok); }
  // Masa muscular
  { const mm=u.masa_muscular; let m,ok=false;
    if(mm==null)m='Registra tu masa muscular';
    else if(mm>=o.masaMuscObj){m='✅ Objetivo cumplido';ok=true;}
    else m=`Te faltan ${r1(o.masaMuscObj-mm)} kg · sigue mejorando tu composición`;
    out+=objBloque('Masa muscular', mm!=null?r1(mm)+' kg':'—', r1(o.masaMuscObj)+' kg', m, ok); }
  return out;
}

// ====== HISTORIAL DE EVOLUCIÓN ======
function edadEn(fechaStr){
  if(!CLIENTE.fecha_nacimiento||!fechaStr) return null;
  const n=new Date(CLIENTE.fecha_nacimiento+'T00:00:00'), f=new Date(fechaStr+'T00:00:00');
  let e=f.getFullYear()-n.getFullYear(); const mm=f.getMonth()-n.getMonth();
  if(mm<0||(mm===0&&f.getDate()<n.getDate())) e--;
  return (e>0&&e<120)?e:null;
}
function edadMetabolica(rec){
  const edad=edadEn(rec.fecha), g=grasaReal(rec);
  if(edad==null||g==null) return rec.edad_metabolica!=null?Math.round(rec.edad_metabolica):null;
  const ideal=String(CLIENTE.genero||'').toLowerCase().startsWith('m')?24:19;   // grasa ideal mujer/hombre
  return Math.round(edad*(1+(g-ideal)/100));
}

// ====== CALORÍAS: TMB (Mifflin-St Jeor) · Gasto diario (GET) · Objetivo por IMC ======
const ACT_FACT={Sedentario:1.2,Ligero:1.375,Moderado:1.55,Regular:1.725,Intenso:1.9};
function calcCalorias(){
  const alt=Number(CLIENTE.altura)||null;
  const peso=(ULTIMO&&ULTIMO.peso!=null)?Number(ULTIMO.peso):(CLIENTE.peso_inicial!=null?Number(CLIENTE.peso_inicial):null);
  const ed=edadEn(_hoyCanarias());
  if(!alt||!peso||ed==null) return null;
  const esMujer=String(CLIENTE.genero||'').toLowerCase().startsWith('m');
  const tmb=10*peso+6.25*alt-5*ed+(esMujer?-161:5);
  const estilo=CLIENTE.estilo_vida||'Sedentario';
  const get=tmb*(ACT_FACT[estilo]||1.2);
  const imc=peso/Math.pow(alt/100,2);
  let objL,objF; if(imc<21){objL='Ganar peso';objF=1.15;} else if(imc<=23){objL='Mantener';objF=1;} else {objL='Adelgazar';objF=0.8;}
  return {tmb:Math.round(tmb),get:Math.round(get),objetivo:Math.round(get*objF),objLabel:objL,estilo};
}
// Comidas que cuentan como calóricas (En pie y Antes de dormir no cuentan)
const COMIDAS_CAL=['Desayuno','MediaManana','Almuerzo','Merienda','Cena'];
// Reparto de kcal (%) según cuántas comidas calóricas tenga el día
function repartoComidas(presentes){
  const has=k=>presentes.includes(k), n=presentes.length; let map={};
  if(has('Desayuno')&&n===5){ map={Desayuno:15,MediaManana:15,Almuerzo:30,Merienda:10,Cena:30}; }
  else if(!has('Desayuno')&&n===4){ map={MediaManana:20,Almuerzo:30,Merienda:20,Cena:30}; }
  else { let base=0; presentes.forEach(k=>{ if(k==='Almuerzo'||k==='Cena'){map[k]=30;base+=30;} });
    const resto=presentes.filter(k=>k!=='Almuerzo'&&k!=='Cena'); const each=resto.length?(100-base)/resto.length:0;
    resto.forEach(k=>map[k]=each); }
  return map;
}
// Gramos de macros desde kcal (45% proteína / 35% hidratos / 20% grasa)
function macrosDe(kcal){ return {prot:Math.round(kcal*0.45/4), hc:Math.round(kcal*0.35/4), grasa:Math.round(kcal*0.20/9)}; }
// Comidas calóricas presentes (con texto) en una lista de tomas
function comidasCalDe(tomas){ return tomas.filter(t=>COMIDAS_CAL.includes(t.toma)&&String(t.texto||'').trim()).map(t=>t.toma); }
// Línea de kcal + macros para una toma concreta
function lineaKcal(toma,pctMap,objetivo){
  if(!objetivo||!(toma in pctMap)) return '';
  const kcal=Math.round(objetivo*pctMap[toma]/100), m=macrosDe(kcal);
  const nw='white-space:nowrap';
  return `<div style="margin-top:6px;font-size:14px;font-weight:700;color:var(--teal);background:var(--light);padding:5px 10px;border-radius:10px;display:inline-block"><span style="${nw}">🔥 ${kcal} kcal</span> · <span style="${nw}">P ${m.prot}g</span> · <span style="${nw}">HC ${m.hc}g</span> · <span style="${nw}">G ${m.grasa}g</span></div>`;
}

async function verHistorial(){
  const {data}=await sb.from('registros').select('*').eq('cliente_id',CLIENTE.id).order('semana',{ascending:false,nullsFirst:false}).order('fecha',{ascending:false});
  if(!data||!data.length){abrirDetalle('Tu evolución','<div class="empty">Aún no tienes registros.</div>');return;}
  const m=(l,v,u)=> v==null?'' : `<div class="hm"><span>${l}</span><b>${r1(v)}${u||''}</b></div>`;
  const cards=data.map(x=>{
    const sinDatos = x.peso==null;
    if(sinDatos){
      return `<div class="card" style="border-left:4px solid var(--orange);background:#fff7f0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <b style="font-size:16px">Semana ${x.semana!=null?x.semana:'—'}</b>
          <small style="color:var(--muted)">${fechaCorta(x.fecha)}</small></div>
        <div style="color:var(--orange);font-weight:700">Sin consulta esta semana</div>
        <div style="font-size:14px;color:var(--muted);margin-top:2px">No llegaron tus datos a tiempo.</div></div>`;
    }
    const em=edadMetabolica(x);
    return `<div class="card"${x.sin_consulta?' style="border-left:4px solid var(--orange)"':''}>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <b style="font-size:16px">Semana ${x.semana!=null?x.semana:'—'}</b>
        <small style="color:var(--muted)">${fechaCorta(x.fecha)}</small></div>
      ${x.sin_consulta?'<div style="font-size:13px;color:var(--orange);font-weight:700;margin:-2px 0 6px">Esta semana no hubo consulta, pero tus datos están guardados</div>':''}
      <div class="hgrid">
        ${m('Peso',x.peso,' kg')}
        ${m('Grasa corporal',x.grasa_rfm,'%')}
        ${m('Grasa subcutánea',x.grasa_subcutanea,'%')}
        ${m('Grasa visceral',x.grasa_visceral,'')}
        ${m('Agua',x.agua,'%')}
        ${m('Músculo esq.',x.musculo_esqueletico,'%')}
        ${m('Masa muscular',x.masa_muscular,' kg')}
        ${m('Masa ósea',x.masa_esqueletica,' kg')}
        ${m('Proteína',x.proteina,'%')}
        <div class="hm"><span>Edad metabólica</span><b>${em!=null?em+' años':'—'}</b></div>
      </div></div>`;}).join('');
  const ult10=data.filter(x=>x.peso!=null).slice(0,10).reverse();   // lo que cuenta es que haya datos, no si hubo consulta (misma regla que el panel)
  const chart = ult10.length>=2
    ? `<div class="dsec">Últimas ${ult10.length} semanas</div>
       <div style="height:230px;background:#fff;border-radius:16px;padding:10px 8px;box-shadow:var(--shadow);margin-bottom:16px"><canvas id="evoChart"></canvas></div>`
    : '';
  abrirDetalle('Tu evolución', chart + cards);
  if(ult10.length>=2) setTimeout(()=>dibujarGrafico(ult10),40);
}
let _evoChart=null;
function dibujarGrafico(regs){
  const ctx=document.getElementById('evoChart'); if(!ctx||!window.Chart) return;
  if(_evoChart) _evoChart.destroy();
  const labels=regs.map(r=>r.semana!=null?('S'+r.semana):fechaCorta(r.fecha));
  const ds=(l,key,color)=>({label:l,data:regs.map(r=>r[key]??null),borderColor:color,backgroundColor:color,tension:.3,pointRadius:3,borderWidth:2,spanGaps:true});
  _evoChart=new Chart(ctx,{type:'line',
    data:{labels,datasets:[ds('Peso (kg)','peso','#3890a4'),ds('Grasa %','grasa_rfm','#d05a4a'),ds('Masa musc. (kg)','masa_muscular','#2f9e5f')]},
    options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      plugins:{legend:{labels:{font:{family:'Quicksand',size:11},boxWidth:12,padding:10}}},
      scales:{x:{ticks:{font:{family:'Quicksand',size:10}},grid:{display:false}},
              y:{ticks:{font:{family:'Quicksand',size:10}},grid:{color:'#eef3f4'}}}}});
}

