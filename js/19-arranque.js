// SANEAS · js/19-arranque.js · Arranque: sesión persistente
// ====== ARRANQUE: sesión persistente ======
(async()=>{
  if(new URLSearchParams(location.search).get('pago')==='ok'){ setTimeout(()=>{try{toast('¡Pago recibido! Tu cuenta se está activando 🎉');}catch(e){}},800); }
  const {data:{session}}=await sb.auth.getSession(); if(session) await iniciarSesion();
})();

