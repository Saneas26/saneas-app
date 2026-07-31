-- ============================================================================
-- SANEAS · El gráfico de peso, visible para el cliente solo si Óscar lo abre
-- ----------------------------------------------------------------------------
-- El gráfico de las últimas 10 semanas ya existe en el panel (ficha del
-- cliente). Este interruptor lo replica en la app del cliente, por encima de
-- "El mapa de tu viaje", PERO solo cuando Óscar pulsa el botón de su panel.
-- Por defecto NADIE lo ve: la columna nace en false para todo el mundo.
-- ============================================================================

alter table public.clientes
  add column if not exists grafico_peso_visible boolean not null default false;

comment on column public.clientes.grafico_peso_visible is
  'Si es true, la app del cliente le muestra su gráfico de peso de las últimas 10 semanas. Lo enciende Óscar desde la ficha del panel; por defecto false.';

-- Leer y cambiar el interruptor desde el panel.
-- p_visible = null  →  solo consulta (para pintar el botón al abrir la ficha).
-- Mismo guardián que panel_sin_consulta: secreto de sync o sesión de admin.
create or replace function public.panel_grafico_peso(
  p_cliente_id text,
  p_visible    boolean default null,
  secret       text    default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_hay boolean;
  v_vis boolean;
begin
  if secret is distinct from 'SANEAS_SYNC_2026' and not public.es_admin() then
    raise exception 'secret';
  end if;

  select true, c.grafico_peso_visible
    into v_hay, v_vis
    from public.clientes c
   where c.id::text = p_cliente_id;

  if not coalesce(v_hay, false) then
    return jsonb_build_object('ok', false, 'error', 'Cliente no encontrado');
  end if;

  if p_visible is not null and p_visible is distinct from v_vis then
    update public.clientes
       set grafico_peso_visible = p_visible
     where id::text = p_cliente_id;
    v_vis := p_visible;
  end if;

  return jsonb_build_object('ok', true, 'visible', v_vis);
end;
$function$;

grant execute on function public.panel_grafico_peso(text, boolean, text) to anon, authenticated;
