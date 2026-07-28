-- ============================================================
-- SANEAS · Corregir la invitación duplicada de Diana Montero
-- SOLO ejecutar si Oscar da el visto bueno: toca el descuento
-- de una clienta real.
--
-- Diana Montero figura como invitada de DOS clientas:
--   · Mar Curbelo (semana 37) — 25 semanas de ventaja: se queda
--   · Isabel Palomares (semana 12) — misma antigüedad que Diana
--     y duplicada: se retira
-- Al retirarla, el descuento de Isabel se recalcula solo.
-- ============================================================

-- 1. MIRA lo que se va a borrar (una sola fila)
select i.id, e.nombre as embajador, e.semana as sem_embajador,
       i.invitado_nombre, c.semana as sem_invitado
from public.invitados i
join public.clientes e on e.id = i.embajador_id
left join public.clientes c on c.id = i.invitado_id
where e.nombre ilike 'isabel%' and e.apellido ilike 'palomares%'
  and i.invitado_nombre ilike 'diana%';

-- 2. BORRA la duplicada
delete from public.invitados i
using public.clientes e
where i.embajador_id = e.id
  and e.nombre ilike 'isabel%' and e.apellido ilike 'palomares%'
  and i.invitado_nombre ilike 'diana%';

-- 3. Recalcula el descuento de Isabel (10 € por invitado válido)
update public.clientes c
   set descuento_invitados = 10 * (select count(*) from public.invitados i where i.embajador_id = c.id)
 where c.nombre ilike 'isabel%' and c.apellido ilike 'palomares%';

-- 4. Comprueba cómo queda
select nombre, apellido, semana, descuento_invitados
from public.clientes
where nombre ilike 'isabel%' and apellido ilike 'palomares%';
