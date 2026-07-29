-- ============================================================
-- SANEAS · Mina Torrents de vacaciones hasta el 6/09/2026
-- Pegar en Supabase → SQL Editor. Mira primero, luego aplica.
-- ============================================================

-- 1. MIRA cómo está ahora
select id, nombre, apellido, semana, fecha_renovacion, vacaciones_hasta,
       ('2026-09-06'::date - current_date) as dias_de_pausa
from public.clientes
where nombre ilike 'mina%' and apellido ilike 'torrents%';

-- 2. APLICA la pausa: se marca la vacación (la app y el panel lo leen
--    solos) y la renovación se retrasa los mismos días que la pausa.
update public.clientes
   set vacaciones_hasta = '2026-09-06',
       fecha_renovacion = coalesce(fecha_renovacion, current_date)
                          + ('2026-09-06'::date - current_date)
 where nombre ilike 'mina%' and apellido ilike 'torrents%'
   and vacaciones_hasta is distinct from '2026-09-06'::date;

-- 3. COMPRUEBA cómo queda
select nombre, apellido, fecha_renovacion, vacaciones_hasta
from public.clientes
where nombre ilike 'mina%' and apellido ilike 'torrents%';
