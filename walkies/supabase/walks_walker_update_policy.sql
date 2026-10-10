-- Permite que el paseador asignado actualice paseos que le pertenecen.
-- Ejecutar en Supabase: SQL Editor -> New query -> Run

create policy "Walkers can update assigned walks"
on public.walks
for update
using (
  exists (
    select 1
    from public.walkers w
    where w.id = walks.walker_id
      and w.user_id = auth.uid()
  )
);
