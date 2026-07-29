-- ============================================================
-- SANEAS · ¿Quién hace avanzar la dieta sola?
--
-- Solo LEE. No cambia nada, no borra nada. Sirve para saber
-- exactamente dónde vive el avance automático de la dieta
-- (la próxima pasa a ser la actual), para poder congelarlo
-- cuando el cliente está de vacaciones.
--
-- Pega el BLOQUE 1 y pulsa Run. Luego el BLOQUE 2. Luego el 3.
-- Pásame lo que salga en cada uno.
-- ============================================================


-- ---------- BLOQUE 1 · Funciones que tocan la dieta ----------
-- Aquí saldrá quien mueva 'dieta_proxima_id' o 'dieta_actual_id'.
select n.nspname as esquema,
       p.proname as funcion,
       left(p.prosrc, 400) as primeras_lineas
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog','information_schema')
  and (p.prosrc ilike '%dieta_proxima%' or p.prosrc ilike '%dieta_actual%')
order by 1, 2;


-- ---------- BLOQUE 2 · Disparadores de la tabla clientes ----------
-- Un trigger sobre 'clientes' o sobre 'registros' podría estar
-- haciendo el avance cada vez que el cliente manda sus datos.
select c.relname   as tabla,
       t.tgname    as disparador,
       p.proname   as funcion_que_ejecuta
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc  p on p.oid = t.tgfoid
where not t.tgisinternal
  and c.relnamespace = 'public'::regnamespace
order by 1, 2;


-- ---------- BLOQUE 3 · Tareas programadas ----------
-- Si da error diciendo que «cron.job» no existe, perfecto:
-- significa que no hay ninguna tarea programada. Me lo dices igual.
select jobid, schedule, active, left(command, 300) as tarea
from cron.job
order by jobid;
