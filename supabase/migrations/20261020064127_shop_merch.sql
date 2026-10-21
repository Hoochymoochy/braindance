-- Braindance merch: products + orders (Stripe-backed checkout).

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  sizes text[] not null default '{}',
  accent_from text not null default '#00ccff',
  accent_to text not null default '#3700ff',
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  inventory_by_size jsonb not null default '{}'::jsonb,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_products_status_idx on public.shop_products (status);
create index if not exists shop_products_slug_idx on public.shop_products (slug);

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  shipping_name text not null default '',
  shipping_line1 text not null default '',
  shipping_city text not null default '',
  shipping_region text not null default '',
  shipping_postal text not null default '',
  shipping_country text not null default '',
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'usd',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  tracking_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_orders_status_idx on public.shop_orders (status);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);

create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  product_id uuid references public.shop_products (id) on delete set null,
  product_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create index if not exists shop_order_items_order_id_idx on public.shop_order_items (order_id);

alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;

-- Public catalog: active products only (anon + authenticated)
drop policy if exists "shop_products_select_active" on public.shop_products;
create policy "shop_products_select_active"
  on public.shop_products for select
  to anon, authenticated
  using (status = 'active');

-- Orders / order items: no direct client access. Server uses service role.
-- (RLS enabled with no write/select policies for anon/authenticated.)

-- Seed design merch (Stripe IDs filled when admin syncs / first checkout create)
insert into public.shop_products (
  slug, name, tagline, description, price_cents, currency, sizes,
  accent_from, accent_to, status, inventory_by_size
)
values
  (
    'wordmark-tee',
    'Wordmark Tee',
    'Heavyweight blank. Soft fade print.',
    'Boxy fit cotton tee with the Braindance wordmark across the chest. Built for long sets and longer nights. Pre-shrunk, garment-washed.',
    3800,
    'usd',
    array['S','M','L','XL','XXL'],
    '#00ccff',
    '#3700ff',
    'active',
    '{"S":12,"M":24,"L":24,"XL":16,"XXL":8}'::jsonb
  ),
  (
    'signal-hoodie',
    'Signal Hoodie',
    'Midweight fleece. Back print.',
    'Pullover hoodie with a low-key chest mark and a full back graphic. Soft fleece interior, ribbed cuffs, drawcord hood.',
    7200,
    'usd',
    array['S','M','L','XL'],
    '#ff00f7',
    '#3700ff',
    'active',
    '{"S":6,"M":14,"L":14,"XL":10}'::jsonb
  ),
  (
    'night-cap',
    'Night Cap',
    'Structured six-panel. Embroidered.',
    'Classic structured cap with tonal Braindance embroidery. Adjustable strap. One size fits most.',
    2800,
    'usd',
    array['M'],
    '#7a7a7a',
    '#18181b',
    'active',
    '{"M":40}'::jsonb
  ),
  (
    'crate-tote',
    'Crate Tote',
    'Canvas. Reinforced handles.',
    'Heavy canvas tote for records, cables, or whatever else leaves the booth with you. Screen-printed mark on one face.',
    3200,
    'usd',
    array['M'],
    '#00ccff',
    '#ff00f7',
    'draft',
    '{"M":20}'::jsonb
  )
on conflict (slug) do nothing;
