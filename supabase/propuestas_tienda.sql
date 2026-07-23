-- ============================================================
-- SANEAS · Propuestas de artículos para la tienda (v1.5)
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- Qué hace: los clientes proponen artículos nuevos desde su app
-- (nombre, supermercado y precio obligatorios; imagen y web
-- opcionales). Se guardan AQUÍ, no en CAT_Tienda: el catálogo
-- no se toca hasta que Oscar apruebe y lo añada él mismo.
-- Cada propuesta dispara un aviso al correo (ver paso 2 abajo).
-- ============================================================

create table if not exists public.productos_propuestas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nombre text,                       -- foto del nombre al proponer (para el aviso)
  nombre text not null,
  supermercado text not null,
  precio numeric not null check (precio > 0),
  imagen_url text,
  url_compra text,
  estado text not null default 'pendiente',  -- pendiente · aprobada · descartada (lo cambias tú)
  creado_en timestamptz not null default now()
);

alter table public.productos_propuestas enable row level security;

-- El cliente SOLO puede insertar su propia propuesta. Ni leer, ni
-- tocar las de nadie (mismo patrón que el diario y los candidatos).
drop policy if exists propuestas_insert on public.productos_propuestas;
create policy propuestas_insert on public.productos_propuestas
  for insert to authenticated with check (cliente_id = auth.uid());

grant insert on public.productos_propuestas to authenticated;

-- ============================================================
-- 2. AVISO POR CORREO · pasos en el panel de Supabase (una vez)
-- ============================================================
-- a) Edge Functions → Deploy new function → nombre: avisar-propuesta
--    → pega el contenido de supabase/avisar-propuesta.ts → Deploy.
--    (En la función, desactiva «Enforce JWT verification»: la llama
--    el webhook interno, no un navegador.)
-- b) Secretos: reutiliza los que ya tienes del formulario de
--    asesores — CANDIDATOS_EMAIL (tu correo, invisible para todos)
--    y RESEND_API_KEY. Si ya existen, no hay que crear nada.
-- c) Database → Webhooks → Create a new hook:
--    · Name: avisar_propuesta
--    · Table: public.productos_propuestas · Events: INSERT
--    · Type: Supabase Edge Functions → avisar-propuesta
-- Con eso, cada propuesta nueva te llega sola al correo.
--
-- Para ver lo pendiente cuando quieras:
-- select creado_en, cliente_nombre, nombre, supermercado, precio,
--        imagen_url, url_compra
-- from public.productos_propuestas
-- where estado = 'pendiente' order by creado_en desc;
