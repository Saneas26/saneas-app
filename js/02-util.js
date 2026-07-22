// SANEAS · js/02-util.js · Estado global, fechas/horas (Canarias-Madrid) y formato
// ====== STATE ======
let CLIENTE=null, ULTIMO=null, PRIMERO=null, DIETA=null, TOMAS_HOY=[], REG_NOMBRE=null, PENDING=null;
const DIA_MAP={1:'1_Dia1',2:'2_Dia2',3:'3_Dia3',4:'4_Dia4',5:'5_Dia5',6:'6_Dia6',0:'7_Domingo'};
const DIA_NOMBRE={0:'domingo',1:'lunes',2:'martes',3:'miércoles',4:'jueves',5:'viernes',6:'sábado'};
const TOMA_INFO={
  EnPie:['🌅','En pie'],Desayuno:['🍳','Desayuno'],MediaManana:['☕','Media mañana'],
  Almuerzo:['🍽️','Almuerzo'],Merienda:['🍎','Merienda'],Cena:['🌙','Cena'],AntesDormir:['🌛','Antes de dormir']};
const num = v => (v===''||v==null)?null:parseFloat(String(v).replace(',','.'));
const fmt = v => (v==null||v==='')?'—':v;
function fechaCorta(d){ if(!d) return '—'; const x=new Date(d+'T00:00:00'); return x.toLocaleDateString('es-ES',{day:'numeric',month:'short'}); }
function fechaLarga(d){ if(!d) return '—'; const x=new Date(d+'T00:00:00'); return x.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}); }
// Próxima consulta = próxima fecha (hoy o futura) que cae en el día de consulta del cliente (modelo semanal)
const DIA_NUM={'domingo':0,'lunes':1,'martes':2,'miércoles':3,'miercoles':3,'jueves':4,'viernes':5,'sábado':6,'sabado':6};
function fechaProximaConsulta(){
  const t=new Date(); t.setHours(0,0,0,0);
  // Si hay una cita futura ya fijada (p.ej. tras "consulta pasada"), esa manda
  const stored=(CLIENTE&&CLIENTE.fecha_proxima_consulta)||null;
  if(stored){ const sd=new Date(String(stored).slice(0,10)+'T00:00:00'); if(!isNaN(sd)&&sd>t) return String(stored).slice(0,10); }
  const dc=((CLIENTE&&CLIENTE.dia_consulta)||'').toLowerCase().trim();
  if(dc in DIA_NUM){
    const add=(DIA_NUM[dc]-t.getDay()+7)%7;
    const d=new Date(t); d.setDate(t.getDate()+add);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  return stored;
}
// ---- Hora límite de consulta: 9:00 hora canaria (10:00 Madrid) ----
const DIA_EN_ES={monday:'lunes',tuesday:'martes',wednesday:'miercoles',thursday:'jueves',friday:'viernes',saturday:'sabado',sunday:'domingo'};
function canariasMin(){ try{ const s=new Intl.DateTimeFormat('en-GB',{timeZone:'Atlantic/Canary',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()); const p=s.split(':'); return (+p[0])*60+(+p[1]); }catch(e){ const d=new Date(); return d.getHours()*60+d.getMinutes(); } }
function deadlinePasado(){ return canariasMin() > 540; }   // 9:00 = 540 min
function esDiaConsultaHoy(){ try{ const wd=new Intl.DateTimeFormat('en-US',{timeZone:'Atlantic/Canary',weekday:'long'}).format(new Date()).toLowerCase(); return (DIA_EN_ES[wd]||'')===((CLIENTE&&CLIENTE.dia_consulta)||'').toLowerCase().trim(); }catch(e){ return false; } }
function consultaProcesada(){ const t=new Date(); t.setHours(0,0,0,0); const s=(CLIENTE&&CLIENTE.fecha_proxima_consulta)||null; if(!s) return false; const sd=new Date(String(s).slice(0,10)+'T00:00:00'); return !isNaN(sd)&&sd>t; }
function consultaHoyPendiente(){ return esDiaConsultaHoy() && !consultaProcesada(); }
// ¿Envió sus datos a tiempo para la consulta de hoy? (registro del ciclo actual y NO fuera de plazo)
function enviadoATiempo(){
  if(!ULTIMO || ULTIMO.enviado_tarde || !ULTIMO.fecha) return false;
  const f=new Date(String(ULTIMO.fecha).slice(0,10)+'T00:00:00'); const t=new Date(); t.setHours(0,0,0,0);
  const dd=Math.round((t-f)/86400000); return dd>=0 && dd<=6;
}
// Muestra los alimentos (separados por | o comas) como listado con saltos de fila
function listar(t){ if(!t) return '';
  const items=String(t).split(/\s*\|\s*|\n+/).map(x=>x.trim()).filter(Boolean);
  return items.length>1 ? items.map(x=>'· '+x).join('<br>') : (items[0]||''); }
// Formatea ingredientes/preparación: saltos por barra |, salto de línea, guión o número (1- 2. 3))
function formatoLista(t){
  if(!t) return '';
  let s=' '+String(t).replace(/\r/g,'').trim()+' ';
  s=s.replace(/\|/g,'\n');                     // barras
  s=s.replace(/(\d{1,2})[-.)]\s/g,'\n$1- ');   // "1- ", "2.", "3)" → nueva línea
  s=s.replace(/\s-\s/g,'\n- ');                // " - " → viñeta
  const items=s.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  return items.join('<br>');
}

