-- ============================================================
-- SANEAS · Leer el vídeo de la semana que está puesto ahora
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Pareja de lectura de panel_video_semana (video_semana.sql):
-- el vídeo vive en clientes.video_semana_url y este RPC devuelve
-- el que está fijado a los clientes activos, para que el panel
-- pueda montar el mensaje del grupo de WhatsApp sin adivinarlo.
-- ============================================================

create or replace function public.panel_video_actual()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v text;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;

  select video_semana_url into v
  from public.clientes
  where coalesce(activo, true) and nullif(trim(video_semana_url), '') is not null
  limit 1;

  return jsonb_build_object('ok', true, 'url', v);
end $$;

revoke all on function public.panel_video_actual() from public, anon;
grant execute on function public.panel_video_actual() to authenticated;
-- Recuerda: desde el editor SQL dice «no autorizado» a propósito
-- (guardia es_admin). Se usa desde el panel en modo admin.
