-- ============================================================================
-- SANEAS · Limpieza de audios de reportes
-- ----------------------------------------------------------------------------
-- El cron saneas_borra_reportes hacía "delete from storage.objects" y FALLABA
-- todas las noches: Supabase lo bloquea a propósito (borrar la fila deja el
-- fichero huérfano ocupando espacio). Hay un interruptor para saltarse el
-- bloqueo (storage.allow_delete_query) pero es una trampa: quita el error sin
-- hacer el trabajo.
--
-- Solución: el SQL solo LISTA y la edge function 'borrar-reportes' borra por la
-- API de Storage, que sí se lleva el fichero.  (supabase/borrar_reportes.ts)
-- ============================================================================

create or replace function public.saneas_reportes_viejos(
  p_dias int default 21,
  secret text default null
) returns setof text
language plpgsql
security definer
set search_path = public, storage
as $function$
begin
  if secret is distinct from 'SANEAS_SYNC_2026' and not public.es_admin() then
    raise exception 'secret';
  end if;
  if p_dias is null or p_dias < 1 then p_dias := 21; end if;
  return query
    select o.name from storage.objects o
     where o.bucket_id = 'reportes'
       and o.created_at < now() - make_interval(days => p_dias)
     order by o.created_at
     limit 500;
end;
$function$;

grant execute on function public.saneas_reportes_viejos(int, text) to anon, authenticated;

-- El cron pasa a llamar a la edge function (misma hora de siempre, 04:20)
select cron.alter_job(
  (select jobid from cron.job where jobname = 'saneas_borra_reportes'),
  command => $cmd$select net.http_post(
  url := 'https://uisrxztowgdpkxeuznfh.supabase.co/functions/v1/borrar-reportes',
  headers := '{"Content-Type":"application/json"}'::jsonb,
  body := '{"secret":"SANEAS_SYNC_2026"}'::jsonb
);$cmd$
);

-- ----------------------------------------------------------------------------
-- Y de paso, la pasada nocturna de avisos: el cron disparaba a las 19h Canarias
-- y enviar-push solo actúa a las 20h, así que estuvo 17 noches sin enviar nada
-- (16/07 → 01/08/2026). Dos entradas para acertar en verano y en invierno.
-- ----------------------------------------------------------------------------
select cron.alter_job(
  (select jobid from cron.job where jobname = 'saneas-nocturno'),
  schedule => '0 19,20 * * *'
);
