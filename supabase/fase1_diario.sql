-- ============================================================
-- SANEAS · Diario de comidas · FASE 1
-- Pegar entero en Supabase → SQL Editor → Run. Es idempotente:
-- se puede ejecutar dos veces sin romper nada.
--
-- IMPORTANTE: NO crea una biblioteca paralela. La tabla `alimentos`
-- es la capa NUTRICIONAL de la biblioteca que ya existe (CAT_Tienda,
-- tabla `productos`): cada producto de la tienda que se enriquezca
-- con nutrición apunta a su fila de `productos` vía `producto_id`.
-- Los genéricos (BEDCA / curados) van sin producto_id.
-- ============================================================

-- Búsqueda difusa por nombre (índice trigram)
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- 1. Capa nutricional de la biblioteca (compartida)
--    Valores SIEMPRE por 100 g. origen: 'saneas' (curado por Oscar),
--    'bedca' (base oficial española), 'off' (Open Food Facts),
--    'tienda' (producto CAT_Tienda enriquecido con nutrición).
-- ------------------------------------------------------------
create table if not exists public.alimentos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  marca         text,
  origen        text not null default 'saneas' check (origen in ('saneas','bedca','off','tienda')),
  producto_id   uuid references public.productos(id) on delete set null,  -- enlace al CAT_Tienda
  codigo_barras text,
  kcal_100      numeric not null check (kcal_100 >= 0),
  prot_100      numeric not null default 0 check (prot_100 >= 0),
  hc_100        numeric not null default 0 check (hc_100 >= 0),
  grasa_100     numeric not null default 0 check (grasa_100 >= 0),
  fibra_100     numeric,
  categoria     text,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create index if not exists alimentos_nombre_trgm
  on public.alimentos using gin (nombre gin_trgm_ops);
-- un código de barras solo puede existir una vez (los genéricos no llevan)
create unique index if not exists alimentos_barras_unicas
  on public.alimentos (codigo_barras) where codigo_barras is not null;
-- un producto de la tienda solo puede tener UNA ficha nutricional
create unique index if not exists alimentos_producto_unico
  on public.alimentos (producto_id) where producto_id is not null;

alter table public.alimentos enable row level security;

-- Lectura para cualquier clienta con sesión; escritura solo desde el panel/SQL
-- (sin política de insert/update para authenticated = denegado por defecto)
drop policy if exists alimentos_lectura on public.alimentos;
create policy alimentos_lectura on public.alimentos
  for select to authenticated using (activo);

-- ------------------------------------------------------------
-- 2. Diario de la clienta
--    Guarda una FOTO de los valores en el momento de apuntar
--    (nombre, kcal, macros): si un alimento se corrige después,
--    el histórico no cambia. alimento_id puede ser null: entrada
--    apuntada A MANO por la clienta con un nombre genérico.
-- ------------------------------------------------------------
create table if not exists public.diario_comidas (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes(id) on delete cascade,
  fecha       date not null,
  toma        text not null default 'Otra',
  alimento_id uuid references public.alimentos(id) on delete set null,
  nombre      text not null,
  gramos      numeric not null check (gramos > 0 and gramos <= 3000),
  kcal        numeric not null check (kcal >= 0),
  prot        numeric not null default 0,
  hc          numeric not null default 0,
  grasa       numeric not null default 0,
  creado_en   timestamptz not null default now()
);

create index if not exists diario_cliente_fecha
  on public.diario_comidas (cliente_id, fecha);

alter table public.diario_comidas enable row level security;

-- Cada clienta ve y toca SOLO lo suyo
drop policy if exists diario_select on public.diario_comidas;
create policy diario_select on public.diario_comidas
  for select to authenticated using (cliente_id = auth.uid());
drop policy if exists diario_insert on public.diario_comidas;
create policy diario_insert on public.diario_comidas
  for insert to authenticated with check (cliente_id = auth.uid());
drop policy if exists diario_delete on public.diario_comidas;
create policy diario_delete on public.diario_comidas
  for delete to authenticated using (cliente_id = auth.uid());
-- (sin update a propósito: se borra y se vuelve a añadir; menos superficie)
