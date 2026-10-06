-- Public tags should not include email local-parts.
-- Username = first 8 hex chars of the auth user id (opaque, unique enough).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.profiles (id, username, display_name)
  values (new.id, uname, null)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Backfill any profile whose tag is not already the opaque id prefix.
update public.profiles
set username = substr(replace(id::text, '-', ''), 1, 8)
where username is distinct from substr(replace(id::text, '-', ''), 1, 8);
