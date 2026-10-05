-- Optional: auto-create a profiles row whenever a new Auth user signs up.
-- Existing users still need ensureProfileForCurrentUser() (or a one-off backfill).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  uname text;
begin
  base := split_part(coalesce(new.email, 'user'), '@', 1);
  base := regexp_replace(base, '[^a-zA-Z0-9._-]', '_', 'g');
  if base = '' then
    base := 'user';
  end if;
  uname := base || '_' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.profiles (id, username, display_name)
  values (new.id, uname, base)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
