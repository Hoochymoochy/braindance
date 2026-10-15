-- Weekly Vault: one exclusive set per week, shared progress meter to 100.
-- week_start is always Monday UTC.

-- 1. Curated exclusive for a calendar week
create table if not exists public.vault_weeks (
  week_start date primary key,
  video_id text not null unique,
  youtube_url text not null,
  title text not null default '',
  channel text not null default '',
  thumbnail text,
  created_at timestamptz not null default now()
);

create index if not exists vault_weeks_video_id_idx on public.vault_weeks (video_id);

alter table public.vault_weeks enable row level security;

drop policy if exists "vault_weeks_select_public" on public.vault_weeks;
create policy "vault_weeks_select_public"
  on public.vault_weeks for select
  using (true);

-- Writes go through service role / admin API only (no anon insert/update/delete policies).

-- 2. Per-user progress for a week (caps at 100; unlocked_at set once).
-- week_start is not FK'd to vault_weeks so users can grind before the exclusive is posted.
create table if not exists public.vault_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  points integer not null default 0 check (points >= 0 and points <= 100),
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

create index if not exists vault_progress_user_id_idx on public.vault_progress (user_id);
create index if not exists vault_progress_unlocked_idx
  on public.vault_progress (user_id, unlocked_at)
  where unlocked_at is not null;

alter table public.vault_progress enable row level security;

-- Owner can read own progress (meter on profile)
drop policy if exists "vault_progress_select_own" on public.vault_progress;
create policy "vault_progress_select_own"
  on public.vault_progress for select
  using (auth.uid() = user_id);

-- Public flex: anyone can see unlocks (not in-progress meters of others)
drop policy if exists "vault_progress_select_unlocked_public" on public.vault_progress;
create policy "vault_progress_select_unlocked_public"
  on public.vault_progress for select
  using (unlocked_at is not null);

-- 3. Idempotent event ledger
create table if not exists public.vault_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  event_type text not null,
  event_key text not null,
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, week_start, event_key)
);

create index if not exists vault_events_user_week_idx
  on public.vault_events (user_id, week_start);

alter table public.vault_events enable row level security;

drop policy if exists "vault_events_select_own" on public.vault_events;
create policy "vault_events_select_own"
  on public.vault_events for select
  using (auth.uid() = user_id);

-- 4. listening_sessions (may not exist yet if archetypes migration was not applied)
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

drop policy if exists "listening_sessions_update_own" on public.listening_sessions;
create policy "listening_sessions_update_own"
  on public.listening_sessions for update
  using (auth.uid() = user_id);
