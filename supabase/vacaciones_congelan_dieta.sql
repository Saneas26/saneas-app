-- ============================================================
-- SANEAS · Las vacaciones congelan la dieta
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Un cliente de vacaciones no debe avanzar de dieta: al volver
-- tiene que retomar exactamente donde lo dejó, sin saltarse
-- ninguna semana. Los clientes «Completo» ya estaban protegidos
-- (saneas_consulta_pasada_completos ya llevaba la guardia); los
-- «Basico» no, porque saneas_avance_diario no la miraba.
--
-- Se toca solo el WHERE de las tareas programadas. La función
-- que avanza de verdad (saneas_avanzar_dieta) NO se toca: así tú
-- sigues pudiendo avanzar la dieta a mano desde el panel cuando
-- quieras, aunque el cliente esté de vacaciones.
--
-- Criterio, el mismo en toda la casa: 'vacaciones_hasta' es el
-- último día de la pausa, incluido. Se vuelve al día siguiente.
-- ============================================================


-- ------------------------------------------------------------
-- 1) EL AVANCE DIARIO (clientes Basico, 8:00)
--    Se le añade la guardia y, de paso, devuelve cuántos se han
--    quedado quietos por vacaciones, para que se vea en el informe.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.saneas_avance_diario()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_dia  text;
  v_hoy  date;
  v_ok   int := 0;
  v_ko   int := 0;
  v_vac  int := 0;
  c      record;
  r      json;
begin
  -- El dia de consulta en la ficha va en minusculas y sin tilde ('miercoles')
  v_hoy := (now() at time zone 'Atlantic/Canary')::date;
  v_dia := case extract(dow from v_hoy)
             when 1 then 'lunes' when 2 then 'martes' when 3 then 'miercoles'
             when 4 then 'jueves' when 5 then 'viernes' when 6 then 'sabado' else 'domingo' end;

  -- Cuantos se quedan quietos hoy por estar de vacaciones
  select count(*) into v_vac
    from public.clientes
   where activo
     and plan = 'Basico'
     and lower(translate(coalesce(dia_consulta,''),'áéíóú','aeiou')) = v_dia
     and vacaciones_hasta is not null
     and vacaciones_hasta >= v_hoy;

  for c in
    select id from public.clientes
    where activo
      and plan = 'Basico'                                   -- solo Basico. Los Completo los supervisa Oscar.
      and (vacaciones_hasta is null or vacaciones_hasta < v_hoy)   -- GUARDIA VACACIONES: de vacaciones, la dieta no avanza
      and lower(translate(coalesce(dia_consulta,''),'áéíóú','aeiou')) = v_dia
  loop
    r := public.saneas_avanzar_dieta(c.id, true);
    if (r->>'ok')::boolean then v_ok := v_ok + 1; else v_ko := v_ko + 1; end if;
  end loop;

  return json_build_object('dia', v_dia, 'avanzaron', v_ok, 'no_pudieron', v_ko,
                           'de_vacaciones', v_vac);
end $function$;


-- ------------------------------------------------------------
-- 2) LA BAJA POR IMPAGO (3:30)
--    Hoy no llega a tocar a nadie de vacaciones, porque la pausa
--    empuja fecha_renovacion al futuro. Aun asi se blinda: nadie
--    de vacaciones recibe el aviso de impago ni se le da de baja.
--    Es la funcion que borra gente; no se deja al azar.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.saneas_baja_impagados()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record;
  v_borrados jsonb := '[]'::jsonb;
  v_avisados jsonb := '[]'::jsonb;
  v_secret text;
  v_url text := 'https://uisrxztowgdpkxeuznfh.supabase.co/functions/v1/enviar-push';
begin
  select (regexp_matches(pg_get_functiondef(oid),
          'secret\s+is\s+distinct\s+from\s+''([^'']+)''','i'))[1]
    into v_secret from pg_proc
   where proname='crear_factura' and pronamespace='public'::regnamespace limit 1;

  for r in select c.id, c.nombre, c.email from public.clientes c
            where c.activo and c.fecha_renovacion = current_date - 4
              and (c.vacaciones_hasta is null or c.vacaciones_hasta < current_date)  -- GUARDIA VACACIONES
  loop
    if v_secret is not null then
      perform net.http_post(v_url,
        jsonb_build_object('secret', v_secret, 'cliente_id', r.id, 'titulo', 'Saneas',
          'cuerpo', 'Hola '||r.nombre||', tu suscripción lleva 4 días caducada, quedan solo 2 días para poder renovarla, no te rindas!!'),
        '{}'::jsonb, jsonb_build_object('Content-Type','application/json'), 5000);
    end if;
    v_avisados := v_avisados || jsonb_build_object('nombre', r.nombre);
  end loop;

  for r in select c.id, c.nombre||' '||coalesce(c.apellido,'') as nombre, c.email, c.fecha_renovacion
             from public.clientes c
            where c.activo and c.fecha_renovacion <= current_date - 6
              and (c.vacaciones_hasta is null or c.vacaciones_hasta < current_date)  -- GUARDIA VACACIONES
  loop
    insert into public.bajas_ejecutadas(email, nombre, renovacion, tenia_cuenta)
    values (r.email, r.nombre||' · inactivo 6 días impago · facturas conservadas', r.fecha_renovacion, true);
    -- delete de auth.users retirado 22/07: impago = inactivo, se conservan datos, registros y facturas
    perform public.saneas_dar_baja(r.id, 'Impago', 'Baja automatica: mas de 6 dias de impago');
    -- (import retirado 17/07)
    v_borrados := v_borrados || jsonb_build_object('nombre', r.nombre, 'vencida', r.fecha_renovacion::text);
  end loop;

  return jsonb_build_object('avisados', v_avisados, 'borrados', v_borrados,
    'push_disponible', v_secret is not null);
end;
$function$;


-- ------------------------------------------------------------
-- 3) EL SELLO «SIN CONSULTA»
--    Hoy esta apagada (jobid 5, active = false), pero se deja ya
--    arreglada: quien esta de vacaciones no pierde la consulta ni
--    se le marca en rojo. Si estaba marcado, se le quita el sello.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.saneas_marcar_sin_consulta()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lunes date; v_hoy date; r record; v_marcadas jsonb := '[]'::jsonb; v_desmarcadas jsonb := '[]'::jsonb;
begin
  v_lunes := (date_trunc('week', (now() at time zone 'Atlantic/Canary'))::date);
  v_hoy   := (now() at time zone 'Atlantic/Canary')::date;

  for r in
    select c.id, c.nombre, c.dia_consulta, c.vacaciones_hasta,
           public.saneas_corte(c.dia_consulta, v_lunes) corte,
           reg.id reg_id, reg.hora_envio, reg.peso, reg.sin_consulta
      from public.clientes c
      left join lateral (
        select * from public.registros x
         where x.cliente_id = c.id and x.fecha >= v_lunes
         order by x.fecha desc limit 1) reg on true
     where c.activo and c.dia_consulta is not null
  loop
    if r.corte is null then continue; end if;

    -- GUARDIA VACACIONES: de vacaciones no se pierde la consulta.
    -- Y si venia marcada de antes, se le quita el sello.
    if r.vacaciones_hasta is not null and r.vacaciones_hasta >= v_hoy then
      if r.sin_consulta then
        update public.registros set sin_consulta = false where id = r.reg_id;
        v_desmarcadas := v_desmarcadas || to_jsonb(r.nombre);
      end if;
      continue;
    end if;

    -- Aun esta en plazo: no se toca. Y si estaba marcada por error, se le quita.
    if now() < r.corte then
      if r.sin_consulta then
        update public.registros set sin_consulta = false where id = r.reg_id;
        v_desmarcadas := v_desmarcadas || to_jsonb(r.nombre);
      end if;
      continue;
    end if;

    -- Paso su corte. Envio a tiempo?
    if r.hora_envio is not null and r.hora_envio <= r.corte then
      if r.sin_consulta then
        update public.registros set sin_consulta = false where id = r.reg_id;
        v_desmarcadas := v_desmarcadas || to_jsonb(r.nombre);
      end if;
      continue;
    end if;

    -- No envio, o envio tarde: pierde la consulta de esta semana.
    if r.reg_id is null then
      insert into public.registros(cliente_id, fecha, semana, sin_consulta)
      values (r.id, v_hoy,
              (select semana from public.clientes where id = r.id), true);
      v_marcadas := v_marcadas || to_jsonb(r.nombre);
    elsif not coalesce(r.sin_consulta,false) then
      update public.registros set sin_consulta = true where id = r.reg_id;
      v_marcadas := v_marcadas || to_jsonb(r.nombre);
    end if;
  end loop;

  return jsonb_build_object('marcadas', v_marcadas, 'desmarcadas', v_desmarcadas,
                            'lunes', v_lunes, 'cuando', now());
end $function$;


-- ------------------------------------------------------------
-- 4) COMPROBACION (solo lee). Quien esta de vacaciones ahora
--    mismo y que se le congela.
-- ------------------------------------------------------------
select nombre, apellido, plan, dia_consulta,
       vacaciones_hasta, fecha_renovacion,
       case when plan = 'Basico' then 'avance diario congelado'
            when plan ilike 'completo%' then 'consulta automatica congelada'
            else 'sin avance automatico' end as efecto
  from public.clientes
 where coalesce(activo, true)
   and vacaciones_hasta is not null
   and vacaciones_hasta >= (now() at time zone 'Atlantic/Canary')::date
 order by vacaciones_hasta, nombre;
