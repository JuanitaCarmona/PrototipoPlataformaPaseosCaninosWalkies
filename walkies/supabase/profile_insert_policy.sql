-- Permite que un usuario autenticado cree su propia fila en profiles
-- (útil si el usuario se registró antes de tener el trigger on_auth_user_created)
-- Ejecutar en Supabase: SQL Editor → New query → Run

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
