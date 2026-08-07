-- estadisticas_uso — informe de uso de la app bajo demanda (botón "Estadísticas de uso" del panel).
-- NUNCA se llama automática ni programada: solo cuando Óscar pulsa el botón.
-- Lee eventos_uso (instrumentación en index.html/js/*.js vía trackEvento), saneas_frases (Tu legado),
-- clientes.descuento_invitados (Saneamigos, mismo dato que ya usa abrirInvitar() en la app),
-- pruebas_gratis (semanas gratis de vuelvo.html) y telemetria_* (embudo de instalación).
-- SECURITY DEFINER + secret (mismo patrón que crear_factura / panel_fijar_cita).
-- v2 (07/08/2026): añade pruebas_gratis y embudo_instalacion.

create or replace function public.estadisticas_uso(secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_por_evento jsonb;
  v_detalle jsonb;
  v_legado_total int;
  v_legado_resp jsonb;
  v_saneamigos_total int;
  v_saneamigos_lista jsonb;
  v_pg_total int;
  v_pg_activas int;
  v_pg_lista jsonb;
  v_embudo jsonb;
begin
  if secret is distinct from 'SANEAS_SYNC_2026' then
    return jsonb_build_object('ok', false, 'error', 'no autorizado');
  end if;

  -- por_evento: totales y clientes únicos por tipo de evento
  select coalesce(jsonb_agg(x order by x.total desc), '[]'::jsonb) into v_por_evento
  from (
    select evento, count(*)::int as total, count(distinct cliente_id)::int as clientes_unicos
    from eventos_uso
    group by evento
  ) x;

  -- detalle_por_evento: desglose de los eventos con clave de detalle conocida
  select coalesce(jsonb_agg(y order by y.evento, y.total desc), '[]'::jsonb) into v_detalle
  from (
    select evento,
           clave_detalle,
           (detalle ->> clave_detalle) as valor,
           count(*)::int as total,
           count(distinct cliente_id)::int as clientes_unicos
    from (
      select cliente_id, evento, detalle,
             case evento
               when 'pizarra_click' then 'opcion'
               when 'grupo_icono_click' then 'marca'
               when 'mas_tab_click' then 'tab'
               when 'gym_modo' then 'modo'
               when 'compartir_progreso_accion' then 'accion'
             end as clave_detalle
      from eventos_uso
      where evento in ('pizarra_click','grupo_icono_click','mas_tab_click','gym_modo','compartir_progreso_accion')
    ) e
    where clave_detalle is not null and (detalle ->> clave_detalle) is not null
    group by evento, clave_detalle, (detalle ->> clave_detalle)
  ) y;

  -- legado: respuestas de "Tu legado" (saneas_frases)
  select count(*)::int into v_legado_total from saneas_frases where nullif(trim(texto), '') is not null;

  select coalesce(jsonb_agg(z order by z.created_at desc), '[]'::jsonb) into v_legado_resp
  from (
    select c.nombre, c.apellido, f.texto, f.semanas, f.creado_en as created_at
    from saneas_frases f
    join clientes c on c.id = f.cliente_id
    where nullif(trim(f.texto), '') is not null
  ) z;

  -- saneamigos: clientes con descuento activo por invitados (mismo dato que usa la app en abrirInvitar())
  select count(*)::int into v_saneamigos_total
  from clientes where coalesce(descuento_invitados, 0) > 0;

  select coalesce(jsonb_agg(w order by w.num_invitados desc), '[]'::jsonb) into v_saneamigos_lista
  from (
    select nombre, apellido, round(descuento_invitados / 10)::int as num_invitados
    from clientes
    where coalesce(descuento_invitados, 0) > 0
  ) w;

  -- pruebas_gratis: semanas gratis activadas desde vuelvo.html
  select count(*)::int into v_pg_total from pruebas_gratis;

  select count(*)::int into v_pg_activas from pruebas_gratis where fecha_fin >= current_date;

  select coalesce(jsonb_agg(p order by p.created_at desc), '[]'::jsonb) into v_pg_lista
  from (
    select nombre, email, tel9, fecha_inicio, fecha_fin, created_at
    from pruebas_gratis
  ) p;

  -- embudo_instalacion: visitas a saneas.es → clic en "instalar" → app instalada (telemetría)
  v_embudo := jsonb_build_object(
    'visitas_web',       (select count(distinct dispositivo) from telemetria_aperturas where app = 'saneas_web'),
    'pulsaron_instalar', (select count(distinct dispositivo) from telemetria_aperturas where app = 'saneas_instalar'),
    'instalada',         (select count(*) from telemetria_dispositivos where app = 'saneas' and instalada)
  );

  return jsonb_build_object(
    'ok', true,
    'por_evento', v_por_evento,
    'detalle_por_evento', v_detalle,
    'legado', jsonb_build_object('total_rellenado', v_legado_total, 'respuestas', v_legado_resp),
    'saneamigos', jsonb_build_object('total', v_saneamigos_total, 'clientes', v_saneamigos_lista),
    'pruebas_gratis', jsonb_build_object('total', v_pg_total, 'activas_ahora', v_pg_activas, 'lista', v_pg_lista),
    'embudo_instalacion', v_embudo
  );
end;
$$;

grant execute on function public.estadisticas_uso(text) to anon, authenticated;
