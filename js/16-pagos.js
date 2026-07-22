// SANEAS · js/16-pagos.js · Página de pagos (escaparate)
// ====== Contenido de la página Pagos (escaparate) ======
const PAGOS_HTML = `
<div style="padding: 10px 4px; font-family: 'Poppins', sans-serif; text-align: left;">
<div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 24px; padding: 16px 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); text-align: left;">
<div style="margin-bottom: 12px; text-align: left;">
<span style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 24px; color: #34d399; letter-spacing: -0.5px;">Saneas</span>
<span style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 26px; color: #ffffff; letter-spacing: -0.5px;"> Tarifas</span>
</div>
<table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 4px; border: none;">
<tr>
<td style="width: 50%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 12px 10px; text-align: left; vertical-align: top;">
<div style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Prueba</div>
<div style="font-size: 26px; color: #ffffff; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">15€</div>
<div style="font-size: 11px; color: #34d399; font-weight: 500; margin-top: 4px; line-height: 1.2;">2 semanas</div>
</td>
<td style="width: 50%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 12px 10px; text-align: left; vertical-align: top;">
<div style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Básico</div>
<div style="font-size: 26px; color: #ffffff; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">30€</div>
<div style="font-size: 11px; color: #e2e8f0; font-weight: 400; margin-top: 4px; line-height: 1.2; font-style: italic; opacity: 0.9;">En modo automático</div>
</td>
</tr>
<tr>
<td style="width: 50%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 12px 10px; text-align: left; vertical-align: top;">
<div style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Mensual</div>
<div style="font-size: 26px; color: #ffffff; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">60€</div>
<div style="font-size: 11px; color: #94a3b8; font-weight: 400; margin-top: 4px; line-height: 1.2;">Mes a mes</div>
</td>
<td style="width: 50%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 12px 10px; text-align: left; vertical-align: top;">
<div style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Trimestre</div>
<div style="font-size: 26px; color: #ffffff; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">170€</div>
<div style="font-size: 11px; color: #94a3b8; font-weight: 400; margin-top: 4px; line-height: 1.2;">Pago trimestral</div>
</td>
</tr>
<tr>
<td style="width: 50%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 12px 10px; text-align: left; vertical-align: top;">
<div style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Bono 6 Meses</div>
<div style="font-size: 26px; color: #ffffff; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">300€</div>
<div style="display: inline-block; font-size: 10px; color: #34d399; font-weight: 700; background: rgba(52,211,153,0.1); padding: 2px 6px; border-radius: 6px; margin-top: 4px;">1 mes gratis</div>
</td>
<td style="width: 50%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 12px 10px; text-align: left; vertical-align: top;">
<div style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Bono 1 Año</div>
<div style="font-size: 26px; color: #ffffff; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">600€</div>
<div style="display: inline-block; font-size: 10px; color: #34d399; font-weight: 700; background: rgba(52,211,153,0.1); padding: 2px 6px; border-radius: 6px; margin-top: 4px;">2 meses gratis</div>
</td>
</tr>
</table>
<div style="margin: 6px 8px 0px 8px; background: linear-gradient(90deg, rgba(147,51,234,0.15) 0%, rgba(192,132,252,0.05) 100%); border: 1px solid rgba(147,51,234,0.4); border-radius: 16px; padding: 12px 14px; text-align: left;">
<table style="width: 100%; border-collapse: collapse; border: none;">
<tr>
<td style="text-align: left; padding: 0; border: none; vertical-align: middle;">
<div style="font-family: 'Montserrat', sans-serif; font-size: 18px; color: #ffffff; font-weight: 800; line-height: 1.1;">Tarifa VIP</div>
<div style="font-size: 12px; color: #c084fc; font-weight: 500; margin-top: 2px; line-height: 1.2;">Todas las consultas telefónicas</div>
</td>
<td style="text-align: right; padding: 0; border: none; vertical-align: middle;">
<div style="font-size: 26px; color: #c084fc; font-weight: 800; font-family: 'Montserrat', sans-serif; line-height: 1;">120€</div>
<div style="font-size: 11px; color: #94a3b8; font-weight: 400; margin-top: 2px;">al mes</div>
</td>
</tr>
</table>
</div>
</div>
</div>
<div style="height:14px"></div>
<div style="background:linear-gradient(135deg,#ffffff,#f8fafc);border-radius:28px;padding:24px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,.08);font-family:sans-serif;">
<div style="text-align:center;margin-bottom:22px;">
<div style="font-size:14px;color:#0ea5a4;font-weight:700;text-transform:uppercase;letter-spacing:2px;">💎 Área de Pago Saneas</div>
</div>
<div style="background:#f8fafc;border-radius:18px;padding:18px;margin-bottom:18px;border:1px solid #e2e8f0;">
<div style="display:flex;align-items:center;margin-bottom:18px;">
<span style="font-size:34px;margin-right:12px;">📱</span>
<div><div style="font-size:22px;font-weight:800;color:#0f172a;">Pago por Bizum</div>
<div style="font-size:14px;color:#64748b;">Transferencia inmediata y segura</div></div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:1px solid #e2e8f0;">
<div><div style="font-size:18px;font-weight:700;color:#0f172a;">+34 689 806 987</div>
<div style="font-size:14px;color:#64748b;">Oscar BJ</div></div>
<a href="data:text/vcard;charset=utf-8,BEGIN%3AVCARD%0AVERSION%3A3.0%0AFN%3AOscar%20Belloso%20-%20Saneas%0ATEL%3BTYPE%3DCELL%3A%2B34689806987%0AORG%3ASaneas%0AEND%3AVCARD" style="background:#14b8a6;color:white;padding:12px 18px;border-radius:30px;text-decoration:none;font-size:14px;font-weight:700;">👤 Guardar</a>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;">
<div><div style="font-size:18px;font-weight:700;color:#0f172a;">+34 676 693 237</div>
<div style="font-size:14px;color:#64748b;">Raquel GR</div></div>
<a href="data:text/vcard;charset=utf-8,BEGIN%3AVCARD%0AVERSION%3A3.0%0AFN%3ARaquel%20GR%20-%20Saneas%0ATEL%3BTYPE%3DCELL%3A%2B34676693237%0AORG%3ASaneas%0AEND%3AVCARD" style="background:#14b8a6;color:white;padding:12px 18px;border-radius:30px;text-decoration:none;font-size:14px;font-weight:700;">👤 Guardar</a>
</div>
</div>
<div style="background:linear-gradient(135deg,#ecfeff,#f0fdfa);border:1px solid #99f6e4;padding:16px;border-radius:16px;text-align:center;">
<div style="font-size:16px;font-weight:700;color:#0f766e;">💡 Paso final</div>
<div style="font-size:14px;color:#155e75;margin-top:6px;line-height:1.5;">Guarda el contacto y realiza el Bizum desde tu aplicación bancaria habitual.</div>
</div>
</div>
<div style="height:14px"></div>
<div style="background:linear-gradient(135deg,#0f4c81,#2563eb);border-radius:28px;padding:24px;box-shadow:0 10px 30px rgba(37,99,235,.25);font-family:sans-serif;color:white;">
<div style="display:flex;align-items:center;margin-bottom:20px;">
<div style="width:52px;height:52px;background:rgba(255,255,255,.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-right:14px;">🔵</div>
<div><div style="font-size:24px;font-weight:800;">PayPal</div>
<div style="font-size:14px;color:rgba(255,255,255,.75);">Pago online seguro</div></div>
</div>
<div style="background:rgba(255,255,255,.08);border-radius:16px;padding:16px;margin-bottom:18px;">
<div style="font-size:14px;color:rgba(255,255,255,.7);margin-bottom:6px;">Enlace de pago</div>
<div style="font-size:18px;font-weight:700;">paypal.me/saneascom</div>
</div>
<div style="text-align:center;">
<a href="https://paypal.me/saneascom" style="display:inline-block;background:white;color:#2563eb;padding:15px 24px;border-radius:30px;text-decoration:none;font-size:16px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.15);">💸 Pagar por PayPal</a>
</div>
<div style="margin-top:18px;text-align:center;font-size:14px;color:rgba(255,255,255,.75);">⚡ Acceso rápido y pago instantáneo mediante PayPal</div>
</div>
<div style="height:14px"></div>
<div style="background:linear-gradient(135deg,#065f46,#10b981);border-radius:28px;padding:24px;box-shadow:0 10px 30px rgba(16,185,129,.25);font-family:sans-serif;color:white;">
<div style="display:flex;align-items:center;margin-bottom:20px;">
<div style="width:52px;height:52px;background:rgba(255,255,255,.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-right:14px;">🏦</div>
<div><div style="font-size:24px;font-weight:800;">Transferencia bancaria</div>
<div style="font-size:14px;color:rgba(255,255,255,.75);">Pago mediante cuenta bancaria</div></div>
</div>
<div style="background:rgba(255,255,255,.12);border-radius:18px;padding:18px;margin-bottom:18px;">
<div style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.7);margin-bottom:8px;">Cuenta ING</div>
<div style="font-size:16px;font-weight:700;margin-bottom:10px;">Oscar Belloso Jiménez</div>
<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:12px;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:1px;word-break:break-all;">ES92 1465 0100 9420 6123 6296</div>
</div>
<div style="background:rgba(255,255,255,.12);border-radius:18px;padding:18px;">
<div style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.7);margin-bottom:8px;">Cuenta Revolut</div>
<div style="font-size:16px;font-weight:700;margin-bottom:10px;">Oscar Belloso Jiménez</div>
<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:12px;font-family:monospace;font-size:16px;font-weight:700;letter-spacing:1px;word-break:break-all;">ES22 1583 0001 1990 6408 6644</div>
</div>
</div>
<div style="height:14px"></div>
<div style="background:linear-gradient(135deg,#0f172a,#020617);border-radius:28px;padding:24px;box-shadow:0 12px 35px rgba(0,0,0,.35);font-family:sans-serif;color:white;">
<div style="display:flex;align-items:center;margin-bottom:22px;">
<div style="width:52px;height:52px;background:rgba(255,215,0,.12);border:1px solid rgba(255,215,0,.25);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin-right:14px;">💳</div>
<div><div style="font-size:24px;font-weight:800;color:#f8fafc;">Tarjeta</div>
<div style="font-size:14px;color:#cbd5e1;">Pago seguro online</div></div>
</div>
<div style="background:linear-gradient(135deg,rgba(255,215,0,.08),rgba(255,255,255,.04));border:1px solid rgba(255,215,0,.15);border-radius:20px;padding:18px;margin-bottom:18px;">
<div style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#fbbf24;margin-bottom:8px;">Método de pago</div>
<div style="font-size:22px;font-weight:800;color:white;">SumUp Secure Payments</div>
<div style="font-size:14px;color:#cbd5e1;margin-top:8px;">Visa · Mastercard · American Express</div>
</div>
<div style="text-align:center;">
<a href="https://pay.sumup.com/b2c/XFTLTE3ENC" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0f172a;padding:16px 28px;border-radius:32px;text-decoration:none;font-size:16px;font-weight:800;box-shadow:0 6px 20px rgba(245,158,11,.35);">💳 Pagar con tarjeta</a>
</div>
<div style="margin-top:20px;text-align:center;font-size:14px;color:#94a3b8;">⚡ Confirmación inmediata del pago</div>
</div>`;

