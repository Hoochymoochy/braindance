-- Profiles, crates, and moments for Braindance listeners.
-- Run in the Supabase SQL editor (Dashboard → SQL).

-- Profiles (replaces host-centric identity for the listener product)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text default '',
  created_at timestamptz not null default now()
);

-- Optional: copy existing host rows into profiles
insert into public.profiles (id, username)
select id, username from public.hosts
on conflict (id) do nothing;

create table if not exists public.crates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crates_user_id_idx on public.crates (user_id);

create table if not exists public.crate_sets (
  id uuid primary key default gen_random_uuid(),
  crate_id uuid not null references public.crates (id) on delete cascade,
  video_id text not null,
  title text not null default '',
  channel text not null default '',
  thumbnail text,
  added_at timestamptz not null default now(),
  unique (crate_id, video_id)
);

create index if not exists crate_sets_crate_id_idx on public.crate_sets (crate_id);

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id text not null,
  set_title text not null default '',
  track_title text not null default '',
  track_artist text not null default '',
  timestamp_label text not null default '0:00',
  timestamp_seconds integer not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists moments_user_id_idx on public.moments (user_id);
create index if not exists moments_video_id_idx on public.moments (video_id);

alter table public.profiles enable row level security;
alter table public.crates enable row level security;
alter table public.crate_sets enable row level security;
alter table public.moments enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Crates
drop policy if exists "crates_select_own" on public.crates;
create policy "crates_select_own"
  on public.crates for select
  using (auth.uid() = user_id);

drop policy if exists "crates_insert_own" on public.crates;
create policy "crates_insert_own"
  on public.crates for insert
  with check (auth.uid() = user_id);

drop policy if exists "crates_update_own" on public.crates;
create policy "crates_update_own"
  on public.crates for update
  using (auth.uid() = user_id);

drop policy if exists "crates_delete_own" on public.crates;
create policy "crates_delete_own"
  on public.crates for delete
  using (auth.uid() = user_id);

-- Crate sets (via crate ownership)
drop policy if exists "crate_sets_select_own" on public.crate_sets;
create policy "crate_sets_select_own"
  on public.crate_sets for select
  using (
    exists (
      select 1 from public.crates c
      where c.id = crate_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "crate_sets_insert_own" on public.crate_sets;
create policy "crate_sets_insert_own"
  on public.crate_sets for insert
  with check (
    exists (
      select 1 from public.crates c
      where c.id = crate_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "crate_sets_delete_own" on public.crate_sets;
create policy "crate_sets_delete_own"
  on public.crate_sets for delete
  using (
    exists (
      select 1 from public.crates c
      where c.id = crate_id and c.user_id = auth.uid()
    )
  );

-- Moments
drop policy if exists "moments_select_own" on public.moments;
create policy "moments_select_own"
  on public.moments for select
  using (auth.uid() = user_id);

drop policy if exists "moments_insert_own" on public.moments;
create policy "moments_insert_own"
  on public.moments for insert
  with check (auth.uid() = user_id);

drop policy if exists "moments_update_own" on public.moments;
create policy "moments_update_own"
  on public.moments for update
  using (auth.uid() = user_id);

drop policy if exists "moments_delete_own" on public.moments;
create policy "moments_delete_own"
  on public.moments for delete
  using (auth.uid() = user_id);
