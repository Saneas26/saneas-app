// SANEAS · js/04-bloqueo.js · Bloqueo por renovación caducada
// ====== BLOQUEO por renovación caducada ======
function bloqueado(c){ if(!c||!c.fecha_renovacion) return true;   // sin pago todavía → bloquear el acceso
  const r=new Date(c.fecha_renovacion+'T00:00:00'); const t=new Date(); t.setHours(0,0,0,0); return r<t; }
function mostrarBloqueo(){
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('main').classList.add('hidden');
  let _bloqTxt;
  if(CLIENTE.fecha_renovacion){
    _bloqTxt = 'Tu renovación venció el '+fechaCorta(CLIENTE.fecha_renovacion)+'. Renueva tu cuota para volver a acceder a tu app.';
    const _lim=new Date(CLIENTE.fecha_renovacion+'T00:00:00'); _lim.setDate(_lim.getDate()+6);
    const _hoy=new Date(); _hoy.setHours(0,0,0,0);
    const _dosD=n=>String(n).padStart(2,'0');
    const _limISO=_lim.getFullYear()+'-'+_dosD(_lim.getMonth()+1)+'-'+_dosD(_lim.getDate());
    if(_lim>_hoy) _bloqTxt += ' Si no se renueva antes del '+fechaCorta(_limISO)+', tus datos se borrarán de Saneas y tu plaza quedará libre.';
  } else {
    _bloqTxt = 'Un último paso: elige tu bono y realiza el pago para acceder a tu app.';
  }
  document.getElementById('bloqTxt').textContent = _bloqTxt;
  renderPagos('bloq-pagos');
  document.getElementById('bloqueo').classList.remove('hidden');
}

// ====== AUTO-VÍNCULO (retirado el 17/07/2026) ======
// La migración desde Glide terminó: todos los clientes tienen su ficha en `clientes`.
// Si un login llega sin ficha no se inventa nada: cae a la pantalla de pago/bloqueo.

// Crear ficha completa con datos de facturación (registro nuevo)
async function crearCliente(user,datos){
  const row={id:user.id,email:user.email,telefono:PENDING?PENDING.telefono:null,
    nombre:datos.nombre,apellido:datos.ap1,apellido2:datos.ap2,dni:datos.dni,genero:datos.genero,altura:num(datos.altura),
    calle:datos.calle,municipio:datos.muni,codigo_postal:datos.cp,provincia:datos.prov,pais:datos.pais,
    nivel:'Nivel1',agua_objetivo_ml:2000,
    fecha_nacimiento:datos.nacimiento||null};
  const {error}=await sb.from('clientes').insert(row);
  if(error)console.error('insert cliente',error);
}

