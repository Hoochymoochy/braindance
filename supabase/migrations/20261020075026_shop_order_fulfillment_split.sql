-- Split payment vs fulfillment status; add carrier + activity timeline.

alter table public.shop_orders
  add column if not exists payment_status text,
  add column if not exists fulfillment_status text,
  add column if not exists shipping_carrier text;

-- Map legacy single status → payment + fulfillment
update public.shop_orders
set
  payment_status = case status
    when 'pending' then 'pending'
    when 'paid' then 'paid'
    when 'shipped' then 'paid'
    when 'cancelled' then 'paid'
    else 'pending'
  end,
  fulfillment_status = case status
    when 'pending' then 'unfulfilled'
    when 'paid' then 'unfulfilled'
    when 'shipped' then 'shipped'
    when 'cancelled' then 'cancelled'
    else 'unfulfilled'
  end
where payment_status is null or fulfillment_status is null;

update public.shop_orders set payment_status = 'pending' where payment_status is null;
update public.shop_orders set fulfillment_status = 'unfulfilled' where fulfillment_status is null;

alter table public.shop_orders
  alter column payment_status set default 'pending',
  alter column fulfillment_status set default 'unfulfilled',
  alter column payment_status set not null,
  alter column fulfillment_status set not null;

alter table public.shop_orders
  drop constraint if exists shop_orders_status_check;

alter table public.shop_orders
  drop column if exists status;

alter table public.shop_orders
  drop constraint if exists shop_orders_payment_status_check;
alter table public.shop_orders
  add constraint shop_orders_payment_status_check
  check (
    payment_status in (
      'pending',
      'paid',
      'failed',
      'refunded',
      'partially_refunded'
    )
  );

alter table public.shop_orders
  drop constraint if exists shop_orders_fulfillment_status_check;
alter table public.shop_orders
  add constraint shop_orders_fulfillment_status_check
  check (
    fulfillment_status in (
      'unfulfilled',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    )
  );

create index if not exists shop_orders_payment_status_idx
  on public.shop_orders (payment_status);
create index if not exists shop_orders_fulfillment_status_idx
  on public.shop_orders (fulfillment_status);

create table if not exists public.shop_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  event_type text not null,
  description text not null,
  actor text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shop_order_events_order_id_idx
  on public.shop_order_events (order_id, created_at asc);

alter table public.shop_order_events enable row level security;

-- Backfill only facts we already know from existing rows (not invented steps).
insert into public.shop_order_events (order_id, event_type, description, actor, created_at)
select
  id,
  'order_created',
  'Order created',
  'system',
  created_at
from public.shop_orders o
where not exists (
  select 1
  from public.shop_order_events e
  where e.order_id = o.id and e.event_type = 'order_created'
);

insert into public.shop_order_events (order_id, event_type, description, actor, created_at)
select
  id,
  'payment_confirmed',
  'Payment confirmed',
  'system',
  created_at
from public.shop_orders o
where o.payment_status = 'paid'
  and not exists (
    select 1
    from public.shop_order_events e
    where e.order_id = o.id and e.event_type = 'payment_confirmed'
  );

insert into public.shop_order_events (order_id, event_type, description, actor, created_at)
select
  id,
  'order_shipped',
  'Order shipped',
  'system',
  coalesce(updated_at, created_at)
from public.shop_orders o
where o.fulfillment_status = 'shipped'
  and not exists (
    select 1
    from public.shop_order_events e
    where e.order_id = o.id and e.event_type = 'order_shipped'
  );
