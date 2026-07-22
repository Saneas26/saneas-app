// SANEAS · js/08-social.js · Saneamigos (invitar) y compartir evolución
// ====== SANEAMIGOS (invitar) ======
function abrirInvitar(){
  if(!esPlanPC()){ abrirDetalle('Saneamigos','<div class="empty">El programa Saneamigos es solo para el plan Completo o Premium 🙂</div>'); return; }
  const d=Number(CLIENTE.descuento_invitados||0); const n=Math.round(d/10);
  abrirDetalle('Saneamigos', `
    <p style="color:var(--muted);font-size:14px;margin:0 0 12px">Por cada amigo o amiga que ya sea cliente <b>Completo o Premium</b> y añadas aquí, te descontamos <b>10€</b> de tu cuota mensual. Hasta 6 (¡el Completo sale gratis!).</p>
    <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:13px 15px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:800;color:#9a3412;margin-bottom:6px">Antes de añadir a alguien, ten en cuenta:</div>
      <ul style="margin:0;padding-left:18px;font-size:13.5px;color:#7c2d12;line-height:1.55">
        <li>Solo puedes añadir a personas que <b>ya están pasando consulta con Óscar y pagando su cuota</b>.</li>
        <li>No añadas a alguien con quien solo has hablado y todavía no es cliente.</li>
        <li>No puedes añadirte a ti mismo/a.</li>
      </ul>
    </div>
    <div id="invBox" style="background:var(--light);border-radius:16px;padding:16px;text-align:center;margin-bottom:14px">
      <div style="font-size:14px;color:var(--muted)">Tus invitados</div>
      <div style="font-size:32px;font-weight:800;color:var(--teal)">${n}/6</div>
      <div style="font-size:16px;font-weight:700">${d}€ de descuento</div>
    </div>
    <div class="field"><label>Nombre del invitado</label><input id="inv_nombre" placeholder="Nombre"></div>
    <div class="field"><label>Primer apellido</label><input id="inv_apellido" placeholder="Primer apellido"></div>
    <button class="btn" id="btnInvitar" onclick="enviarInvitar()">Añadir invitado</button>
    <div id="invMsg" style="margin-top:10px;font-size:14px;min-height:18px"></div>`);
}
async function enviarInvitar(){
  const nombre=(document.getElementById('inv_nombre').value||'').trim();
  const apellido=(document.getElementById('inv_apellido').value||'').trim();
  const msg=document.getElementById('invMsg');
  if(!nombre||!apellido){ msg.style.color='var(--bad)'; msg.textContent='Escribe nombre y primer apellido.'; return; }
  const btn=document.getElementById('btnInvitar'); btn.disabled=true; btn.textContent='Comprobando...';
  try{
    const {data:{session}}=await sb.auth.getSession();
    const r=await fetch(SUPABASE_URL+'/functions/v1/invitar',{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({nombre,apellido})});
    const data=await r.json();
    btn.disabled=false; btn.textContent='Añadir invitado';
    if(!r.ok){ msg.style.color='var(--bad)'; msg.textContent=data.error||'No se pudo añadir.'; return; }
    CLIENTE.descuento_invitados=data.descuento;
    msg.style.color='#12a150'; msg.textContent=`✅ ¡${data.invitado} añadido! Ya tienes ${data.invitados} invitado(s) · ${data.descuento}€ de descuento.`;
    const box=document.getElementById('invBox');
    if(box) box.innerHTML=`<div style="font-size:14px;color:var(--muted)">Tus invitados</div><div style="font-size:32px;font-weight:800;color:var(--teal)">${data.invitados}/6</div><div style="font-size:16px;font-weight:700">${data.descuento}€ de descuento</div>`;
    document.getElementById('inv_nombre').value=''; document.getElementById('inv_apellido').value='';
    renderInicio();
  }catch(e){ btn.disabled=false; btn.textContent='Añadir invitado'; msg.style.color='var(--bad)'; msg.textContent='Error de conexión. Inténtalo de nuevo.'; }
}

// ====== COMPARTIR EVOLUCIÓN (post para redes) ======
function abrirCompartir(){
  abrirDetalle('Comparte tu evolución', `
    <div style="text-align:center">
      <canvas id="postCanvas" width="1080" height="1350" style="width:100%;max-width:300px;border-radius:16px;box-shadow:var(--shadow)"></canvas>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn" style="flex:1" id="btnShare" onclick="compartirPost()">📤 Compartir</button>
        <button class="btn" style="flex:1;background:#fff;color:var(--teal);border:2px solid var(--teal);box-shadow:none" onclick="descargarPost()">⬇️ Descargar</button>
      </div>
      <p style="font-size:14px;font-weight:800;color:var(--dark);margin-top:14px;line-height:1.35">Compártelo en Instagram, TikTok, Facebook o WhatsApp</p>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:10px;align-items:center">
        <svg width="34" height="34" viewBox="0 0 24 24" aria-label="Instagram"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".5" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#igg)"/><rect x="5" y="5" width="14" height="14" rx="4.5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.6" cy="7.4" r="1.1" fill="#fff"/></svg>
        <svg width="34" height="34" viewBox="0 0 24 24" aria-label="TikTok"><rect width="24" height="24" rx="6" fill="#000"/><path fill="#fff" d="M17.4 8.6a3.7 3.7 0 0 1-2.3-.8v4.9a3.95 3.95 0 1 1-3.95-3.95c.18 0 .35.02.52.05v2.03a1.95 1.95 0 1 0 1.43 1.87V5.1h1.95a3.7 3.7 0 0 0 2.88 3.5z"/></svg>
        <svg width="34" height="34" viewBox="0 0 24 24" aria-label="Facebook"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z"/></svg>
        <svg width="34" height="34" viewBox="0 0 32 32" aria-label="WhatsApp"><path fill="#25D366" d="M16 3.2C9 3.2 3.4 8.8 3.4 15.7c0 2.5.7 4.8 1.9 6.8L3 29.2l7-1.9c1.9 1 4.1 1.6 6 1.6 6.9 0 12.5-5.6 12.5-12.5S22.9 3.2 16 3.2z"/><path fill="#fff" d="M12.6 9.7c-.25-.55-.5-.56-.74-.57h-.63c-.22 0-.58.08-.88.4-.3.32-1.15 1.12-1.15 2.74s1.18 3.18 1.34 3.4c.16.22 2.28 3.65 5.62 4.98 2.78 1.1 3.34.88 3.95.82.6-.05 1.95-.8 2.22-1.57.28-.77.28-1.43.2-1.57-.08-.13-.3-.2-.63-.37-.33-.16-1.95-.96-2.25-1.07-.3-.11-.52-.16-.74.17-.22.33-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.64-.98-.88-1.65-1.96-1.84-2.29-.19-.33-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.72-1.8-1.02-2.46z"/></svg>
      </div>
    </div>`);
  setTimeout(()=>dibujarPost(true),80);
}
function _rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function _wrap(ctx,text,x,y,maxW,lh){const words=text.split(' ');let line='',yy=y;for(const w of words){const t=line+w+' ';if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line.trim(),x,yy);line=w+' ';yy+=lh;}else line=t;}ctx.fillText(line.trim(),x,yy);}
function _img(url){return new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=rej;im.src=url;});}
function _estrella(ctx,cx,cy,r,color){ctx.save();ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const ang=Math.PI/5*i-Math.PI/2;const rr=i%2?r*0.45:r;ctx.lineTo(cx+rr*Math.cos(ang),cy+rr*Math.sin(ang));}ctx.closePath();ctx.fill();ctx.restore();}
async function dibujarPost(conBadge){
  const cv=document.getElementById('postCanvas'); if(!cv) return;
  const ctx=cv.getContext('2d'); const W=1080,H=1350;
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0f8a9c'); g.addColorStop(1,'#0b5b52');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(920,150,300,0,7); ctx.fill();
  ctx.beginPath(); ctx.arc(120,1250,240,0,7); ctx.fill();
  ctx.textAlign='center';
  ctx.fillStyle='#fff'; ctx.font='800 90px Montserrat, sans-serif'; ctx.fillText('Saneas.es', W/2, 145);
  ctx.fillStyle='rgba(255,255,255,.95)'; ctx.font='600 42px Nunito, sans-serif'; ctx.fillText('nutrición para todos los bolsillos', W/2, 198);
  // ── Peso siempre como titular ─────────────────────────────
  const pesoIni=(PRIMERO&&PRIMERO.peso!=null)?Number(PRIMERO.peso):(CLIENTE.peso_inicial!=null?Number(CLIENTE.peso_inicial):null);
  const pesoHoy=(ULTIMO&&ULTIMO.peso!=null)?Number(ULTIMO.peso):null;
  const perdido=(pesoIni!=null&&pesoHoy!=null)?(pesoIni-pesoHoy):null;
  const semanas=CLIENTE.semana||null;
  ctx.fillStyle='#ffab73'; ctx.font='800 50px Montserrat, sans-serif'; ctx.fillText('MI EVOLUCIÓN', W/2, 288);
  if(perdido!=null && perdido>0){
    ctx.fillStyle='#a7f3d0'; ctx.font='900 200px Montserrat, sans-serif'; ctx.fillText('−'+r1(perdido).toString().replace('.',','), W/2, 498);
    ctx.fillStyle='#fff'; ctx.font='800 58px Montserrat, sans-serif'; ctx.fillText('kg menos de peso', W/2, 572);
  } else {
    ctx.fillStyle='#a7f3d0'; ctx.font='900 120px Montserrat, sans-serif'; ctx.fillText('¡En marcha!', W/2, 498);
    ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font='600 42px Nunito, sans-serif'; ctx.fillText('Mi cambio con Saneas', W/2, 566);
  }
  // ── 4 cajas destacadas: grasa visceral, agua, músculo, semanas ──
  const _delta=(f)=>{ const i=(PRIMERO&&PRIMERO[f]!=null)?Number(PRIMERO[f]):null; const h=(ULTIMO&&ULTIMO[f]!=null)?Number(ULTIMO[f]):null; if(i==null||h==null||isNaN(i)||isNaN(h)) return null; return h-i; };
  const _metric=(f,unit,downGood)=>{ const d=_delta(f); if(d==null) return {txt:'—', arrow:'', color:'#e6fffa'}; if(Math.abs(d)<0.05) return {txt:'0'+unit, arrow:'', color:'#e6fffa'}; const mejora= downGood ? d<0 : d>0; const mag=r1(Math.abs(d)).toString().replace('.',','); const sign=d<0?'−':'+'; return {txt:sign+mag+unit, arrow: mejora?(downGood?'▼':'▲'):(downGood?'▲':'▼'), color: mejora?'#34d399':'#f87171'}; };
  const _cajas=[
    {label:'Grasa visceral', m:_metric('grasa_visceral','',true)},
    {label:'Agua', m:_metric('agua','%',false)},
    {label:'Músculo', m:_metric('masa_muscular',' kg',false)},
    {label:'Semanas', m:{txt:(semanas?String(semanas):'—'), arrow:'', color:'#e6fffa'}}
  ];
  const _bw=470,_bh=150,_gx=30,_gy=28,_x0=(W-(_bw*2+_gx))/2,_y0=648;
  _cajas.forEach((b,i)=>{ const col=i%2,row=(i/2)|0; const x=_x0+col*(_bw+_gx), y=_y0+row*(_bh+_gy);
    ctx.fillStyle='rgba(255,255,255,.15)'; _rr(ctx,x,y,_bw,_bh,28); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font='700 30px Nunito, sans-serif'; ctx.fillText(b.label, x+_bw/2, y+52);
    ctx.fillStyle=b.m.color; ctx.font='900 58px Montserrat, sans-serif'; ctx.fillText((b.m.arrow?b.m.arrow+' ':'')+b.m.txt, x+_bw/2, y+122);
  });
  ctx.fillStyle='#fff'; ctx.font='800 48px Montserrat, sans-serif';
  _wrap(ctx, (perdido>0?'Paso a paso, lo estoy logrando con Saneas 💚':'Hoy empiezo mi cambio con Saneas 💚'), W/2, 1090, 950, 60);
  const nombre=(CLIENTE.nombre||'').trim();
  const completo=(nombre+' '+((CLIENTE.apellido||'').trim())).trim();
  ctx.fillStyle='#e6fffa'; ctx.font='900 54px Montserrat, sans-serif'; ctx.fillText(completo, W/2, 1250);
  if(esEmbajador() && nombre.length>=2){
    const totalW=ctx.measureText(completo).width; const startX=W/2-totalW/2;
    const xGap=startX+ctx.measureText(nombre.slice(0,-1)).width;   // hueco entre penúltima y última letra del nombre
    const bs=66, by=1250-54-bs+8;
    let dibujada=false;
    if(conBadge){ try{ const badge=await _img(SANEAMIGO_BADGE); ctx.drawImage(badge, xGap-bs/2, by, bs, bs); dibujada=true; }catch(e){} }
    if(!dibujada){ ctx.save(); ctx.fillStyle='#f5c542'; ctx.beginPath(); ctx.arc(xGap, by+bs/2, bs/2, 0, 7); ctx.fill(); _estrella(ctx,xGap,by+bs/2,bs*0.32,'#0b5b52'); ctx.restore(); }
  }
  cv._conBadge=conBadge;
}
async function _postBlob(){
  const cv=document.getElementById('postCanvas'); if(!cv) return null;
  try{ return await new Promise(res=>cv.toBlob(b=>res(b),'image/png',0.95)); }
  catch(e){ if(cv._conBadge!==false){ await dibujarPost(false); try{ return await new Promise(res=>cv.toBlob(b=>res(b),'image/png',0.95)); }catch(_){ return null; } } return null; }
}
async function compartirPost(){
  const b=await _postBlob(); if(!b){ alert('No se pudo generar la imagen.'); return; }
  const file=new File([b],'mi-evolucion-saneas.png',{type:'image/png'});
  const texto='Mi evolución con Saneas 💚 Nutrición para todos los bolsillos. saneas.es';
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file],text:texto,title:'Saneas'}); return; }catch(e){ if(e&&e.name==='AbortError') return; }
  }
  // Sin compartir nativo: descarga
  descargarBlob(b);
}
async function descargarPost(){ const b=await _postBlob(); if(b) descargarBlob(b); }
function descargarBlob(b){ const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='mi-evolucion-saneas.png'; a.click(); setTimeout(()=>URL.revokeObjectURL(u),2000); }

function pizarra(k,el){
  document.querySelectorAll('#s-inicio .choice').forEach(c=>c.classList.remove('active'));
  if(el)el.classList.add('active');
  const cont=document.getElementById('pizarra');
  if(k==='gym'){ renderPizarraGym(); return; }
  if(k==='prox'){ renderPizarraProx(); return; }
  let html='';
  if(k==='dieta'){
    if(TOMAS_HOY.length===0) html='<div class="empty">No hay dieta asignada para hoy.</div>';
    else { const CAL=calcCalorias(), pctMap=repartoComidas(comidasCalDe(TOMAS_HOY));
      html=TOMAS_HOY.map(t=>{const i=TOMA_INFO[t.toma]||['🍴',t.toma];
      return `<div class="meal"><div class="t">${i[0]} ${i[1]}</div><div class="d">${listar(t.texto)}</div></div>`;}).join(''); }
  }
  cont.innerHTML=html;
}
async function renderPizarraProx(){
  const cont=document.getElementById('pizarra');
  if(!CLIENTE.dieta_proxima_id){ cont.innerHTML='<div class="empty">Aún no tienes una próxima dieta asignada.</div>'; return; }
  cont.innerHTML='<div class="empty">Cargando tu próxima dieta…</div>';
  const pid=CLIENTE.dieta_proxima_id;
  const {data:d}=await sb.from('dietas').select('*').eq('id',pid).maybeSingle();
  const soloP = await sinTomas(pid);
  const bs="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#fff;color:var(--teal);border:2px solid var(--teal);border-radius:12px;padding:12px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none;margin-top:10px";
  const cart='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3890a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M1 1h3l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';
  cont.innerHTML=`<p style="font-size:16px;font-weight:800;color:#d97757;margin:0 0 2px">${fmt(d&&d.nombre_plan)}</p>
  ${soloP?'<p style="font-size:14px;font-weight:600;color:var(--muted);margin:0">Sin dieta: solo pautas</p>':'<p style="font-size:14px;font-weight:600;color:var(--muted);margin:0">Tu próxima dieta y su compra</p>'}
  ${soloP?'':`
    <button onclick="verDietaCompleta('${pid}')" style="${bs}">📋 Ver dieta completa</button>
    <button onclick="abrirCompra('${pid}')" style="${bs}">${cart} Lista de la compra</button>`}`;
}
async function verDietaCompleta(dietaId){
  abrirDetalle('Dieta completa','<div class="empty">Cargando tu dieta…</div>');
  const dias=[['1_Dia1','Lunes'],['2_Dia2','Martes'],['3_Dia3','Miércoles'],['4_Dia4','Jueves'],['5_Dia5','Viernes'],['6_Dia6','Sábado'],['7_Domingo','Domingo']];
  let html='';
  for(const [cod,nom] of dias){
    const tomas=await tomasDe(dietaId,cod);
    if(!tomas.length) continue;
    // Nombre del dia: 32px, mismo naranja, y aire suficiente para que se vea el salto de dia.
    html+=`<div style="font-size:32px;font-weight:800;color:#d97757;line-height:1.15;margin:38px 0 14px;padding-top:14px;border-top:2px solid #f0e4de">${nom}</div>`;
    tomas.forEach(t=>{ const i=TOMA_INFO[t.toma]||['🍴',t.toma]; html+=`<div class="plato dc" style="padding:8px 0;border-bottom:1px dashed #dbe6e9"><h4>${i[0]} ${i[1]}</h4><p>${listar(t.texto)}</p></div>`; });
  }
  abrirDetalle('Dieta completa', html||'<div class="empty">Esta dieta aún no tiene comidas cargadas.</div>');
}
// Pizarra Gym: la elección del cliente (Casa/Gym, días, día) + su entreno de ese día
async function renderPizarraGym(){
  const cont=document.getElementById('pizarra');
  await cargarGym();
  const dias=diasGym(), col='dia_'+GYM.dias;
  const list=GYM.ejers.filter(e=>e[col]===GYM.dia);
  cont.innerHTML=`
    <div class="seg2" style="margin-bottom:8px">
      <button class="${GYM.origen==='casa'?'active':''}" onclick="selGymO('casa')">🏠 Casa</button>
      <button class="${GYM.origen==='gym'?'active':''}" onclick="selGymO('gym')">🏋️ Gimnasio</button></div>
    <div class="seg2" style="margin-bottom:8px">${[3,4,5,6].map(n=>`<button class="${GYM.dias===n?'active':''}" onclick="selGymN(${n})">${n} días</button>`).join('')}</div>
    <div class="daysel" style="margin-bottom:8px">${dias.map((d,i)=>`<button class="${d===GYM.dia?'active':''}" onclick="selGymD('${d}')">Día ${i+1}</button>`).join('')}</div>
    ${list.length? list.map(exCard).join('') : '<div class="empty">Sin ejercicios.</div>'}`;
}
function persistGym(){ if(CLIENTE&&CLIENTE.id){const upd={dias_entreno:GYM.dias,gym_origen:GYM.origen,gym_dia:GYM.dia};sb.from('clientes').update(upd).eq('id',CLIENTE.id);Object.assign(CLIENTE,upd);} }
async function selGymO(o){GYM.origen=o;GYM.dia='Dia1';await cargarGym();persistGym();renderPizarraGym();}
async function selGymN(n){GYM.dias=n;GYM.dia='Dia1';await cargarGym();persistGym();renderPizarraGym();}
function selGymD(d){GYM.dia=d;persistGym();renderPizarraGym();}

