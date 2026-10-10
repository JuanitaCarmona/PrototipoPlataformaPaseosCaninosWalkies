-- Políticas de Storage para el bucket pet-photos
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run
-- Si da error "policy already exists", borra en Dashboard → Storage → pet-photos → Policies las viejas y vuelve a ejecutar.

-- 1) Permitir a usuarios autenticados SUBIR (solo en su carpeta userId)
create policy "Users can upload pet photos in own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- 2) Permitir a todos leer (bucket público)
create policy "Public read pet photos"
on storage.objects
for select
to public
using (bucket_id = 'pet-photos');

-- 3) Permitir al dueño actualizar/sobrescribir su archivo (por si usas upsert)
create policy "Users can update own pet photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
)
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
