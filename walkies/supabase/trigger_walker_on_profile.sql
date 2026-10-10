-- Crea fila en walkers cuando un perfil se inserta con role = 'walker'.
-- Así los paseadores tienen su registro en walkers sin pasos extra.
-- Ejecutar en Supabase: SQL Editor → New query → Run

create or replace function public.ensure_walker_row()
returns trigger as $$
begin
  if new.role = 'walker' then
    insert into public.walkers (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: después de insert o update en profiles, si role = 'walker' asegurar fila en walkers
drop trigger if exists on_profile_ensure_walker on public.profiles;
create trigger on_profile_ensure_walker
  after insert or update of role on public.profiles
  for each row
  when (new.role = 'walker')
  execute function public.ensure_walker_row();
