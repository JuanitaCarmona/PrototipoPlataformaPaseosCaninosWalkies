-- Ejecuta esto en Supabase → SQL Editor si ya tenías la tabla pets sin photo_url.
-- Así se corrige el error 400 al cargar mascotas.

alter table public.pets add column if not exists photo_url text;
