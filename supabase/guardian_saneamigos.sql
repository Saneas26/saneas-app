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
      raise exception '% ya es invitado de otra persona en Saneas y no puede ser utilizado dos veces.',
        coalesce(nullif(trim(new.invitado_nombre),''), 'Esa persona');
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
-- 2. AVISO INSTANTÁNEO EN LA APP
-- La app pregunta ANTES de enviar, para dar el motivo exacto sin
-- depender de cómo la Edge Function traduzca el error.
-- Solo responde sobre el nombre que el cliente acaba de escribir.
-- ============================================================
create or replace function public._norm_nom(t text) returns text
language sql immutable as $$
  select regexp_replace(
    lower(translate(coalesce(t,''),
      'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ',
      'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC')),
    '[^a-z0-9]', '', 'g')
$$;

create or replace function public.saneas_comprobar_invitado(p_nombre text, p_apellido text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  yo uuid := auth.uid();
  c public.clientes%rowtype;
  mis_semanas int;
begin
  if yo is null then
    return jsonb_build_object('ok', false, 'mensaje', 'Vuelve a entrar en tu app e inténtalo otra vez.');
  end if;

  select * into c from public.clientes
   where _norm_nom(nombre) = _norm_nom(p_nombre)
     and _norm_nom(coalesce(apellido,'')) = _norm_nom(p_apellido)
   limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'mensaje',
      'No encontramos a ' || trim(p_nombre || ' ' || p_apellido) ||
      ' entre los clientes de Saneas. Revisa el nombre y el primer apellido.');
  end if;

  if c.id = yo then
    return jsonb_build_object('ok', false, 'mensaje', 'No puedes añadirte a ti mismo como invitado.');
  end if;

  if exists (select 1 from public.invitados i where i.invitado_id = c.id) then
    return jsonb_build_object('ok', false, 'mensaje',
      c.nombre || ' ya es invitado de otra persona en Saneas y no puede ser utilizado dos veces.');
  end if;

  select semana into mis_semanas from public.clientes where id = yo;
  if mis_semanas is not null and c.semana is not null and c.semana > mis_semanas then
    return jsonb_build_object('ok', false, 'mensaje',
      c.nombre || ' lleva más tiempo en Saneas que tú, así que no puede contar como invitado tuyo.');
  end if;

  if exists (select 1 from public.invitados i where i.embajador_id = c.id and i.invitado_id = yo) then
    return jsonb_build_object('ok', false, 'mensaje', c.nombre || ' ya te añadió a ti como invitado.');
  end if;

  return jsonb_build_object('ok', true, 'mensaje', '');
end $$;

revoke all on function public.saneas_comprobar_invitado(text, text) from public, anon;
grant execute on function public.saneas_comprobar_invitado(text, text) to authenticated;

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
