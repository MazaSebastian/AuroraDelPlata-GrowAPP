-- Create table for Dispensary Batches (Finished Product)
create table if not exists public.chakra_dispensary_batches (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Origin tracking
  harvest_log_id uuid references public.chakra_harvest_logs(id), 
  crop_id uuid, -- Optional reference if we want to keep it even if crop is deleted (or store as text)
  
  -- Details
  strain_name text not null,
  batch_code text not null, -- "AUR-2026-001"
  
  -- Inventory
  initial_weight numeric not null, -- in grams (standardizing to g for internal logic)
  current_weight numeric not null, -- in grams
  
  -- Classification
  quality_grade text default 'Standard' check (quality_grade in ('Premium', 'Standard', 'Extracts', 'Trim')),
  status text default 'curing' check (status in ('curing', 'available', 'depleted', 'quarantine')),
  
  location text default 'Depósito General',
  
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.chakra_dispensary_batches enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_dispensary_batches for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_dispensary_batches for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_dispensary_batches for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_dispensary_batches for delete using (true);

-- Indexes for performance
create index if not exists idx_dispensary_status on public.chakra_dispensary_batches(status);
create index if not exists idx_dispensary_strain on public.chakra_dispensary_batches(strain_name);
