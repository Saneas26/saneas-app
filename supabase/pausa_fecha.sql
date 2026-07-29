-- ============================================================
-- SANEAS · Pausa por vacaciones hasta una FECHA concreta
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- El panel solo ofrecía 2 semanas o 1 mes. Esto añade la pausa
-- hasta el día exacto que diga el cliente, con el mismo efecto
-- que la pausa de siempre: se marca 'vacaciones_hasta' (que la
-- app y el panel ya leen) y la renovación se retrasa los mismos
-- días que dure la pausa, para que no pague lo que no usa.
-- ============================================================

create or replace function public.panel_pausa_fecha(p_cliente_id uuid, p_hasta date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare c public.clientes%rowtype; dias int; nueva date;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  if p_hasta is null then raise exception 'falta la fecha'; end if;

  select * into c from public.clientes where id = p_cliente_id;
  if not found then raise exception 'cliente no encontrado'; end if;

  if p_hasta <= current_date then
    -- Fecha pasada o de hoy: se entiende como quitar la pausa
    update public.clientes set vacaciones_hasta = null where id = p_cliente_id;
    return jsonb_build_object('ok', true, 'quitada', true,
      'fecha_renovacion', c.fecha_renovacion);
  end if;

  dias := p_hasta - current_date;
  nueva := coalesce(c.fecha_renovacion, current_date) + dias;

  update public.clientes
     set vacaciones_hasta = p_hasta,
         fecha_renovacion = nueva
   where id = p_cliente_id;

  return jsonb_build_object('ok', true, 'vacaciones_hasta', p_hasta,
    'dias', dias, 'fecha_renovacion', nueva);
end $$;

revoke all on function public.panel_pausa_fecha(uuid, date) from public, anon;
grant execute on function public.panel_pausa_fecha(uuid, date) to authenticated;
-- Recuerda: probarlo desde el editor SQL dice «no autorizado» a
-- propósito (guardia es_admin). Se usa desde el panel en modo admin.
