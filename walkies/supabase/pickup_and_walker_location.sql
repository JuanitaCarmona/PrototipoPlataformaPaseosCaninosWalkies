-- Punto de recogida del paseo (donde están las mascotas) + última ubicación del paseador.
-- Ejecutar en Supabase: SQL Editor -> New query -> Run

alter table public.walkers
  add column if not exists last_lat numeric(10,7),
  add column if not exists last_lng numeric(10,7),
  add column if not exists last_location_at timestamptz;

alter table public.walks
  add column if not exists pickup_address text,
  add column if not exists pickup_lat numeric(10,7) not null default 0,
  add column if not exists pickup_lng numeric(10,7) not null default 0;

alter table public.walks alter column pickup_lat drop default;
alter table public.walks alter column pickup_lng drop default;
