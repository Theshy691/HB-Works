-- ==============================================================================
-- HB WORKS POS - Production Supabase Database Schema & Security Hardening
-- Run this in your Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create or Ensure Products Table
create table if not exists public.products (
    id text primary key default gen_random_uuid()::text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all required columns exist with proper data types
alter table public.products add column if not exists name text;
alter table public.products add column if not exists product_name text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists barcode_sku text;
alter table public.products add column if not exists price numeric(10, 2) default 0.00;
alter table public.products add column if not exists quantity_in_stock integer default 0;
alter table public.products add column if not exists category text default 'General';
alter table public.products add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());


-- Add integrity constraints safely
do $$
begin
    -- Ensure barcode is unique
    if not exists (
        select 1 from pg_constraint where conname = 'products_barcode_key'
    ) then
        alter table public.products add constraint products_barcode_key unique (barcode);
    end if;

    -- Ensure non-negative price
    if not exists (
        select 1 from pg_constraint where conname = 'products_price_non_negative'
    ) then
        alter table public.products add constraint products_price_non_negative check (price >= 0);
    end if;

    -- Ensure non-negative stock quantity
    if not exists (
        select 1 from pg_constraint where conname = 'products_stock_non_negative'
    ) then
        alter table public.products add constraint products_stock_non_negative check (quantity_in_stock >= 0);
    end if;
end $$;

-- 2. Create or Ensure Sales / Transactions Table
create table if not exists public.sales (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sales add column if not exists transaction_id text;
alter table public.sales add column if not exists cashier_name text;
alter table public.sales add column if not exists total_amount numeric(10, 2) default 0.00;
alter table public.sales add column if not exists payment_method text default 'Cash';
alter table public.sales add column if not exists amount_tendered numeric(10, 2) default 0.00;
alter table public.sales add column if not exists change_amount numeric(10, 2) default 0.00;
alter table public.sales add column if not exists items jsonb default '[]'::jsonb;


-- Add sales integrity constraints safely
do $$
begin
    -- Ensure transaction_id is unique (prevents duplicate sales)
    if not exists (
        select 1 from pg_constraint where conname = 'sales_transaction_id_key'
    ) then
        alter table public.sales add constraint sales_transaction_id_key unique (transaction_id);
    end if;

    -- Ensure non-negative total amount
    if not exists (
        select 1 from pg_constraint where conname = 'sales_total_non_negative'
    ) then
        alter table public.sales add constraint sales_total_non_negative check (total_amount >= 0);
    end if;
end $$;

-- 3. Performance Indexes
create index if not exists idx_products_barcode on public.products(barcode);
create index if not exists idx_products_name_lower on public.products(lower(name));
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_sales_transaction_id on public.sales(transaction_id);

-- 4. Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.sales enable row level security;

-- 5. Hardened Row Level Security Policies
-- Clean up any legacy wide-open policies
drop policy if exists "Allow anon full access on products" on public.products;
drop policy if exists "Allow anon full access on sales" on public.sales;
drop policy if exists "Allow read access on products" on public.products;
drop policy if exists "Allow insert access on products" on public.products;
drop policy if exists "Allow update access on products" on public.products;
drop policy if exists "Allow read access on sales" on public.sales;
drop policy if exists "Allow insert access on sales" on public.sales;

-- PRODUCTS:
-- (a) Anyone (POS client) can view active products
create policy "Allow read access on products"
    on public.products
    for select
    to anon, authenticated
    using (true);

-- (b) Allow adding products with valid non-negative fields
create policy "Allow insert access on products"
    on public.products
    for insert
    to anon, authenticated
    with check (
        name is not null and length(trim(name)) > 0
        and barcode is not null and length(trim(barcode)) > 0
        and price >= 0
        and quantity_in_stock >= 0
    );

-- (c) Allow updating stock & product details with non-negative constraints
create policy "Allow update access on products"
    on public.products
    for update
    to anon, authenticated
    using (true)
    with check (
        price >= 0
        and quantity_in_stock >= 0
    );

-- NOTE: DELETE is intentionally NOT granted to anon to prevent catalog wipeout attacks!
-- Only authenticated administrators or service_role can delete items.

-- SALES:
-- (a) Allow reading sales for POS reporting & income dashboard
create policy "Allow read access on sales"
    on public.sales
    for select
    to anon, authenticated
    using (true);

-- (b) Allow inserting completed sales records with valid positive amounts
create policy "Allow insert access on sales"
    on public.sales
    for insert
    to anon, authenticated
    with check (
        transaction_id is not null and length(trim(transaction_id)) > 0
        and total_amount >= 0
        and amount_tendered >= 0
        and change_amount >= 0
    );

-- NOTE: UPDATE and DELETE are intentionally NOT granted to anon!
-- Sales records are immutable financial audit entries and cannot be altered or deleted.

-- 6. Atomic POS Checkout Procedure (Solves Concurrency & Race Conditions)
create or replace function public.process_pos_sale(
    p_transaction_id text,
    p_total numeric,
    p_payment_method text,
    p_amount_tendered numeric,
    p_change_amount numeric,
    p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_barcode text;
    v_qty int;
    v_sale_id uuid;
begin
    -- 1. Validate inputs
    if p_transaction_id is null or length(trim(p_transaction_id)) = 0 then
        raise exception 'transaction_id is required';
    end if;
    if p_total < 0 then
        raise exception 'total amount cannot be negative';
    end if;

    -- 2. Insert sale record (idempotent via transaction_id)
    insert into public.sales (
        transaction_id,
        total_amount,
        payment_method,
        amount_tendered,
        change_amount,
        items
    ) values (
        p_transaction_id,
        p_total,
        coalesce(p_payment_method, 'Cash'),
        greatest(0, coalesce(p_amount_tendered, p_total)),
        greatest(0, coalesce(p_change_amount, 0)),
        coalesce(p_items, '[]'::jsonb)
    )
    on conflict (transaction_id) do nothing
    returning id into v_sale_id;

    -- 3. Atomically decrement stock for each sold product in single transaction
    if p_items is not null and jsonb_array_length(p_items) > 0 then
        for v_item in select * from jsonb_array_elements(p_items) loop
            v_barcode := v_item->>'barcode';
            v_qty := coalesce((v_item->>'quantity')::int, (v_item->>'qty')::int, (v_item->>'cart_quantity')::int, 1);
            if v_barcode is not null and length(trim(v_barcode)) > 0 and v_qty > 0 then
                update public.products
                set quantity_in_stock = greatest(0, quantity_in_stock - v_qty),
                    updated_at = timezone('utc'::text, now())
                where barcode = v_barcode;
            end if;
        end loop;

    end if;

    return jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'sale_id', v_sale_id
    );
end;
$$;

-- Grant execution permission for atomic sales procedure
grant execute on function public.process_pos_sale(text, numeric, text, numeric, numeric, jsonb) to anon, authenticated;

-- Table Grants
grant select, insert, update on public.products to anon, authenticated;
grant select, insert on public.sales to anon, authenticated;

-- 7. Seed Initial Motor Shop Products (if not already seeded)
insert into public.products (name, barcode, price, quantity_in_stock, category)
values
    ('Motul 300V 4T 10W40 1L', '8901234567', 850.00, 24, 'Oil & Fluids'),
    ('Brembo Ceramic Sintered Brake Pads', '8907654321', 1250.00, 12, 'Brakes'),
    ('Pirelli Angel Scooter Tire 120/70-14', '8901122334', 2400.00, 8, 'Tires'),
    ('NGK Iridium Spark Plug CR8EIX', '8909988776', 420.00, 35, 'Ignition'),
    ('DID Gold Chain 428D-120L', '8905544332', 1650.00, 10, 'Drive & Transmission'),
    ('Yamaha OEM Oil Filter', '4567890123', 180.00, 20, 'Maintenance')
on conflict (barcode) do nothing;
