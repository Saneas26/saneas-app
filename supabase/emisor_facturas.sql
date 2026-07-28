-- ============================================================
-- SANEAS · Los datos del emisor en la factura del cliente
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- El problema: la app leía public.config directamente para poner
-- el nombre fiscal, el NIF y la dirección en el PDF de la factura.
-- Con RLS activo y sin políticas esa lectura no devuelve nada, así
-- que las facturas salían SIN datos de emisor (y así no son válidas).
--
-- La solución: un RPC que devuelve SOLO los campos 'emisor*'. La
-- tabla config sigue cerrada — lo demás que haya dentro (ajustes,
-- claves, lo que sea) no sale de ahí.
-- ============================================================

create or replace function public.saneas_emisor()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare fila jsonb; salida jsonb := '{}'::jsonb; clave text;
begin
  select to_jsonb(c) into fila from public.config c limit 1;
  if fila is null then return '{}'::jsonb; end if;
  -- solo lo que empieza por 'emisor': nada más cruza la puerta
  for clave in select jsonb_object_keys(fila) loop
    if clave like 'emisor%' then
      salida := salida || jsonb_build_object(clave, fila->clave);
    end if;
  end loop;
  return salida;
end $$;

revoke all on function public.saneas_emisor() from public, anon;
grant execute on function public.saneas_emisor() to authenticated;

-- Comprobación: debe devolver tus datos fiscales y NADA más
select public.saneas_emisor();
