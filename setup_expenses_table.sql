-- Create Expenses Table for Financial Metrics
create table if not exists public.chakra_expenses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    date date not null default CURRENT_DATE,
    amount numeric not null,
    category text not null check (category in ('electricity', 'water', 'nutrients', 'substrates', 'rent', 'salaries', 'maintenance', 'equipment', 'other')),
    
    description text,
    
    -- Optional links for attribution
    room_id uuid references public.rooms(id) on delete set null,
    batch_id uuid references public.batches(id) on delete set null,
    
    logged_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.chakra_expenses enable row level security;

-- Policies
create policy "Enable read access for authenticated users" on public.chakra_expenses for select to authenticated using (true);
create policy "Enable insert for authenticated users" on public.chakra_expenses for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on public.chakra_expenses for update to authenticated using (true);
create policy "Enable delete for authenticated users" on public.chakra_expenses for delete to authenticated using (true);

-- Index
create index if not exists idx_expenses_date on public.chakra_expenses(date);
create index if not exists idx_expenses_category on public.chakra_expenses(category);
