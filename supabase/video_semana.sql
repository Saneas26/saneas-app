-- ============================================================
-- SANEAS · El vídeo de la semana, para todos de una vez
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- El vídeo vive en clientes.video_semana_url y hasta ahora había
-- que cambiarlo cliente a cliente. Este RPC lo pone a todos los
-- clientes activos de golpe; el panel lo usa desde un botón.
-- Limpia los parámetros de compartir de YouTube (?si=, ?is=…) y
-- deja la URL corta, que es lo que la app sabe leer.
-- ============================================================

create or replace function public.panel_video_semana(p_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare id_video text; limpia text; n int;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;

  if p_url is null or trim(p_url) = '' then
    -- vacío = quitar el vídeo de la semana
    update public.clientes set video_semana_url = null where coalesce(activo,true);
    get diagnostics n = row_count;
    return jsonb_build_object('ok', true, 'quitado', true, 'clientes', n);
  end if;

  -- el id de YouTube, venga como venga la URL
  id_video := substring(p_url from '(?:youtu\.be/|v=|/embed/|/shorts/)([A-Za-z0-9_-]{11})');
  if id_video is null then
    raise exception 'Esa dirección no parece un vídeo de YouTube';
  end if;
  limpia := 'https://youtu.be/' || id_video;

  update public.clientes set video_semana_url = limpia where coalesce(activo,true);
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'url', limpia, 'clientes', n);
end $$;

revoke all on function public.panel_video_semana(text) from public, anon;
grant execute on function public.panel_video_semana(text) to authenticated;
-- Recuerda: desde el editor SQL dice «no autorizado» a propósito
-- (guardia es_admin). Se usa desde el panel en modo admin.
