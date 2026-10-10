-- Ubicación del paseador en vivo (opcional pero recomendado).
-- SQL Editor de Supabase → Run
-- Luego: Database → Replication → activa la tabla walkers.

alter table public.walkers replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.walkers;
exception
  when duplicate_object then
    null;
end $$;
