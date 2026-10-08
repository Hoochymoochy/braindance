-- Let listeners pin up to 3 favorite moments on their profile card.
-- favorite_rank: 1–3 = featured order; null = not featured.

alter table public.moments
  add column if not exists favorite_rank smallint;

alter table public.moments
  drop constraint if exists moments_favorite_rank_range;

alter table public.moments
  add constraint moments_favorite_rank_range
  check (favorite_rank is null or favorite_rank between 1 and 3);

-- One moment per rank per user (only among pinned rows).
drop index if exists moments_user_favorite_rank_uidx;
create unique index moments_user_favorite_rank_uidx
  on public.moments (user_id, favorite_rank)
  where favorite_rank is not null;

create index if not exists moments_user_favorites_idx
  on public.moments (user_id, favorite_rank)
  where favorite_rank is not null;
