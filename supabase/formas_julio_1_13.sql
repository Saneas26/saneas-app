-- ============================================================
-- SANEAS · Formas de cobro del 1 al 13 de julio
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Completa los cobros anteriores al repaso del 14/07, que se
-- quedaron sin forma de pago. Ahora que saneas_ingresos tiene su
-- columna 'factura' (ver enlace_ingresos_facturas.sql), una sola
-- pasada deja anotadas la CONTABILIDAD y la FACTURA.
--
-- Seguridad: solo toca filas con forma_pago vacía, con fecha de
-- pago entre el 1 y el 14 de julio, y cuyo nombre case. Lo que
-- no case NO se toca y sale listado al final.
-- ============================================================

-- Comparador de nombres a prueba de tildes, mayúsculas y espacios
-- («Macarena delaVega» = «Macarena de la Vega»)
create or replace function public._norm_nom(t text) returns text
language sql immutable as $$
  select regexp_replace(
    lower(translate(coalesce(t,''),
      'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ',
      'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC')),
    '[^a-z0-9]', '', 'g')
$$;

-- 1. La contabilidad
with datos(nombre, forma) as (values
  ('MCarmen Jimenez','Bizum 1'),   ('Julia Friera','Bizum 1'),
  ('Meryan Raffo','Bizum 1'),      ('Cati Escribano','Bizum 1'),
  ('Laura Gonzalez','Bizum 1'),    ('Maripaz Juzgado','Bizum 1'),
  ('Eva Camacho','Bizum 1'),       ('Belen Peinado','Bizum 2'),
  ('Angel Palencia','Bizum 1'),    ('Raquel Cuadra','Bizum 1'),
  ('Macarena delaVega','PayPal'),  ('Ruben Martinez','Bizum 1'),
  ('Patricia Luna','Bizum 1'),     ('Laura Sarmiento','Bizum 1'),
  ('Mcarmen Alba','Bizum 1'),      ('Yolanda Colomer','Bizum 1'),
  ('Rocio Mena','Bizum 1'),        ('Gema Sierra','Bizum 1'),
  ('Nuria Valentin','Bizum 1'),    ('Rebeca Anton','Bizum 1'),
  ('Ruben Infante','Bizum 1'),     ('Marimar Garcia','Bizum 2'),
  ('Rian Garcia','Bizum 1'),       ('Isabel Cerda','Bizum 1'),
  ('Eusebio Villalba','Bizum 2'),  ('Adrian Rodrigues','Bizum 1'),
  ('Maribel Fernandez','Bizum 2'), ('Angeles Morgado','Bizum 1'),
  ('Crizologa Marrero','Bizum 1'), ('Silvia Lima','Bizum 1'),
  ('Aitana Gomez','Bizum 1'),      ('Luisa Navarro','Bizum 1'),
  ('Mayte Antolin','Bizum 1'),     ('Eva Delgado','Bizum 1'),
  ('Mina Torrents','Bizum 1'),     ('Ana Roman','Bizum 1'),
  ('Javier Blazquez','Bizum 1'),   ('Paula Morales','Bizum 2'),
  ('Belen Garcia','Bizum 1'),      ('Jesus Bejar','Transferencia'),
  ('David Blazquez','Bizum 1'),    ('Esther Rodriguez','Bizum 1'),
  ('Patricia Chacon','Bizum 1'),   ('Eduardo Rodriguez','Bizum 1'),
  ('Cristina Alonso','Bizum 1'),   ('Ana Olivera','Bizum 1'),
  ('Diego Alia','Bizum 1'),        ('Daniela Sanchez','Bizum 1'),
  ('Natalia Liron','Bizum 1'),     ('Ana Rozas','Bizum 1'),
  ('Guillermo Lopez','Transferencia'), ('Mercedes Tortosa','Bizum 1')
)
update public.saneas_ingresos i
   set forma_pago = d.forma
  from datos d
 where public._norm_nom(i.nombre) = public._norm_nom(d.nombre)
   and i.fecha_pago between '2026-07-01' and '2026-07-14'
   and i.forma_pago is null;

-- 2. Y de la contabilidad a su factura, por el enlace
update public.facturas f
   set forma_pago = i.forma_pago
  from public.saneas_ingresos i
 where i.factura = f.numero
   and i.forma_pago is not null
   and f.forma_pago is null;

-- ============================================================
-- 3. COMPROBACIÓN
-- ============================================================
-- 3a. Cómo queda el conjunto
select count(*) filter (where factura is not null)                          as con_factura,
       count(*) filter (where factura is not null and forma_pago is null)   as sin_forma_todavia,
       count(*) filter (where factura is not null and forma_pago is not null) as ya_completos
from public.saneas_ingresos;

-- 3b. Lo que NO se pudo casar por el nombre (revisar a mano si sale algo)
select i.id, i.fecha_pago, i.nombre, i.importe, i.factura
from public.saneas_ingresos i
where i.forma_pago is null
  and i.fecha_pago between '2026-07-01' and '2026-07-14'
order by i.fecha_pago, i.nombre;

-- 3c. Reparto de cobros de julio, para cuadrar con tu hoja
select forma_pago, count(*) as cobros, sum(importe) as total
from public.saneas_ingresos
where fecha_pago >= '2026-07-01' and forma_pago is not null
group by forma_pago order by cobros desc;
