-- ============================================================================
-- SANEAS · La hora que manda es la de MADRID, todo el año  (02/08/2026)
-- ----------------------------------------------------------------------------
-- Óscar vive en Canarias, pero el 98% de los clientes está en la península.
-- Regla: cuando algo se fija "a las 20:00", son las 20:00 de Madrid en enero
-- y en julio.
--
-- Canarias y Madrid cambian la hora LA MISMA NOCHE, así que basta con escribir
-- el nombre de zona (Europe/Madrid) y marzo/octubre se ajustan solos.
-- MADRID VA UNA HORA POR DELANTE DE CANARIAS: 20:00 Madrid = 19:00 Canarias.
--
-- OJO al migrar: hay dos tipos de sitio y no se tratan igual.
--   · Umbral de hora  -> hay que cambiar la zona Y el número (09:00 Canarias
--                        son las 10:00 de Madrid; el instante no se mueve).
--   · Frontera de día -> solo la zona; el día pasa a empezar a las 00:00 Madrid.
-- ============================================================================

-- 1) El corte de consulta: MISMO INSTANTE, dicho en hora de Madrid
create or replace function public.saneas_corte(p_dia_consulta text, p_semana_lunes date)
 returns timestamp with time zone
 language sql
 stable
as $function$
  select case when public.saneas_dia_num(p_dia_consulta) is null then null
    else ((p_semana_lunes + (public.saneas_dia_num(p_dia_consulta) - 1)) + time '10:00')
         at time zone 'Europe/Madrid' end
$function$;

-- 2) La pasada nocturna, a las 20:00 de Madrid todo el año.
--    Va emparejado con enviar-push, que exige hora === 20 en Europe/Madrid.
--    pg_cron solo entiende UTC: dos entradas y la función descarta la que no
--    toca (verano 18 UTC = 20:00 Madrid · invierno 19 UTC = 20:00 Madrid).
--    Si se cambia una sin la otra, en invierno se queda mudo. Ya pasó en julio.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'saneas-nocturno'),
  schedule => '0 18,19 * * *'
);

-- ----------------------------------------------------------------------------
-- PENDIENTE: quedan 7 funciones usando Atlantic/Canary. Todas la usan solo para
-- saber qué día es hoy, así que basta con cambiar la zona:
--   accesos_resumen · informe_diario · panel_ingresos · saneas_avance_diario
--   saneas_ciclo_hoy · saneas_marcar_sin_consulta · saneas_trg_fecha_del_envio
-- Comprobar con:
--   select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--    where n.nspname='public' and p.prokind='f'
--      and pg_get_functiondef(p.oid) like '%Atlantic/Canary%';
-- ----------------------------------------------------------------------------
