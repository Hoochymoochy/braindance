-- Additive order-admin fields: refund ledger, shipment timestamps, email attempts,
-- and Stripe event ids. Existing orders and payment rows are kept.

alter table public.shop_orders
  add column if not exists amount_refunded_cents integer not null default 0,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists shipping_notified_at timestamptz,
  add column if not exists shipping_notify_error text,
  add column if not exists inventory_adjusted boolean not null default false;

alter table public.shop_orders
  drop constraint if exists shop_orders_amount_refunded_cents_check;
alter table public.shop_orders
  add constraint shop_orders_amount_refunded_cents_check
  check (amount_refunded_cents >= 0);

-- Paid orders already adjusted inventory when they were created.
update public.shop_orders
set inventory_adjusted = true
where payment_status in ('paid', 'partially_refunded', 'refunded')
  and inventory_adjusted = false;

update public.shop_orders o
set shipped_at = coalesce(
  (
    select min(e.created_at)
    from public.shop_order_events e
    where e.order_id = o.id
      and e.event_type in ('order_shipped', 'shipment_confirmed')
  ),
  o.updated_at,
  o.created_at
)
where o.fulfillment_status in ('shipped', 'delivered')
  and o.shipped_at is null;

update public.shop_orders o
set delivered_at = coalesce(
  (
    select min(e.created_at)
    from public.shop_order_events e
    where e.order_id = o.id
      and e.event_type in ('order_delivered', 'delivery_manually_confirmed')
  ),
  o.updated_at
)
where o.fulfillment_status = 'delivered'
  and o.delivered_at is null;

update public.shop_orders o
set cancelled_at = coalesce(
  (
    select min(e.created_at)
    from public.shop_order_events e
    where e.order_id = o.id
      and e.event_type in ('order_cancelled', 'fulfillment_cancelled')
  ),
  o.updated_at
)
where o.fulfillment_status = 'cancelled'
  and o.cancelled_at is null;

create index if not exists shop_orders_payment_intent_idx
  on public.shop_orders (stripe_payment_intent_id);

create table if not exists public.shop_order_refunds (
  stripe_refund_id text primary key,
  order_id uuid references public.shop_orders (id) on delete cascade,
  payment_intent_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_order_refunds_order_id_idx
  on public.shop_order_refunds (order_id);
create index if not exists shop_order_refunds_payment_intent_idx
  on public.shop_order_refunds (payment_intent_id);

alter table public.shop_order_refunds enable row level security;

create table if not exists public.shop_stripe_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.shop_stripe_events enable row level security;

create unique index if not exists shop_order_events_refund_uidx
  on public.shop_order_events (order_id, event_type, (metadata->>'stripeRefundId'))
  where event_type in ('refund_initiated', 'refund_confirmed')
    and metadata->>'stripeRefundId' is not null;
