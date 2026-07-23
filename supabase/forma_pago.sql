-- ============================================================
-- SANEAS · Forma de cobro en facturas y contabilidad
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Regla de Oscar: el histórico hasta el 30/06 NO se toca.
-- Esto solo añade la columna (vacía en lo viejo) y el mecanismo
-- para lo nuevo + el repaso desde el 14/07.
-- ============================================================

-- 1. La columna, en ambas mesas (si ya existe, no hace nada)
alter table public.facturas add column if not exists forma_pago text;
alter table public.saneas_ingresos add column if not exists forma_pago text;

-- 2. RPC que anota la forma de cobro en la factura y en la contabilidad.
--    La llama el panel justo después de emitir la factura al renovar.
--    Para la contabilidad detecta solo cómo se llama el enlace con la
--    factura (factura / numero_factura / factura_numero); si no hay
--    ninguno, deja la factura anotada y lo dice en la respuesta.
create or replace function public.panel_forma_pago(p_numero text, p_forma text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_fac int := 0;
  n_ing int := 0;
  col text;
begin
  if not es_admin() then
    raise exception 'no autorizado';
  end if;
  if p_numero is null or trim(p_numero) = '' or p_forma is null or trim(p_forma) = '' then
    raise exception 'faltan datos';
  end if;

  update public.facturas set forma_pago = p_forma where numero = p_numero;
  get diagnostics n_fac = row_count;

  select column_name into col
  from information_schema.columns
  where table_schema='public' and table_name='saneas_ingresos'
    and column_name in ('factura','numero_factura','factura_numero')
  limit 1;

  if col is not null then
    execute format('update public.saneas_ingresos set forma_pago = %L where %I = %L', p_forma, col, p_numero);
    get diagnostics n_ing = row_count;
  end if;

  return jsonb_build_object('ok', n_fac > 0, 'facturas', n_fac, 'ingresos', n_ing,
    'aviso', case when col is null then 'saneas_ingresos no tiene columna de enlace con la factura: anotado solo en facturas' else null end);
end $$;

revoke all on function public.panel_forma_pago(text, text) from public, anon;
grant execute on function public.panel_forma_pago(text, text) to authenticated;
-- Recuerda: probarlo desde el editor SQL dice «no autorizado» a propósito
-- (guardia es_admin). Se prueba desde el panel en modo admin.

-- ============================================================
-- 3. REPASO desde el 14/07 · primero MIRA, luego RELLENA
-- ============================================================

-- 3a. Lista de facturas desde el 14/07 (para saber qué toca anotar):
select f.numero, f.fecha_emision, f.total, f.concepto, f.forma_pago
from public.facturas f
where f.fecha_emision >= '2026-07-14' and coalesce(f.anulada,false) = false
order by f.fecha_emision, f.numero;

-- 3b. Y si quieres ver cómo se llaman las columnas de la contabilidad:
-- select column_name from information_schema.columns
-- where table_schema='public' and table_name='saneas_ingresos' order by ordinal_position;

-- 3c. Plantilla de relleno: copia una línea por factura, pon su forma y
--     ejecútalas juntas. Actualiza factura Y contabilidad a la vez
--     usando el mismo mecanismo del RPC (aquí sin guardia: el editor
--     SQL ya es tuyo). Formas: 'Bizum 1' · 'Bizum 2' · 'PayPal' ·
--     'Transferencia' · 'Revolut' · 'Tarjeta' · 'Efectivo' · 'Otro'
--
-- do $$ begin
--   perform _forma('F260601','Bizum 1');
--   perform _forma('F260602','PayPal');
--   perform _forma('F260603','Transferencia');
-- end $$;
--
-- Antes de usar la plantilla, crea una vez este ayudante local:
create or replace function public._forma(p_numero text, p_forma text)
returns void language plpgsql as $$
declare col text;
begin
  update public.facturas set forma_pago = p_forma where numero = p_numero;
  select column_name into col from information_schema.columns
  where table_schema='public' and table_name='saneas_ingresos'
    and column_name in ('factura','numero_factura','factura_numero') limit 1;
  if col is not null then
    execute format('update public.saneas_ingresos set forma_pago = %L where %I = %L', p_forma, col, p_numero);
  end if;
end $$;
revoke all on function public._forma(text, text) from public, anon, authenticated;
