-- =========================================================
-- HB WORKS POS - Supabase Database Schema
-- Run this in your Supabase Dashboard -> SQL Editor -> Run
-- =========================================================

-- 1. Create or Ensure Products Table
create table if not exists public.products (
    id text primary key default gen_random_uuid()::text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure all required columns exist (safe for existing tables)
alter table public.products add column if not exists name text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists price numeric(10, 2) default 0.00;
alter table public.products add column if not exists quantity_in_stock integer default 0;
alter table public.products add column if not exists category text default 'General';

-- Ensure barcode is unique
do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'products_barcode_key'
    ) then
        alter table public.products add constraint products_barcode_key unique (barcode);
    end if;
end $$;

-- 2. Create or Ensure Sales / Transactions Table
create table if not exists public.sales (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sales add column if not exists transaction_id text;
alter table public.sales add column if not exists total_amount numeric(10, 2) default 0.00;
alter table public.sales add column if not exists payment_method text default 'Cash';
alter table public.sales add column if not exists amount_tendered numeric(10, 2) default 0.00;
alter table public.sales add column if not exists change_amount numeric(10, 2) default 0.00;
alter table public.sales add column if not exists items jsonb default '[]'::jsonb;

-- 3. Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.sales enable row level security;

-- 4. Create Policies for Public / Anon Access (for Mobile POS frontend)
drop policy if exists "Allow anon full access on products" on public.products;
create policy "Allow anon full access on products"
    on public.products
    for all
    to anon
    using (true)
    with check (true);

drop policy if exists "Allow anon full access on sales" on public.sales;
create policy "Allow anon full access on sales"
    on public.sales
    for all
    to anon
    using (true)
    with check (true);

-- 5. Seed Initial Motor Shop Products
insert into public.products (name, barcode, price, quantity_in_stock, category)
values
    ('Motul 300V 4T 10W40 1L', '8901234567', 850.00, 24, 'Oil & Fluids'),
    ('Brembo Ceramic Sintered Brake Pads', '8907654321', 1250.00, 12, 'Brakes'),
    ('Pirelli Angel Scooter Tire 120/70-14', '8901122334', 2400.00, 8, 'Tires'),
    ('NGK Iridium Spark Plug CR8EIX', '8909988776', 420.00, 35, 'Ignition'),
    ('DID Gold Chain 428D-120L', '8905544332', 1650.00, 10, 'Drive & Transmission'),
    ('Yamaha OEM Oil Filter', '4567890123', 180.00, 20, 'Maintenance')
on conflict (barcode) do nothing;
