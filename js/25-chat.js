// SANEAS · js/25-chat.js · Chat privado 1 a 1 con Óscar (dentro de Registro semanal)
// Cada cliente ve solo su conversación (RLS en tabla mensajes). Texto libre, sin
// formulario: la idea es que sustituya al audio de WhatsApp con el resumen semanal.
let CHAT_MSGS = [];

async function cargarChat(){
  const cont=document.getElementById('chatMsgs');
  if(!cont||!CLIENTE||!CLIENTE.id) return;
  const {data,error}=await sb.from('mensajes').select('*').eq('cliente_id',CLIENTE.id).order('created_at');
  if(error){ console.error('chat',error); return; }
  CHAT_MSGS=data||[];
  pintarChat();
  marcarLeidoCliente();
}
function _horaChat(f){ try{ return new Date(f).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
function _burbujaChat(m){
  const mio=m.remitente==='cliente';
  return `<div style="align-self:${mio?'flex-end':'flex-start'};max-width:82%;background:${mio?'var(--teal)':'var(--light)'};color:${mio?'#fff':'var(--dark)'};border-radius:14px;padding:9px 12px 7px;font-size:14.5px;line-height:1.4">`
    +`<div style="white-space:pre-wrap;word-break:break-word">${esc(m.texto)}</div>`
    +`<div style="font-size:10.5px;opacity:.7;margin-top:3px;text-align:right">${_horaChat(m.created_at)}</div></div>`;
}
function pintarChat(){
  const cont=document.getElementById('chatMsgs'); if(!cont) return;
  cont.innerHTML = CHAT_MSGS.length
    ? CHAT_MSGS.map(_burbujaChat).join('')
    : '<div style="font-size:13.5px;color:var(--muted);text-align:center;padding:10px 4px">Cuéntale a Óscar cómo te fue la semana: la dieta, cómo te sientes, cualquier duda. Te contesta él en persona.</div>';
  cont.scrollTop = cont.scrollHeight;
}
// Al abrir Registro, lo que el cliente ve de Óscar queda marcado como leído.
async function marcarLeidoCliente(){
  if(!CLIENTE||!CLIENTE.id) return;
  const pend=CHAT_MSGS.filter(m=>m.remitente==='oscar'&&!m.leido_cliente);
  if(!pend.length) return;
  const {error}=await sb.from('mensajes').update({leido_cliente:true})
    .eq('cliente_id',CLIENTE.id).eq('remitente','oscar').eq('leido_cliente',false);
  if(!error) pend.forEach(m=>{ m.leido_cliente=true; });
}
async function enviarMensajeChat(){
  const inp=document.getElementById('chatInput'); if(!inp||!CLIENTE||!CLIENTE.id) return;
  const texto=(inp.value||'').trim();
  if(!texto) return;
  const btn=document.getElementById('chatSendBtn');
  if(btn) btn.disabled=true; inp.disabled=true;
  try{
    const {data,error}=await sb.from('mensajes').insert({cliente_id:CLIENTE.id,remitente:'cliente',texto}).select().maybeSingle();
    if(error) throw error;
    CHAT_MSGS.push(data||{remitente:'cliente',texto,created_at:new Date().toISOString()});
    inp.value='';
    pintarChat();
    trackEvento('chat_mensaje_enviado');
  }catch(e){
    console.error('chat envio',e);
    alert('No se pudo enviar el mensaje, inténtalo de nuevo.');
  }
  inp.disabled=false; if(btn) btn.disabled=false; inp.focus();
}
function chatKeydown(ev){
  if(ev.key==='Enter' && !ev.shiftKey){ ev.preventDefault(); enviarMensajeChat(); }
}
