-- Create table for Harvest Logs
create table if not exists public.chakra_harvest_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  crop_id uuid, -- Reference to the main Crop (Spot)
  room_name text not null, -- Store name as room will be deleted
  yield_amount numeric not null,
  yield_unit text not null check (yield_unit in ('g', 'kg')),
  notes text,
  logged_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.chakra_harvest_logs enable row level security;

-- Policies
create policy "Enable read access for all users" on public.chakra_harvest_logs for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_harvest_logs for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_harvest_logs for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_harvest_logs for delete using (true);
