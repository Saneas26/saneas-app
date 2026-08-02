// ============================================================
// SANEAS · Edge Function: borrar-reportes
// Limpia el bucket "reportes": borra los audios de más de N días (21 por defecto).
// POST JSON (requiere secret). Acciones:
//   {secret}                 -> borra los de más de 21 días
//   {secret, dias: 30}       -> cambia el corte
//   {secret, dry: true}      -> solo cuenta, NO borra
//
// Por qué una función y no SQL: Supabase BLOQUEA el delete directo sobre
// storage.objects. Hay un interruptor para saltárselo, pero solo borraría la
// fila y dejaría el fichero ocupando espacio para siempre. La API de Storage
// sí se lleva el fichero. Los nombres los da la RPC saneas_reportes_viejos.
// Verify JWT: OFF · service role
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET = "SANEAS_SYNC_2026";
const BUCKET = "reportes";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch (_) { b = {}; }
  if (b.secret !== SECRET) return json({ ok: false, error: "secret" }, 401);

  const dias = (Number.isFinite(Number(b.dias)) && Number(b.dias) >= 1) ? Math.floor(Number(b.dias)) : 21;

  const { data: nombres, error: e1 } = await sb.rpc("saneas_reportes_viejos", { p_dias: dias, secret: SECRET });
  if (e1) return json({ ok: false, error: "listar: " + e1.message }, 500);

  const lista: string[] = (nombres || []) as string[];
  if (!lista.length) return json({ ok: true, dias, borrados: 0, motivo: "no hay nada de más de " + dias + " días" });
  if (b.dry) return json({ ok: true, dry: true, dias, serian: lista.length });

  const { data: fuera, error: e2 } = await sb.storage.from(BUCKET).remove(lista);
  if (e2) return json({ ok: false, error: "borrar: " + e2.message, pedidos: lista.length }, 500);
  return json({ ok: true, dias, pedidos: lista.length, borrados: (fuera || []).length });
});
