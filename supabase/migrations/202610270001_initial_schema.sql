-- Owner Dashboard V2: initial Supabase schema
-- Apply this file in Supabase SQL Editor after reviewing it.
-- All tenant-owned records carry store_id and are protected by RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store_code text unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','manager','kitchen','waiter')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  sku text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_store_id_idx on public.products(store_id);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sold_by uuid references auth.users(id) on delete set null,
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_method text,
  notes text,
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists sales_store_sold_at_idx on public.sales(store_id, sold_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists sale_items_store_sale_idx on public.sale_items(store_id, sale_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text,
  spent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists expenses_store_spent_at_idx on public.expenses(store_id, spent_at desc);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  quantity numeric(14,3) not null default 0,
  minimum_quantity numeric(14,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stock_items_store_id_idx on public.stock_items(store_id);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  movement_type text not null check (movement_type in ('in','out','adjustment')),
  quantity numeric(14,3) not null check (quantity > 0),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_store_created_idx on public.stock_movements(store_id, created_at desc);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_queue (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  request_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists staff_queue_store_status_idx on public.staff_queue(store_id, status, created_at desc);

-- Security-definer helpers avoid recursive RLS checks on store_members.
create or replace function public.is_active_store_member(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = (select auth.uid())
      and sm.is_active = true
  );
$$;

create or replace function public.has_store_role(target_store_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = (select auth.uid())
      and sm.is_active = true
      and sm.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_active_store_member(uuid) from public;
revoke all on function public.has_store_role(uuid, text[]) from public;
grant execute on function public.is_active_store_member(uuid) to authenticated;
grant execute on function public.has_store_role(uuid, text[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.recipes enable row level security;
alter table public.staff_queue enable row level security;

-- Profile: users can view/update only their own profile.
create policy profiles_select_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Store bootstrap: a user can create a store only as its creator.
create policy stores_select_members on public.stores for select to authenticated using (public.is_active_store_member(id) or created_by = (select auth.uid()));
create policy stores_insert_creator on public.stores for insert to authenticated with check (created_by = (select auth.uid()));
create policy stores_update_owner_manager on public.stores for update to authenticated using (public.has_store_role(id, array['owner','manager'])) with check (public.has_store_role(id, array['owner','manager']));

-- Membership: members can see the roster; only owner/manager can manage existing membership.
create policy store_members_select_members on public.store_members for select to authenticated using (public.is_active_store_member(store_id));
create policy store_members_insert_bootstrap_or_manager on public.store_members for insert to authenticated
with check (
  (user_id = (select auth.uid()) and role = 'owner'
    and exists (select 1 from public.stores s where s.id = store_id and s.created_by = (select auth.uid())))
  or public.has_store_role(store_id, array['owner','manager'])
);
create policy store_members_update_owner_manager on public.store_members for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy store_members_delete_owner_manager on public.store_members for delete to authenticated using (public.has_store_role(store_id, array['owner']));

-- Products: all active members can read; owner/manager can change catalogue.
create policy products_select_members on public.products for select to authenticated using (public.is_active_store_member(store_id));
create policy products_insert_managers on public.products for insert to authenticated with check (public.has_store_role(store_id, array['owner','manager']));
create policy products_update_managers on public.products for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy products_delete_managers on public.products for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

-- Sales: active members may create/read; only owner/manager can edit/delete.
create policy sales_select_members on public.sales for select to authenticated using (public.is_active_store_member(store_id));
create policy sales_insert_members on public.sales for insert to authenticated with check (public.is_active_store_member(store_id));
create policy sales_update_managers on public.sales for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy sales_delete_managers on public.sales for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

create policy sale_items_select_members on public.sale_items for select to authenticated using (public.is_active_store_member(store_id));
create policy sale_items_insert_members on public.sale_items for insert to authenticated with check (
  public.is_active_store_member(store_id)
  and exists (select 1 from public.sales s where s.id = sale_id and s.store_id = store_id)
);
create policy sale_items_update_managers on public.sale_items for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy sale_items_delete_managers on public.sale_items for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

-- Expenses and stock: owner/manager control records; kitchen staff can record stock movement.
create policy expenses_select_members on public.expenses for select to authenticated using (public.is_active_store_member(store_id));
create policy expenses_insert_managers on public.expenses for insert to authenticated with check (public.has_store_role(store_id, array['owner','manager']));
create policy expenses_update_managers on public.expenses for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy expenses_delete_managers on public.expenses for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

create policy stock_items_select_members on public.stock_items for select to authenticated using (public.is_active_store_member(store_id));
create policy stock_items_insert_managers on public.stock_items for insert to authenticated with check (public.has_store_role(store_id, array['owner','manager']));
create policy stock_items_update_managers on public.stock_items for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy stock_items_delete_managers on public.stock_items for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

create policy stock_movements_select_members on public.stock_movements for select to authenticated using (public.is_active_store_member(store_id));
create policy stock_movements_insert_staff on public.stock_movements for insert to authenticated with check (public.has_store_role(store_id, array['owner','manager','kitchen']));
create policy stock_movements_update_managers on public.stock_movements for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy stock_movements_delete_managers on public.stock_movements for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

create policy recipes_select_members on public.recipes for select to authenticated using (public.is_active_store_member(store_id));
create policy recipes_write_managers on public.recipes for all to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));

create policy staff_queue_select_members on public.staff_queue for select to authenticated using (public.is_active_store_member(store_id));
create policy staff_queue_insert_staff on public.staff_queue for insert to authenticated with check (public.is_active_store_member(store_id));
create policy staff_queue_update_managers on public.staff_queue for update to authenticated using (public.has_store_role(store_id, array['owner','manager'])) with check (public.has_store_role(store_id, array['owner','manager']));
create policy staff_queue_delete_managers on public.staff_queue for delete to authenticated using (public.has_store_role(store_id, array['owner','manager']));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.stores, public.store_members,
  public.products, public.sales, public.sale_items, public.expenses, public.stock_items,
  public.stock_movements, public.recipes, public.staff_queue to authenticated;
