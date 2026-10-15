-- Per-playback-session identity for idempotent listening progress upserts.
-- Vault rewards stay independent; analytics heartbeats key on client_session_id.

alter table public.listening_sessions
  add column if not exists client_session_id text;

create unique index if not exists listening_sessions_user_client_session_uidx
  on public.listening_sessions (user_id, client_session_id)
  where client_session_id is not null;

create index if not exists listening_sessions_user_video_idx
  on public.listening_sessions (user_id, video_id);
