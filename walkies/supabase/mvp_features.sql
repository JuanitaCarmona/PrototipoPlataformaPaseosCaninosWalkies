-- Walkies: valoraciones, chat, notificaciones, lectura pública de perfiles y timestamps de paseo.
-- Ejecutar en Supabase: SQL Editor → New query → Run
-- Requiere que schema.sql (y scripts previos) ya estén aplicados.

-- Perfiles visibles para listar paseadores y contactar en un paseo
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

-- Timestamps del ciclo de vida del paseo
alter table public.walks
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- Valoraciones (una por paseo)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null unique references public.walks(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  walker_id uuid not null references public.walkers(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Anyone authenticated can read reviews" on public.reviews;
create policy "Anyone authenticated can read reviews"
on public.reviews for select to authenticated using (true);

drop policy if exists "Owners can insert reviews for their walks" on public.reviews;
create policy "Owners can insert reviews for their walks"
on public.reviews for insert to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.walks w
    join public.pets p on p.id = w.pet_id
    where w.id = walk_id
      and w.walker_id = reviews.walker_id
      and w.status = 'completed'
      and p.owner_id = auth.uid()
  )
);

create or replace function public.refresh_walker_rating()
returns trigger
language plpgsql
security definer
as $$
declare
  target_walker uuid;
begin
  target_walker := coalesce(NEW.walker_id, OLD.walker_id);
  update public.walkers
  set rating_avg = coalesce((
    select round(avg(r.rating)::numeric, 2)
    from public.reviews r
    where r.walker_id = target_walker
  ), 0),
      updated_at = now()
  where id = target_walker;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_walker_rating();

-- Chat por paseo
create table if not exists public.walk_messages (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references public.walks(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table public.walk_messages enable row level security;

drop policy if exists "Participants can read walk messages" on public.walk_messages;
create policy "Participants can read walk messages"
on public.walk_messages for select to authenticated
using (
  exists (
    select 1 from public.walks w
    join public.pets p on p.id = w.pet_id
    left join public.walkers wk on wk.id = w.walker_id
    where w.id = walk_messages.walk_id
      and (p.owner_id = auth.uid() or wk.user_id = auth.uid())
  )
);

drop policy if exists "Participants can send walk messages" on public.walk_messages;
create policy "Participants can send walk messages"
on public.walk_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.walks w
    join public.pets p on p.id = w.pet_id
    left join public.walkers wk on wk.id = w.walker_id
    where w.id = walk_id
      and (p.owner_id = auth.uid() or wk.user_id = auth.uid())
  )
);

-- Notificaciones in-app
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  walk_id uuid references public.walks(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications"
on public.notifications for insert to authenticated
with check (true);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update to authenticated
using (auth.uid() = user_id);

create index if not exists reviews_walker_id_idx on public.reviews (walker_id);
create index if not exists walk_messages_walk_id_idx on public.walk_messages (walk_id, created_at);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);
