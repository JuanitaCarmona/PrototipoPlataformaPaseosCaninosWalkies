-- Actualiza el trigger para guardar el rol (owner/walker) al registrarse.
-- El rol se envía desde la app en user_metadata.role.
-- Ejecutar en Supabase: SQL Editor → New query → Run

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'owner')
  );
  return new;
end;
$$ language plpgsql security definer;
