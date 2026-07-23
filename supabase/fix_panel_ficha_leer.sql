-- ============================================================
-- SANEAS · Corrección de panel_ficha_leer
-- Síntoma en el panel: «No se pudo cargar: column c.sexo does not exist»
-- Causa: el RPC pedía c.sexo, pero en `clientes` la columna real es `genero`.
-- La clave del JSON se mantiene como 'sexo' (el contrato del traspaso no
-- cambia); solo se corrige de dónde se lee.
-- Pegar entero en Supabase → SQL Editor → Run.
-- Recuerda: probarlo desde el editor SQL FALLA con «no autorizado» a
-- propósito (guardia es_admin()). Se prueba desde el panel en modo admin.
-- ============================================================

create or replace function public.panel_ficha_leer(p_cliente_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not es_admin() then
    raise exception 'no autorizado';
  end if;
  select jsonb_build_object(
    'cliente', jsonb_build_object(
      'nombre',           c.nombre,
      'apellido',         c.apellido,
      'dni',              c.dni,
      'fecha_nacimiento', c.fecha_nacimiento,
      'sexo',             c.genero,      -- ← la corrección: columna real `genero`
      'altura',           c.altura,
      'peso_inicial',     c.peso_inicial,
      'plan',             c.plan
    ),
    'ficha', case when f.cliente_id is null then null else to_jsonb(f) end
  ) into v
  from public.clientes c
  left join public.saneas_ficha_entrada f on f.cliente_id = c.id
  where c.id = p_cliente_id;

  if v is null then
    raise exception 'cliente no encontrado';
  end if;
  return v;
end $$;

revoke all on function public.panel_ficha_leer(uuid) from public, anon;
grant execute on function public.panel_ficha_leer(uuid) to authenticated;
