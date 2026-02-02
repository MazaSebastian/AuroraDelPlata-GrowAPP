-- Create table for Dispensary Movements (Log of Stock Changes)
create table if not exists public.chakra_dispensary_movements (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  batch_id uuid references public.chakra_dispensary_batches(id) not null,
  
  -- Movement Details
  type text not null check (type in ('dispense', 'adjustment', 'quality_test', 'restock')),
  amount numeric not null, -- Amount changed (g). Negative for dispense/loss, Positive for restock/adjustment.
  
  reason text,
  
  -- Responsible / Member
  performed_by uuid references auth.users(id), -- Staff who did the action
  member_id uuid, -- Optional: If we link to members later
  
  previous_weight numeric, -- Snapshots for audit
  new_weight numeric
);

-- Enable RLS
alter table public.chakra_dispensary_movements enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_dispensary_movements for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_dispensary_movements for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_dispensary_movements for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_dispensary_movements for delete using (true);

-- Index
create index if not exists idx_movements_batch on public.chakra_dispensary_movements(batch_id);
