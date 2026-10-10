-- Walkies: esquema base para Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto en supabase.com

-- Extensión para UUIDs (ya suele estar activa)
-- create extension if not exists "uuid-ossp";

-- Perfiles de usuario (extiende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role text default 'owner' check (role in ('owner', 'walker')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mascotas
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  breed text,
  age_years int,
  size text check (size in ('small', 'medium', 'large')),
  notes text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Si ya tenías la tabla pets, agrega la columna con:
-- alter table public.pets add column if not exists photo_url text;

-- Crear bucket "pet-photos" en Dashboard → Storage → New bucket (public).
-- Luego en Storage → Policies puedes usar políticas que permitan a usuarios subir en su carpeta.

-- Paseadores (datos extra si role = 'walker')
create table if not exists public.walkers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  bio text,
  rating_avg numeric(3,2) default 0,
  hourly_rate decimal(10,2),
  last_lat numeric(10,7),
  last_lng numeric(10,7),
  last_location_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Direcciones
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text default 'Casa',
  street text,
  city text,
  lat numeric(10,7),
  lng numeric(10,7),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Paseos
create table if not exists public.walks (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete restrict,
  walker_id uuid not null references public.walkers(id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes int default 30,
  status text default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  price decimal(10,2),
  notes text,
  pickup_address text,
  pickup_lat numeric(10,7),
  pickup_lng numeric(10,7),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS (Row Level Security): habilitar
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.walkers enable row level security;
alter table public.addresses enable row level security;
alter table public.walks enable row level security;

-- Políticas básicas: cada usuario ve/edita solo lo suyo
-- Perfil: leer/actualizar el propio
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Mascotas: dueño ve y gestiona las suyas
create policy "Users can read own pets" on public.pets for select using (auth.uid() = owner_id);
create policy "Users can insert own pets" on public.pets for insert with check (auth.uid() = owner_id);
create policy "Users can update own pets" on public.pets for update using (auth.uid() = owner_id);
create policy "Users can delete own pets" on public.pets for delete using (auth.uid() = owner_id);

-- Paseadores: todos pueden leer (para buscar); solo el dueño del user_id puede actualizar
create policy "Anyone can read walkers" on public.walkers for select using (true);
create policy "Walkers can update own row" on public.walkers for update using (auth.uid() = user_id);
create policy "Users can insert walker profile" on public.walkers for insert with check (auth.uid() = user_id);

-- Direcciones: solo el usuario dueño
create policy "Users can manage own addresses" on public.addresses for all using (auth.uid() = user_id);

-- Paseos: dueño de la mascota y el paseador pueden ver/actualizar según lógica de negocio
create policy "Users can read walks for their pets" on public.walks for select using (
  exists (select 1 from public.pets p where p.id = walks.pet_id and p.owner_id = auth.uid())
  or exists (select 1 from public.walkers w where w.id = walks.walker_id and w.user_id = auth.uid())
);
create policy "Owners can create walks for their pets" on public.walks for insert with check (
  exists (select 1 from public.pets p where p.id = pet_id and p.owner_id = auth.uid())
);
create policy "Owners can update walks for their pets" on public.walks for update using (
  exists (select 1 from public.pets p where p.id = walks.pet_id and p.owner_id = auth.uid())
);
create policy "Walkers can update assigned walks" on public.walks for update using (
  exists (select 1 from public.walkers w where w.id = walks.walker_id and w.user_id = auth.uid())
);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
