// SANEAS · js/03-auth.js · Login OTP, alta de cliente nuevo y ficha personal
// ====== AUTH UI ======
function hideCard(id){document.getElementById(id).classList.add('hidden');}
function showCard(id){document.getElementById(id).classList.remove('hidden');}
function showLogin(){hideCard('codigoCard');hideCard('datosCard');hideCard('nuevoCard');showCard('loginCard');}
// Lleva al cliente a la pantalla de datos: ahi es donde puede corregir lo que falte.
function mostrarDatos(){ if(_pantallaVisible()!=='datos'){ hideCard('loginCard');hideCard('codigoCard');hideCard('nuevoCard');showCard('datosCard'); } }
function setMsg(id,txt,cls){const e=document.getElementById(id);e.innerHTML=txt?`<div class="msg ${cls}">${txt}</div>`:'';}

// ---- Bienvenida cliente nuevo (sin datos aún) ----
function showNuevo(){hideCard('loginCard');hideCard('codigoCard');hideCard('datosCard');showCard('nuevoCard');renderPlanes();}
const PLAN_NUEVO={
  prueba:{label:'Prueba · 2 semanas',amount:15},
  basico:{label:'Básico',amount:30},
  completo_mensual:{label:'Completo Mensual',amount:60},
  completo_trimestral:{label:'Completo Trimestral',amount:170},
  completo_semestral:{label:'Completo Semestral',amount:300},
  completo_anual:{label:'Completo Anual',amount:600},
  premium:{label:'Premium VIP',amount:120},
};
function planCard(titulo,precio,desc,planId){
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div><b style="font-size:16px">${titulo}</b><div style="font-size:14px;color:var(--muted)">${desc}</div></div>
      <div style="font-weight:800;color:var(--teal);white-space:nowrap">${precio}</div></div>
    <button class="btn" style="margin-top:10px;padding:11px" onclick="nuevoDatos('${planId}')">Lo quiero</button></div>`;
}
function renderPlanes(){
  document.getElementById('nuevoBody').innerHTML=`
    <h2 style="text-align:center">${saludo()}, bombón 🍬</h2>
    <p style="font-size:14px;color:var(--muted);text-align:center;margin:8px 0 16px">Bienvenido/a a Saneas. Elige el bono que quieres contratar:</p>
    ${planCard('🌱 Prueba','15€','2 semanas para conocernos','prueba')}
    ${planCard('Básico','30€/mes','Seguimiento en modo automático','basico')}
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><b style="font-size:16px">Completo</b><div style="font-size:14px;color:var(--muted)">Seguimiento completo con Oscar</div></div>
        <div style="font-weight:800;color:var(--teal)">desde 60€</div></div>
      <div style="margin-top:8px">
        ${[['completo_mensual','Mensual','60€/mes'],['completo_trimestral','Trimestral','170€'],['completo_semestral','Semestral','300€ · 1 mes gratis'],['completo_anual','Anual','600€ · 2 meses gratis']].map(o=>`<button class="verobj" style="text-align:left;display:flex;justify-content:space-between;margin-top:8px" onclick="nuevoDatos('${o[0]}')"><span>${o[1]}</span><b>${o[2]}</b></button>`).join('')}
      </div></div>
    ${planCard('Premium · VIP','120€/mes','Incluye todas las consultas telefónicas','premium')}
    <div class="switch" style="margin-top:14px">¿Ya eres cliente? <a onclick="showLogin()">Entrar</a></div>`;
}
// Formulario de datos + crear cuenta y pagar
function nuevoDatos(planId){
  const p=PLAN_NUEVO[planId]||{label:planId,amount:''};
  document.getElementById('nuevoBody').innerHTML=`
    <h2 style="text-align:center">${p.label} · ${p.amount}€</h2>
    <p style="font-size:14px;color:var(--muted);text-align:center;margin:8px 0 14px">Crea tu cuenta para empezar. Entrarás con tu <b>email + teléfono</b>.</p>
    <div class="grid2">
      <div class="field"><label>Nombre</label><input id="n_nombre"></div>
      <div class="field"><label>Apellido 1</label><input id="n_ap1"></div>
      <div class="field"><label>Apellido 2</label><input id="n_ap2"></div>
      <div class="field"><label>DNI</label><input id="n_dni"></div>
      <div class="field"><label>Altura (cm)</label><input id="n_altura" type="number" min="120" max="220" step="1" placeholder="p. ej. 167"></div>
      <div class="field"><label>Sexo</label>
        <select id="n_genero" class="search" style="margin:0"><option value="">—</option><option>Mujer</option><option>Hombre</option></select></div>
      <div class="field"><label>Fecha de nacimiento</label><input id="n_nacimiento" type="date"></div>
      <div class="field"><label>Email</label><input id="n_email" type="email"></div>
      <div class="field"><label>Teléfono</label><input id="n_tel" type="tel"></div>
    </div>
    <div class="field"><label>Calle y número</label><input id="n_calle"></div>
    <div class="grid2">
      <div class="field"><label>Municipio</label><input id="n_muni"></div>
      <div class="field"><label>Código postal</label><input id="n_cp"></div>
      <div class="field"><label>Provincia</label><input id="n_prov"></div>
      <div class="field"><label>País</label><input id="n_pais" value="España"></div>
    </div>
    <button class="btn" id="btnCrearPagar" onclick="crearYpagar('${planId}')">Crear cuenta y pagar ${p.amount}€</button>
    <div id="nuevoMsg"></div>
    <div class="switch" style="margin-top:10px"><a onclick="elegirPlanManual('${planId}')">Prefiero pagar manual (Bizum, transferencia…)</a></div>
    <div class="switch" style="margin-top:6px"><a onclick="renderPlanes()">‹ Volver a los bonos</a></div>`;
}
async function crearYpagar(planId){
  const g=id=>document.getElementById(id).value.trim();
  const email=g('n_email'),tel=g('n_tel'),nombre=g('n_nombre'),ap1=g('n_ap1'),dni=g('n_dni');
  if(!email||!tel||!nombre||!ap1||!dni){setMsg('nuevoMsg','Rellena email, teléfono, nombre, primer apellido y DNI.','err');return;}
  const _malN=revisarDatosBasicos('n_'); if(_malN){setMsg('nuevoMsg',_malN,'err');return;}
  const btn=document.getElementById('btnCrearPagar');btn.disabled=true;btn.textContent='Creando...';
  try{
    const {data,error}=await sb.auth.signUp({email,password:telPass(tel)});
    if(error){ if((error.message||'').toLowerCase().includes('already')) throw new Error('Ya tienes una cuenta. Entra con tu email y teléfono.'); throw error; }
    if(!data.session){ setMsg('nuevoMsg','Cuenta creada. Si te pide confirmar el email, desactívalo en Supabase (Authentication → Email) y entra.','ok'); btn.disabled=false;btn.textContent='Crear cuenta y pagar'; return; }
    const u=data.user;
    const {error:e2}=await sb.from('clientes').insert({id:u.id,email:u.email,telefono:telPass(tel),
      nombre,apellido:ap1,apellido2:g('n_ap2'),dni,calle:g('n_calle'),municipio:g('n_muni'),
      codigo_postal:g('n_cp'),provincia:g('n_prov'),pais:g('n_pais')||'España',
      altura:num(g('n_altura')),genero:g('n_genero')||null,fecha_nacimiento:g('n_nacimiento')||null,
      nivel:'Nivel1',agua_objetivo_ml:2000,plan:(PLAN_NUEVO[planId]||{}).label});
    if(e2) throw e2;
    await contratarPlan(planId);   // crea el pago en Mollie y redirige al checkout
  }catch(e){ setMsg('nuevoMsg','Error: '+(e.message||e),'err'); btn.disabled=false;btn.textContent='Crear cuenta y pagar'; }
}
// Alternativa: pago manual + contacto (Oscar da el alta)
function elegirPlanManual(planId){
  const p=PLAN_NUEVO[planId]||{label:planId,amount:''}; const amt=p.amount;
  const wa='https://wa.me/34689806987?text='+encodeURIComponent('Hola Oscar, quiero contratar el '+p.label+' de Saneas ('+amt+'€). Te paso mis datos:');
  const bizum=(nombre,tel)=>`<div class="orow" style="cursor:pointer" onclick="copiar('${tel}')"><span>📱 Bizum · ${nombre}</span><b>${tel.replace(/(\d{3})(\d{3})(\d{3})/,'$1 $2 $3')} 📋</b></div>`;
  document.getElementById('nuevoBody').innerHTML=`
    <h2 style="text-align:center">Pago manual</h2>
    <div class="hitomsg" style="margin:10px 0">${p.label} · <b>${amt}€</b></div>
    <p style="font-size:14px;color:var(--muted);text-align:center;margin-bottom:12px">Paga por el método que prefieras y avísame. Yo confirmo tu alta y te doy acceso.</p>
    ${bizum('Oscar','689806987')}
    ${bizum('Raquel','676693237')}
    <div class="orow"><span>🔵 PayPal</span><b><a href="https://paypal.me/saneascom/${amt}" target="_blank" rel="noopener">Pagar ${amt}€ ›</a></b></div>
    <div class="orow" style="cursor:pointer" onclick="copiar('ES9214650100942061236296')"><span>🏦 ING</span><b style="font-size:14px">ES92 1465 0100 9420 6123 6296 📋</b></div>
    <div class="orow" style="cursor:pointer" onclick="copiar('ES2215830001199064086644')"><span>🏦 Revolut</span><b style="font-size:14px">ES22 1583 0001 1990 6408 6644 📋</b></div>
    <div class="orow"><span>💳 Tarjeta (SumUp)</span><b><a href="https://pay.sumup.com/b2c/XFTLTE3ENC" target="_blank" rel="noopener">Pagar ›</a></b></div>
    <a class="btn" style="display:block;text-align:center;text-decoration:none;margin-top:16px" href="${wa}" target="_blank" rel="noopener">💬 Enviar mis datos por WhatsApp</a>
    <div class="switch" style="margin-top:12px"><a onclick="renderPlanes()">‹ Volver a los bonos</a></div>`;
}
const telPass = t => String(t||'').replace(/\D/g,'').slice(-9);   // teléfono → últimos 9 dígitos (hace de contraseña)

let PENDING_EMAIL = null;

// La regla de "un solo aparato" es para las clientas: evita que dos personas
// compartan una cuota. Oscar no es una clienta, es el dueño: entra desde el movil,
// el ordenador y donde le haga falta a la vez. No es un secreto ni da permisos:
// quien manda sobre los datos es RLS, no esta lista.
const SIN_LIMITE_DE_APARATOS = ['oscarbelloso10@gmail.com','saneacuerpoymente@gmail.com'];

// La puerta es una sola: correo -> codigo -> dentro. Un caso, no tres.
// El muro de pago ya no vive aqui: vive dentro, en iniciarSesion() -> bloqueado().
async function login(){
  const email = val('l_email').trim().toLowerCase();
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    setMsg('loginMsg','Escribe tu correo para entrar.','err'); return;
  }
  const btn = document.getElementById('btnLogin');
  btn.disabled = true; btn.textContent = 'Enviando...';
  // shouldCreateUser:false -> nadie se crea una cuenta poniendo un correo.
  // El alta la da Oscar desde el panel, o Mollie cuando el cliente paga.
  await sb.auth.signInWithOtp({ email, options:{ shouldCreateUser:false } });
  btn.disabled = false; btn.textContent = 'Entrar';
  PENDING_EMAIL = email;
  document.getElementById('c_email').textContent = email;
  // Se pasa al codigo exista o no la cuenta: si dijeramos "ese correo no existe",
  // cualquiera podria averiguar quien es clienta probando correos.
  hideCard('loginCard'); showCard('codigoCard');
  setMsg('loginMsg',''); setMsg('codigoMsg','');
  const inp = document.getElementById('l_codigo');
  if(inp){ inp.value=''; inp.focus(); }
}

// La sesion se crea AQUI, dentro de la PWA. Por eso es codigo y no enlace:
// un enlace del correo abre Safari y la sesion se quedaria alli, no en la app.
async function verificarCodigo(){
  const token = val('l_codigo').replace(/\D/g,'');
  if(token.length < 6){ setMsg('codigoMsg','Escribe el código completo, tal y como te ha llegado.','err'); return; }
  const btn = document.getElementById('btnCodigo');
  btn.disabled = true; btn.textContent = 'Entrando...';
  const { error } = await sb.auth.verifyOtp({ email: PENDING_EMAIL, token, type: 'email' });
  if(error){
    btn.disabled = false; btn.textContent = 'Entrar';
    setMsg('codigoMsg','Ese código no es válido o ya ha caducado. Pide otro.','err'); return;
  }
  btn.disabled = false; btn.textContent = 'Entrar';
  if(!SIN_LIMITE_DE_APARATOS.includes(String(PENDING_EMAIL||'').trim().toLowerCase())){
    try{ await sb.auth.signOut({scope:'others'}); }catch(e){ console.error('cerrar otros aparatos', e); }
  }
  await iniciarSesion();
}

// Registro paso 2: crear la cuenta con los datos de facturación
// _fallo(): deja el error donde el cliente lo esta MIRANDO, no en una pantalla oculta.
// guardarFicha() se llama desde datosCard (ve btnCrear).
function _pantallaVisible(){
  const dc=document.getElementById('datosCard');
  return (dc && !dc.classList.contains('hidden')) ? 'datos' : 'login';
}
function _fallo(msg){
  if(_pantallaVisible()==='datos'){
    setMsg('datosMsg',msg,'err');
    const b=document.getElementById('btnCrear'); if(b){b.disabled=false;b.textContent='Guardar y entrar';}
  } else {
    setMsg('loginMsg',msg,'err');
    const b=document.getElementById('btnLogin'); if(b){b.disabled=false;b.textContent='Entrar';}
  }
}
// El alta de Oscar solo trae correo y telefono. El resto se lo pedimos aqui,
// la primera vez que entra. No se crea nada: se completa la ficha que ya existe.
async function guardarFicha(){
  const datos={nombre:val('d_nombre'),ap1:val('d_ap1'),ap2:val('d_ap2'),dni:val('d_dni'),
    altura:val('d_altura'),genero:document.getElementById('d_genero').value,nacimiento:val('d_nacimiento'),
    calle:val('d_calle'),muni:val('d_muni'),cp:val('d_cp'),prov:val('d_prov'),pais:val('d_pais')||'España'};
  const _dni=(datos.dni||'').trim();
  if(!datos.nombre||!datos.ap1||!_dni||!datos.calle||!datos.cp||!datos.muni||!datos.prov){
    _fallo('Faltan datos obligatorios: nombre, primer apellido, DNI, calle, municipio, código postal y provincia.');mostrarDatos();return;}
  if(!/[A-Za-z]$/.test(_dni)){_fallo('El DNI debe incluir la letra (por ejemplo 12345678Z).');mostrarDatos();return;}
  const _malD=revisarDatosBasicos('d_'); if(_malD){_fallo(_malD);mostrarDatos();return;}
  const btn=document.getElementById('btnCrear');btn.disabled=true;btn.textContent='Guardando...';
  try{
    const {data:{user}}=await sb.auth.getUser();
    if(!user) throw new Error('Se ha cerrado la sesión. Vuelve a entrar.');
    const row={nombre:datos.nombre,apellido:datos.ap1,apellido2:datos.ap2||null,dni:_dni,
      genero:datos.genero||null,altura:num(datos.altura),fecha_nacimiento:datos.nacimiento||null,
      calle:datos.calle,municipio:datos.muni,codigo_postal:datos.cp,provincia:datos.prov,pais:datos.pais};
    const {error}=await sb.from('clientes').update(row).eq('id',user.id);
    if(error) throw error;
    Object.assign(CLIENTE||{},row);
    hideCard('datosCard');
    await iniciarSesion();
  }catch(e){ btn.disabled=false; btn.textContent='Guardar y entrar'; _fallo('Error: '+(e.message||e)); }
}

// Que le falta a la ficha para que la app pueda calcularle nada y facturarle.
function fichaIncompleta(c){
  if(!c) return true;
  const dni=(c.dni||'').trim();
  if(!c.nombre || !c.apellido || !dni || !/[A-Za-z]$/.test(dni)) return true;
  if(!c.calle || !c.codigo_postal || !c.municipio || !c.provincia) return true;
  if(c.altura==null || !c.fecha_nacimiento) return true;
  if(!['Mujer','Hombre'].includes((c.genero||'').trim())) return true;
  return false;
}

function pintarFichaPendiente(c){
  const set=(id,v)=>{const e=document.getElementById(id); if(e) e.value=(v==null?'':v);};
  set('d_nombre',c.nombre); set('d_ap1',c.apellido); set('d_ap2',c.apellido2);
  set('d_dni',c.dni); set('d_altura',c.altura); set('d_nacimiento',c.fecha_nacimiento);
  set('d_calle',c.calle); set('d_muni',c.municipio); set('d_cp',c.codigo_postal);
  set('d_prov',c.provincia); set('d_pais',c.pais||'España');
  const g=document.getElementById('d_genero'); if(g) g.value=['Mujer','Hombre'].includes((c.genero||'').trim())?c.genero.trim():'';
  document.getElementById('auth').classList.remove('hidden');
  document.getElementById('main').classList.add('hidden');
  hideCard('loginCard'); hideCard('codigoCard'); hideCard('nuevoCard'); showCard('datosCard');
  setMsg('datosMsg','Antes de entrar, completa lo que falta. Todo es obligatorio.','err');
}

async function logout(){await sb.auth.signOut({scope:'local'});location.reload();}
function val(id){return document.getElementById(id).value.trim();}

