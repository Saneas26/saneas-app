-- TELEMETRÍA DEL GRUPO SANEAS · ejecutar una vez en el SQL Editor de Supabase
--
-- Recuento anónimo de todas las apps del grupo: cuántas personas tienen cada
-- app instalada (acceso directo creado), cuántas la abren cada día y de qué
-- país son. No se guarda ningún dato personal: solo un identificador aleatorio
-- que vive en cada móvil, la plataforma y el país.
--
-- Quién puede hacer qué:
--   · Las apps SOLO pueden llamar a telemetria_ping() para apuntarse.
--     No pueden leer nada: las tablas tienen RLS sin políticas.
--   · El resumen (telemetria_resumen) está protegido con es_admin(), igual
--     que panel_ficha_leer: solo lo ve tu panel en modo admin.

create table if not exists telemetria_dispositivos (
  app         text not null,
  dispositivo uuid not null,
  plataforma  text,
  instalada   boolean default false,
  pais        text,
  primera_vez timestamptz default now(),
  ultima_vez  timestamptz default now(),
  primary key (app, dispositivo)
);

create table if not exists telemetria_aperturas (
  app         text not null,
  dispositivo uuid not null,
  dia         date not null,
  instalada   boolean,
  pais        text,
  primary key (app, dispositivo, dia)
);

create index if not exists telemetria_aperturas_dia on telemetria_aperturas (app, dia);

-- RLS sin políticas: nadie llega a las tablas por la API. Solo se entra por
-- las dos funciones de abajo, que son security definer.
alter table telemetria_dispositivos enable row level security;
alter table telemetria_aperturas   enable row level security;

-- ============================================================
-- 1) El aviso que manda cada app (a través de /api/ping, que le añade el país)
-- ============================================================
create or replace function public.telemetria_ping(
  p_app         text,
  p_dispositivo uuid,
  p_plataforma  text default null,
  p_instalada   boolean default false,
  p_pais        text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_app is null or p_app not in ('pordondevoy','saneas','saneas_web','saneas_instalar','activala','laora','acumula') then
    raise exception 'app no válida';
  end if;
  if p_dispositivo is null then
    raise exception 'falta el dispositivo';
  end if;

  insert into telemetria_dispositivos as d (app, dispositivo, plataforma, instalada, pais, ultima_vez)
  values (p_app, p_dispositivo,
          coalesce(nullif(p_plataforma,''), 'Otro'),
          coalesce(p_instalada, false),
          nullif(p_pais,''), now())
  on conflict (app, dispositivo) do update set
    plataforma = excluded.plataforma,
    instalada  = excluded.instalada,
    pais       = coalesce(excluded.pais, d.pais),   -- si hoy no hay país, se conserva el que había
    ultima_vez = now();

  insert into telemetria_aperturas (app, dispositivo, dia, instalada, pais)
  values (p_app, p_dispositivo, current_date, coalesce(p_instalada,false), nullif(p_pais,''))
  on conflict (app, dispositivo, dia) do update set
    instalada = excluded.instalada;
end;
$$;

-- Las apps entran con la clave pública (anon); no pueden hacer nada más.
revoke execute on function public.telemetria_ping(text,uuid,text,boolean,text) from public;
grant  execute on function public.telemetria_ping(text,uuid,text,boolean,text) to anon, authenticated;

-- ============================================================
-- 2) El resumen que ve el panel · SOLO admin
-- ============================================================
create or replace function public.telemetria_resumen()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v jsonb;
begin
  -- coalesce a propósito: si es_admin() devolviera null, «if not null» no se
  -- cumple y el guardia se saltaría en silencio. Ante la duda, se deniega.
  if not coalesce(es_admin(), false) then
    raise exception 'no autorizado';
  end if;

  select jsonb_build_object(
    'actualizado', now(),
    'apps', coalesce((
      select jsonb_object_agg(app, datos) from (
        select d.app, jsonb_build_object(
          'dispositivos', count(*),
          'instaladas',   count(*) filter (where d.instalada),
          'navegador',    count(*) filter (where not d.instalada),
          'iphone',       count(*) filter (where d.plataforma = 'iPhone'),
          'android',      count(*) filter (where d.plataforma = 'Android'),
          'nuevos_7d',    count(*) filter (where d.primera_vez >= now() - interval '7 days'),
          'activos_hoy',  (select count(*) from telemetria_aperturas a
                            where a.app = d.app and a.dia = current_date),
          'paises', coalesce((select jsonb_object_agg(pais, n) from (
                       select coalesce(p.pais,'??') as pais, count(*) as n
                       from telemetria_dispositivos p where p.app = d.app
                       group by 1) t), '{}'::jsonb),
          'activos_por_dia', coalesce((select jsonb_object_agg(dia, n) from (
                                select a.dia::text as dia, count(*) as n
                                from telemetria_aperturas a
                                where a.app = d.app and a.dia >= current_date - 30
                                group by 1) t), '{}'::jsonb)
        ) as datos
        from telemetria_dispositivos d
        group by d.app
      ) x
    ), '{}'::jsonb)
  ) into v;

  return v;
end;
$$;

-- Nadie salvo el panel en modo admin (el guardia es_admin() de dentro manda)
revoke execute on function public.telemetria_resumen() from public, anon;
grant  execute on function public.telemetria_resumen() to authenticated;
