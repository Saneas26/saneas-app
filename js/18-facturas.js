// SANEAS · js/18-facturas.js · Facturas de la clienta y toast
// ====== Facturas del cliente ======
// REPEP · Agencia Tributaria Canaria. Vigente desde el 01/07/2026.
// Las facturas de esa fecha en adelante llevan la mencion "Exencion franquicia fiscal".
// Las de enero a junio son de otro regimen y no la llevan.
const REPEP_DESDE = '2026-07-01';
function _repep(f){ return String(f||'').slice(0,10) >= REPEP_DESDE; }
// Escapa el HTML: los datos van dentro de un documento que se imprime.
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// La seguridad la pone la base: politica "facturas propias lee" (auth.uid() = cliente_id).
// Aunque este codigo pidiera todas, Postgres solo devuelve las suyas.
let EMISOR=null;
async function cargarMisFacturas(){
  const cont=document.getElementById('facturasLista'); if(!cont) return;
  if(!CLIENTE||!CLIENTE.id){ cont.innerHTML='<p class="note" style="margin:0">—</p>'; return; }
  try{
    const {data,error}=await sb.from('facturas')
      .select('numero,fecha_emision,total,concepto,anulada')
      .order('fecha_emision',{ascending:true}).order('numero',{ascending:true});
    if(error) throw error;
    MIS_FACTURAS=(data||[]).filter(f=>!f.anulada);
  }catch(e){ MIS_FACTURAS=[]; }
  pintarMisFacturas();
}
function pintarMisFacturas(){ const cont=document.getElementById('facturasLista'); if(!cont) return; const aviso='<p class="note" style="margin:10px 0 0;line-height:1.5">A partir del 1 de julio podrás obtener tu factura y descargarla en PDF con total seguridad.</p>'; const vis=(MIS_FACTURAS||[]).map(function(f,i){ return {f:f,i:i}; }).filter(function(o){ return _repep(o.f.fecha_emision); }); if(!vis.length){ cont.innerHTML='<p class="note" style="margin:0">Aún no tienes facturas.</p>'+aviso; return; } const eur=function(n){ return Number(n||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; }; const opts=vis.map(function(o,k){ return '<option value="'+o.i+'">Factura '+(k+1)+' · '+fechaCorta(o.f.fecha_emision)+' · '+eur(o.f.total)+'</option>'; }).join(''); cont.innerHTML='<select id="facturaSel" style="width:100%;border:2px solid var(--light);border-radius:12px;padding:12px;font-family:inherit;font-size:16px;font-weight:600;color:var(--dark);background:#fff">'+opts+'</select><button class="btn" id="facturaBtn" style="margin-top:12px">Descargar factura</button>'+aviso; const s=document.getElementById('facturaSel'); const b=document.getElementById('facturaBtn'); if(s&&b) b.onclick=function(){ descargarFactura(Number(s.value)); }; }
async function descargarFactura(i){
  const f=MIS_FACTURAS&&MIS_FACTURAS[i]; if(!f) return;
  if(!EMISOR){ try{ const {data}=await sb.from('config').select('*').limit(1).maybeSingle(); EMISOR=data||{}; }catch(e){ EMISOR={}; } }
  const e=EMISOR||{};
  const cli=CLIENTE||{};
  const nom=[cli.nombre,cli.apellido,cli.apellido2].filter(Boolean).join(' ');
  const dir=[cli.calle,cli.codigo_postal&&(cli.codigo_postal+' '+(cli.municipio||'')),cli.provincia,cli.pais].filter(Boolean).join(' · ');
  const eDir=[e.emisor_direccion,e.emisor_cp&&(e.emisor_cp+' '+(e.emisor_municipio||'')),e.emisor_provincia,e.emisor_pais].filter(Boolean).join(' · ');
  const eur=n=>Number(n||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
  const w=window.open('','_blank');
  if(!w){ toast('Permite las ventanas emergentes para descargar tu factura'); return; }
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>${f.numero} · Saneas</title>
<style>
 @page{size:A4;margin:18mm}
 *{box-sizing:border-box}
 body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1a2e35;margin:0;font-size:13px;line-height:1.5}
 .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3890a4;padding-bottom:14px;margin-bottom:22px}
 .marca{font-size:30px;font-weight:800;color:#3890a4;line-height:1}
 .num{text-align:right}
 .num .n{font-size:20px;font-weight:800;letter-spacing:.5px}
 .num .f{color:#6b8b93;font-size:12px;margin-top:2px}
 .cols{display:flex;gap:26px;margin-bottom:24px}
 .col{flex:1}
 .col h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b8b93;margin:0 0 6px;font-weight:700}
 .col b{font-size:14px;display:block;margin-bottom:2px}
 .col span{color:#3a5a64;font-size:12px}
 table{width:100%;border-collapse:collapse;margin-bottom:18px}
 th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#6b8b93;border-bottom:2px solid #e8f4f7;padding:8px 0}
 td{padding:12px 0;border-bottom:1px solid #e8f4f7}
 .r{text-align:right}
 .tot{display:flex;justify-content:flex-end;margin-bottom:22px}
 .tot div{min-width:210px}
 .tot .l{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#3a5a64}
 .tot .g{display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #3890a4;font-size:19px;font-weight:800}
 .pie{color:#6b8b93;font-size:11px;border-top:1px solid #e8f4f7;padding-top:12px;line-height:1.6}
 .leg{color:#b9c9ce;font-size:8px;margin-top:5px;letter-spacing:.2px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 @media print{.noprint{display:none}}
 .noprint{position:fixed;top:12px;right:12px;background:#3890a4;color:#fff;border:0;padding:11px 20px;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(0,0,0,.2)}
</style></head><body>
<button class="noprint" onclick="window.print()">⬇ Guardar como PDF</button>
<div class="top">
  <div><div class="marca">${esc(e.emisor_marca||'Saneas')}</div>
       <div style="color:#6b8b93;font-size:11px;margin-top:3px">${esc(e.emisor_desde||'')}</div></div>
  <div class="num"><div class="n">${esc(f.numero)}</div><div class="f">${fechaLarga(f.fecha_emision)}</div></div>
</div>
<div class="cols">
  <div class="col"><h4>Emisor</h4>
    <b>${esc(e.emisor_nombre||'')}</b><span>${esc(e.emisor_nif||'')}</span><br><span>${esc(eDir)}</span></div>
  <div class="col"><h4>Cliente</h4>
    <b>${esc(nom)}</b><span>${esc(cli.dni||'')}</span><br><span>${esc(dir)}</span></div>
</div>
<table>
  <thead><tr><th>Concepto</th><th class="r">Importe</th></tr></thead>
  <tbody><tr><td>${esc(f.concepto||'Asesoramiento nutricional Saneas')}</td><td class="r">${eur(f.total)}</td></tr></tbody>
</table>
<div class="tot"><div>
  <div class="g"><span>Total</span><span>${eur(f.total)}</span></div>
</div></div>
<div class="pie">Factura emitida por ${esc(e.emisor_marca||'Saneas')} · ${esc(e.emisor_nombre||'')}${_repep(f.fecha_emision) ? '<div class="leg">Exención franquicia fiscal</div>' : ''}</div>
</body></html>`);
  w.document.close();
}
function copiar(txt){ if(navigator.clipboard) navigator.clipboard.writeText(txt); toast('Copiado: '+txt); }
function toast(m){const t=document.createElement('div');t.textContent=m;
  t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a2e35;color:#fff;padding:10px 16px;border-radius:20px;font-size:14px;z-index:100;box-shadow:0 6px 20px rgba(0,0,0,.3)';
  document.body.appendChild(t);setTimeout(()=>t.remove(),1600);}
let PAGOS_TARGET='m-pagos';
let MIS_FACTURAS=null;
function renderPagos(target){
  if(target) PAGOS_TARGET=target;
  const c=document.getElementById(PAGOS_TARGET);
  if(!c) return;
  const est=CLIENTE?CLIENTE.suscripcion_estado:null, activa=est==='activa';
  // Estado visible para el cliente: lo que manda es la fecha de renovación (acceso real),
  // no el campo interno de Mollie (que queda "pendiente" en altas/renovaciones manuales).
  const _hoy0=new Date();_hoy0.setHours(0,0,0,0);
  const _fr=(CLIENTE&&CLIENTE.fecha_renovacion)?new Date(CLIENTE.fecha_renovacion+'T00:00:00'):null;
  const _vigente=_fr&&_fr>_hoy0;
  const estadoView = est==='cancelada' ? 'Cancelada'
    : _vigente ? 'Al corriente'
    : _fr ? 'Renovación vencida'
    : (est||'Sin suscripción');
  const estadoCol = _vigente ? 'var(--green)' : (_fr ? 'var(--red)' : 'var(--muted)');
  const amt=CUOTA.amount;
  // Cuota neta a pagar = cuota base del plan − descuento por Saneamigos
  const _desc=Number((CLIENTE&&CLIENTE.descuento_invitados)||0);
  const _base=Number((CLIENTE&&CLIENTE.plan_importe)||0);
  const _neta=Math.max(0,_base-_desc);
  const _nInv=Math.round(_desc/10);
  // Fila Saneamigos (solo planes Completo/Premium, que son los que se benefician)
  const saneamigoRow = esPlanPC() ? `
      <div class="orow"><span style="color:#d97757;font-weight:800">Saneamigos</span><b>${_nInv}</b></div>
      ${_nInv<6?`<p class="note">Cada Saneamigo de plan Completo o Premium te descuenta 10€. En plan Básico, cada dos suman 10€. El descuento nunca pasa de tu cuota. 🎉</p>`:`<p class="note">Cada Saneamigo de plan Completo o Premium te descuenta 10€. En plan Básico, cada dos suman 10€. El descuento nunca pasa de tu cuota. 🎉</p>`}` : '';
  const cuotaRow = _base>0 ? `
      <div class="orow"><span>Tu cuota${_desc>0?' este mes':''}</span><b>${_desc>0
        ? `<span style="text-decoration:line-through;color:var(--muted);font-weight:600">${_base}€</span> <span style="color:var(--teal)">${_neta}€</span>`
        : `${_base}€`}</b></div>
      ${_desc>0?`<p class="note">${_neta===0
        ? `🎉 ¡Este mes tu cuota es 0€ gracias a tus ${_nInv} Saneamigos!`
        : `Ya con el descuento de tus ${_nInv} Saneamigo${_nInv>1?'s':''} (−${_desc}€). Cuota base ${_base}€.`}</p>`:''}` : '';
  const bizum=(n,nombre,tel)=>`<div class="orow" style="cursor:pointer" onclick="copiar('${tel}')"><span>📱 Bizum ${n} · ${nombre}</span><b>${tel.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3')} 📋</b></div>`;
  setTimeout(()=>{ if(MIS_FACTURAS) pintarMisFacturas(); else cargarMisFacturas(); },0);
  c.innerHTML=`
    <div class="card" id="facturasCard"><h3>🧾 Descárgate tu factura</h3>
      <div id="facturasLista"><p class="note" style="margin:0">Cargando tus facturas…</p></div>
    </div>
    <div class="card"><h3>💳 Mi suscripción</h3>
      <div class="orow"><span>Plan</span><b>${(CLIENTE&&CLIENTE.plan)||'—'}</b></div>
      <div class="orow"><span>Estado</span><b style="color:${estadoCol}">${estadoView}</b></div>
      <div class="orow"><span>Próxima renovación</span><b>${(CLIENTE&&CLIENTE.fecha_renovacion)?fechaCorta(CLIENTE.fecha_renovacion):'—'}</b></div>
      ${saneamigoRow}
      ${cuotaRow}
      ${activa&&CLIENTE&&CLIENTE.mollie_subscription_id?`<button class="verobj" onclick="cancelarSuscripcion()">Cancelar suscripción</button><p class="note">Al cancelar, la domiciliación se detiene sola.</p>`:''}
    </div>
    <div class="dsec">Elige tu bono</div>
    ${tarjetaTarifas()}
    <p class="note" style="margin:8px 6px 2px">Toca tu bono y págalo abajo 👇</p>
    <div class="dsec">Pago manual · sin comisiones · ${CUOTA.label} (${amt}€)</div>
    <div class="card">
      ${bizum(1,'Oscar BJ','689806987')}
      ${bizum(2,'Raquel GR','676693237')}
      <div class="orow"><span>🔵 PayPal</span><b><a href="https://paypal.me/saneascom/${amt}" target="_blank" rel="noopener">Pagar ${amt}€ ›</a></b></div>
      <div class="orow" style="cursor:pointer" onclick="copiar('ES9214650100942061236296')"><span>🏦 ING</span><b style="font-size:14px">ES92 1465 0100 9420 6123 6296 📋</b></div>
      <div class="orow" style="cursor:pointer" onclick="copiar('ES2215830001199064086644')"><span>🏦 Revolut</span><b style="font-size:14px">ES22 1583 0001 1990 6408 6644 📋</b></div>
      <div class="orow"><span>💳 Tarjeta (SumUp)</span><b><a href="https://pay.sumup.com/b2c/XFTLTE3ENC" target="_blank" rel="noopener">Pagar ›</a></b></div>
      <p class="note">Tras pagar en manual, Oscar confirma tu renovación.</p>
    </div>
    <div class="dsec">Pago automático · renovación sola</div>
    <div class="card">
      <button class="btn" onclick="contratarPlan('${CUOTA.id}')">Domiciliación o tarjeta · ${amt}€${CUOTA.sub}</button>
      <div class="hitomsg" style="margin-top:10px">✅ Cancela cuando quieras. Nosotros te damos de alta y de baja, sin que tengas que hacerlo tú con tu banco. Hoy esto ya es automático, sin trampa ni letra pequeña.</div>
    </div>`;
}
async function contratarPlan(planId){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){alert('Inicia sesión primero.');return;}
  try{
    const r=await fetch(SUPABASE_URL+'/functions/v1/crear-suscripcion',{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({plan:planId})});
    const d=await r.json();
    if(d.checkoutUrl){ window.location.href=d.checkoutUrl; }
    else if(d.gratis){ alert('🎉 ¡Tu cuota es 0€ este periodo gracias a tus Saneamigos! Tu renovación se ha ampliado.'); await iniciarSesion(); }
    else alert('No se pudo iniciar el pago: '+(d.error||'inténtalo de nuevo'));
  }catch(e){ alert('Error de conexión: '+e.message); }
}
async function cancelarSuscripcion(){
  if(!confirm('¿Seguro que quieres cancelar tu suscripción? Dejarás de renovar automáticamente.'))return;
  const {data:{session}}=await sb.auth.getSession();
  try{
    const r=await fetch(SUPABASE_URL+'/functions/v1/cancelar-suscripcion',{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token}});
    const d=await r.json();
    if(d.ok){ CLIENTE.suscripcion_estado='cancelada'; CLIENTE.mollie_subscription_id=null; alert('Suscripción cancelada. No se harán más cobros.'); renderPagos(); }
    else alert('Error: '+(d.error||''));
  }catch(e){ alert('Error de conexión: '+e.message); }
}

