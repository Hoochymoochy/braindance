-- Product cover + gallery images for merch shop.

alter table public.shop_products
  add column if not exists cover_image_url text,
  add column if not exists gallery_image_urls text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'merch-photos',
  'merch-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for storefront
drop policy if exists "merch_photos_public_read" on storage.objects;
create policy "merch_photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'merch-photos');

-- Writes go through the service-role admin API (no client write policies).
