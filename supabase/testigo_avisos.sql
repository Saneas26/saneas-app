-- ============================================================
-- SANEAS · Testigo de dispositivo y avisos (v1.8)
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Qué hace: cada vez que un cliente entra en la app, el acceso
-- guarda además PLATAFORMA (iPhone/Android/Otro), si la lleva
-- INSTALADA (icono en pantalla de inicio) y el permiso de AVISOS
-- (granted/denied/default). El panel lo enseña con dos RPCs.
-- Los accesos antiguos quedan como están (sin esos datos).
-- ============================================================

-- 1. Las columnas del testigo
alter table public.accesos add column if not exists plataforma text;
alter table public.accesos add column if not exists instalada boolean;
alter table public.accesos add column if not exists avisos text;

-- 2. Vista con el ÚLTIMO acceso de cada cliente (detecta sola la
--    columna de fecha de la tabla; si no hubiera, la crea)
do $$
declare col text;
begin
  select column_name into col from information_schema.columns
   where table_schema='public' and table_name='accesos'
     and data_type like 'timestamp%'
   order by ordinal_position limit 1;
  if col is null then
    alter table public.accesos add column creado_en timestamptz not null default now();
    col := 'creado_en';
  end if;
  execute format(
    'create or replace view public._accesos_ult as
       select distinct on (cliente_id) cliente_id, plataforma, instalada, avisos, %I as visto
       from public.accesos order by cliente_id, %I desc', col, col);
end $$;
revoke all on public._accesos_ult from anon, authenticated;

-- 3. RPC del panel: resumen global + lista por cliente
create or replace function public.panel_avisos_resumen()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb; lista jsonb;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select jsonb_build_object(
    'usan_app',  (select count(*) from _accesos_ult),
    'iphone',    (select count(*) from _accesos_ult where plataforma='iPhone'),
    'android',   (select count(*) from _accesos_ult where plataforma='Android'),
    'otro',      (select count(*) from _accesos_ult where plataforma is not null and plataforma not in ('iPhone','Android')),
    'sin_dato',  (select count(*) from _accesos_ult where plataforma is null),
    'instaladas',(select count(*) from _accesos_ult where instalada is true),
    'con_avisos',(select count(distinct cliente_id) from push_subs),
    'sin_avisos',(select count(*) from _accesos_ult u
                   where not exists (select 1 from push_subs p where p.cliente_id=u.cliente_id))
  ) into r;
  select coalesce(jsonb_agg(fila order by push_b, nom), '[]'::jsonb) into lista
  from (
    select jsonb_build_object(
             'id',c.id,'nombre',c.nombre,'apellido',c.apellido,
             'plataforma',u.plataforma,'instalada',u.instalada,'permiso',u.avisos,
             'push', exists(select 1 from push_subs p where p.cliente_id=c.id),
             'visto',u.visto,
             'al_corriente', (c.fecha_renovacion is not null and c.fecha_renovacion >= current_date)) as fila,
           exists(select 1 from push_subs p where p.cliente_id=c.id) as push_b,
           (c.nombre||' '||coalesce(c.apellido,'')) as nom
    from _accesos_ult u
    join clientes c on c.id = u.cliente_id
  ) t;
  return jsonb_build_object('resumen', r, 'clientes', lista);
end $$;
revoke all on function public.panel_avisos_resumen() from public, anon;
grant execute on function public.panel_avisos_resumen() to authenticated;

-- 4. RPC de la ficha: el estado de UN cliente
create or replace function public.panel_avisos_cliente(p_cliente uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select jsonb_build_object(
    'plataforma',u.plataforma,'instalada',u.instalada,'permiso',u.avisos,'visto',u.visto,
    'push', exists(select 1 from push_subs p where p.cliente_id=p_cliente))
  into r from _accesos_ult u where u.cliente_id = p_cliente;
  return coalesce(r, jsonb_build_object('push',
    exists(select 1 from push_subs p where p.cliente_id=p_cliente)));
end $$;
revoke all on function public.panel_avisos_cliente(uuid) from public, anon;
grant execute on function public.panel_avisos_cliente(uuid) to authenticated;

-- Recuerda: probar los RPC desde el editor SQL dice «no autorizado»
-- a propósito (guardia es_admin). Se prueban desde el panel.
