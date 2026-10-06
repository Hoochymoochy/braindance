-- Public read so profiles can be shared via /u/[username]
-- Write policies stay owner-only from 001.

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

drop policy if exists "crates_select_own" on public.crates;
drop policy if exists "crates_select_public" on public.crates;
create policy "crates_select_public"
  on public.crates for select
  using (true);

drop policy if exists "crate_sets_select_own" on public.crate_sets;
drop policy if exists "crate_sets_select_public" on public.crate_sets;
create policy "crate_sets_select_public"
  on public.crate_sets for select
  using (true);

drop policy if exists "moments_select_own" on public.moments;
drop policy if exists "moments_select_public" on public.moments;
create policy "moments_select_public"
  on public.moments for select
  using (true);
