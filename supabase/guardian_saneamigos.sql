-- ============================================================
-- SANEAS · Guardián de Saneamigos
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Vigila TODA invitación nueva, venga de la app, del panel o de
-- donde sea. Cuatro reglas:
--   1. Nadie se añade a sí mismo.
--   2. Un cliente solo puede ser invitado de UNA persona.
--   3. El invitado no puede llevar MÁS tiempo en Saneas que
--      quien lo añade (se mide por 'semana', no por fecha_alta:
--      la fecha de alta es la del volcado a la app, no la de
--      entrada real en consulta).
--   4. No se puede invitar a quien ya te invitó a ti.
--
-- Lo que ya existe NO se toca: el guardián solo mira lo nuevo.
-- ============================================================

create or replace function public.invitados_guardian()
returns trigger
language plpgsql
as $$
declare
  s_emb int; s_inv int; otro text;
begin
  -- 1. Añadirse a uno mismo
  if new.invitado_id is not null and new.invitado_id = new.embajador_id then
    raise exception 'No puedes añadirte a ti mismo como invitado.';
  end if;

  if new.invitado_id is not null then
    -- 2. Ya lo tiene otra persona
    select coalesce(e.nombre,'') into otro
      from public.invitados i
      join public.clientes e on e.id = i.embajador_id
     where i.invitado_id = new.invitado_id
       and i.id is distinct from new.id
     limit 1;
    if otro is not null then
      raise exception 'Este invitado ya ha sido utilizado por otra persona en Saneas.';
    end if;

    -- 3. Antigüedad: el invitado no puede llevar más tiempo
    select semana into s_emb from public.clientes where id = new.embajador_id;
    select semana into s_inv from public.clientes where id = new.invitado_id;
    if s_emb is not null and s_inv is not null and s_inv > s_emb then
      raise exception 'No puedes añadir a alguien que lleva más tiempo en Saneas que tú.';
    end if;

    -- 4. Círculos
    if exists (select 1 from public.invitados i
                where i.embajador_id = new.invitado_id
                  and i.invitado_id = new.embajador_id) then
      raise exception 'Esa persona ya te añadió a ti como invitado.';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists invitados_guardian on public.invitados;
create trigger invitados_guardian
  before insert or update on public.invitados
  for each row execute function public.invitados_guardian();

-- ============================================================
-- COMPROBACIÓN · el guardián en acción
-- Esto debe decir «no autorizado» a propósito en los tres casos.
-- (Se prueba desde la app añadiendo un invitado repetido.)
-- ============================================================
-- Estado actual: invitados repetidos, si queda alguno
select c.nombre || ' ' || coalesce(c.apellido,'') as invitado_repetido,
       count(*) as veces,
       string_agg(e.nombre || ' ' || coalesce(e.apellido,''), ' · ') as embajadores
from public.invitados i
join public.clientes e on e.id = i.embajador_id
left join public.clientes c on c.id = i.invitado_id
group by c.nombre, c.apellido
having count(*) > 1;
