-- ============================================================
-- SANEAS · Ver y borrar reportes de voz desde el panel
-- Pegar entero en Supabase → SQL Editor → Run. Idempotente.
--
-- El panel estrena, en la ventana de grabación de cada cliente,
-- la lista «Ya enviados» con botón Borrar (para regrabar).
-- Estas políticas permiten al ADMIN (guardia es_admin) listar y
-- borrar en el bucket 'reportes' por la API de Storage — el SQL
-- directo sobre storage.objects está bloqueado por Supabase.
-- Las políticas de los clientes no se tocan.
-- ============================================================
drop policy if exists reportes_admin_ver on storage.objects;
create policy reportes_admin_ver on storage.objects
  for select to authenticated
  using (bucket_id = 'reportes' and public.es_admin());

drop policy if exists reportes_admin_borrar on storage.objects;
create policy reportes_admin_borrar on storage.objects
  for delete to authenticated
  using (bucket_id = 'reportes' and public.es_admin());
