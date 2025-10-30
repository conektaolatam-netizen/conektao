-- Create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    permissions,
    created_at,
    updated_at
  ) values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', 'user-' || new.id || '@noemail.local'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'usuario@noemail.local'), '@', 1), 'Usuario'),
    'employee'::user_role,
    true,
    '{}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger to call the function after a new auth user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();