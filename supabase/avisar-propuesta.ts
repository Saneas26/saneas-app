// SANEAS · Edge Function «avisar-propuesta»
// La dispara el Database Webhook al insertarse una fila en
// public.productos_propuestas y envía el aviso por Resend.
// Secretos que usa (los mismos del formulario de asesores):
//   CANDIDATOS_EMAIL → tu correo de destino (invisible para todos)
//   RESEND_API_KEY   → clave de Resend
Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const r = payload && payload.record;
    if (!r) return new Response('sin registro', { status: 400 });

    const dest = Deno.env.get('CANDIDATOS_EMAIL');
    const key = Deno.env.get('RESEND_API_KEY');
    if (!dest || !key) return new Response('faltan secretos', { status: 500 });

    const esc = (s: unknown) =>
      String(s ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

    const cliente = esc(r.cliente_nombre || 'Cliente sin nombre');
    const precio = isFinite(Number(r.precio))
      ? Number(r.precio).toFixed(2).replace('.', ',') + ' €'
      : String(r.precio ?? '');

    const fila = (t: string, v: string) =>
      `<tr><td style="padding:7px 14px 7px 0;color:#5f7178;font-weight:600;white-space:nowrap;vertical-align:top">${t}</td>` +
      `<td style="padding:7px 0;color:#1a2e35;font-weight:700;word-break:break-all">${v}</td></tr>`;

    let filas =
      fila('Cliente', cliente) +
      fila('Producto', esc(r.nombre)) +
      fila('Supermercado', esc(r.supermercado)) +
      fila('Precio', esc(precio));
    if (r.imagen_url) filas += fila('Imagen', `<a href="${esc(r.imagen_url)}" style="color:#3890a4">${esc(r.imagen_url)}</a>`);
    if (r.url_compra) filas += fila('Página de compra', `<a href="${esc(r.url_compra)}" style="color:#3890a4">${esc(r.url_compra)}</a>`);

    const html =
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:8px 4px">` +
      `<div style="font-size:22px;font-weight:800;color:#3890a4;margin-bottom:2px">Saneas</div>` +
      `<div style="font-size:16px;font-weight:800;color:#1a2e35;margin-bottom:14px">🛒 Nuevo artículo propuesto para la tienda</div>` +
      `<div style="font-size:14px;color:#1a2e35;line-height:1.5;margin-bottom:14px"><b>${cliente}</b> ha propuesto añadir este artículo a la tienda:</div>` +
      `<table style="border-collapse:collapse;font-size:14px">${filas}</table>` +
      `<div style="font-size:12px;color:#8aa0a7;margin-top:18px">Queda guardado como «pendiente» en productos_propuestas. Si te encaja, añádelo tú a CAT_Tienda; el catálogo no cambia solo.</div>` +
      `</div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: 'Saneas <app@saneas.es>',
        to: [dest],
        subject: `🛒 ${r.cliente_nombre || 'Un cliente'} propone: ${r.nombre} (${r.supermercado})`,
        html,
      }),
    });
    if (!res.ok) return new Response('resend: ' + (await res.text()), { status: 502 });
    return new Response('ok');
  } catch (e) {
    return new Response('error: ' + String(e), { status: 500 });
  }
});
