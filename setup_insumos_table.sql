-- Create table for General Stock Items (Insumos) matching Stock.tsx
create table if not exists public.chakra_stock_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  name text not null,
  qty numeric default 0,
  unit text default 'u', -- 'g', 'ml', 'u', etc.
  category text default 'general',
  location text,
  notes text
);

-- Enable RLS
alter table public.chakra_stock_items enable row level security;

-- Policies
create policy "Enable read access for authenticated users" 
on public.chakra_stock_items for select 
to authenticated 
using (true);

create policy "Enable insert for authenticated users" 
on public.chakra_stock_items for insert 
to authenticated 
with check (true);

create policy "Enable update for authenticated users" 
on public.chakra_stock_items for update 
to authenticated 
using (true);

create policy "Enable delete for authenticated users" 
on public.chakra_stock_items for delete 
to authenticated 
using (true);

-- Realtime publication (Simple idempotent check)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chakra_stock_items;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
