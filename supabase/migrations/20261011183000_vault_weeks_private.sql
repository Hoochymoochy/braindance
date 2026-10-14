-- Vault exclusives stay secret until unlock: no public SELECT on vault_weeks.
-- Reads go through Next service-role APIs that redact when locked.

drop policy if exists "vault_weeks_select_public" on public.vault_weeks;
