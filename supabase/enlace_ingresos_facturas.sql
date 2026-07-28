-- ============================================================
-- SANEAS · Enlazar la contabilidad con las facturas
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- El problema: saneas_ingresos no tenía columna de enlace con la
-- factura, así que la forma de cobro quedaba anotada SOLO en la
-- factura y el panel avisaba con ⚠️ en cada renovación.
--
-- La buena noticia: el enlace ya existía escondido en 'origen'
-- ("facturas · F260629"). Esto lo saca a una columna propia,
-- rellena las formas de cobro atrasadas y hace que el aviso
-- desaparezca solo (el RPC panel_forma_pago busca justo esta
-- columna: en cuanto exista, la usa sin tocar código).
--
-- El histórico anterior a las facturas NO se toca: solo se
-- rellenan filas que tengan su factura identificada.
-- ============================================================

-- 1. La columna de enlace (el nombre que el panel busca)
alter table public.saneas_ingresos add column if not exists factura text;
create index if not exists saneas_ingresos_factura_idx on public.saneas_ingresos (factura);

-- 2. Rellenarla desde 'origen' ("facturas · F260629" → "F260629")
update public.saneas_ingresos
   set factura = substring(origen from 'F[0-9]{6}')
 where factura is null
   and origen ~ 'F[0-9]{6}';

-- 3. Volcar las formas de cobro que quedaron solo en las facturas
update public.saneas_ingresos i
   set forma_pago = f.forma_pago
  from public.facturas f
 where i.factura = f.numero
   and f.forma_pago is not null
   and i.forma_pago is distinct from f.forma_pago;

-- 4. COMPROBACIÓN · esto es lo que debes mirar
-- 4a. Resumen: cuántos ingresos tienen ya su factura y su forma de cobro
select count(*) filter (where factura is not null)                        as con_factura,
       count(*) filter (where factura is not null and forma_pago is null) as sin_forma_todavia,
       count(*) filter (where factura is not null and forma_pago is not null) as ya_completos
from public.saneas_ingresos;

-- 4b. Facturas desde el 1 de julio que sigan SIN su ingreso enlazado
--     (lo normal es que no salga ninguna fila)
select f.numero, f.fecha_emision, f.cli_nombre, f.total, f.forma_pago
from public.facturas f
where f.fecha_emision >= '2026-07-01'
  and coalesce(f.anulada,false) = false
  and not exists (select 1 from public.saneas_ingresos i where i.factura = f.numero)
order by f.numero;

-- ------------------------------------------------------------
-- OPCIONAL · si tus informes de contabilidad agrupan por la
-- columna antigua 'medio_pago', descomenta esto para que también
-- la lleve (solo en las filas que vienen de una factura):
-- update public.saneas_ingresos
--    set medio_pago = forma_pago
--  where factura is not null and forma_pago is not null and medio_pago is null;
-- ------------------------------------------------------------
