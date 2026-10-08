-- Listener Archetype and Playback Telemetry Schema for Braindance.
-- Run in the Supabase SQL editor (Dashboard → SQL).

-- 1. listener_archetypes: Caches calculated traits and LLM/fallback archetypes
create table if not exists public.listener_archetypes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade unique,
  archetype text not null,
  display_title text not null,
  secondary_trait text not null,
  description text not null,
  evidence jsonb not null default '[]'::jsonb,
  trait_scores jsonb not null default '{}'::jsonb,
  stats_snapshot jsonb not null default '{}'::jsonb,
  model text not null,
  version text not null default 'v1',
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listener_archetypes_user_id_idx on public.listener_archetypes (user_id);
create index if not exists listener_archetypes_archetype_idx on public.listener_archetypes (archetype);

alter table public.listener_archetypes enable row level security;

-- Public read so archetypes can be shown on public profiles (/u/[username])
drop policy if exists "listener_archetypes_select_public" on public.listener_archetypes;
create policy "listener_archetypes_select_public"
  on public.listener_archetypes for select
  using (true);

drop policy if exists "listener_archetypes_insert_own" on public.listener_archetypes;
create policy "listener_archetypes_insert_own"
  on public.listener_archetypes for insert
  with check (auth.uid() = user_id);

drop policy if exists "listener_archetypes_update_own" on public.listener_archetypes;
create policy "listener_archetypes_update_own"
  on public.listener_archetypes for update
  using (auth.uid() = user_id);

drop policy if exists "listener_archetypes_delete_own" on public.listener_archetypes;
create policy "listener_archetypes_delete_own"
  on public.listener_archetypes for delete
  using (auth.uid() = user_id);


-- 2. listening_sessions: Optional telemetry table for persistent listening history
create table if not exists public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id text not null,
  dj_name text not null default '',
  set_title text not null default '',
  duration_seconds integer not null default 0,
  listened_seconds integer not null default 0,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists listening_sessions_user_id_idx on public.listening_sessions (user_id);
create index if not exists listening_sessions_video_id_idx on public.listening_sessions (video_id);
create index if not exists listening_sessions_started_at_idx on public.listening_sessions (started_at);

alter table public.listening_sessions enable row level security;

drop policy if exists "listening_sessions_select_own" on public.listening_sessions;
create policy "listening_sessions_select_own"
  on public.listening_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "listening_sessions_insert_own" on public.listening_sessions;
create policy "listening_sessions_insert_own"
  on public.listening_sessions for insert
  with check (auth.uid() = user_id);

