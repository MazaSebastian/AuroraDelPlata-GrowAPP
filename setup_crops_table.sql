-- Create table for Spots (formerly crops) if it doesn't exist
create table if not exists public.chakra_crops (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  location text default 'General',
  start_date timestamp with time zone,
  estimated_harvest_date timestamp with time zone,
  status text default 'active',
  color text default 'green',
  photo_url text,
  user_id uuid references auth.users(id)
);

-- Enable Row Level Security (RLS)
alter table public.chakra_crops enable row level security;

-- Policy to allow authenticated users to view all crops (or restrict to own if needed)
create policy "Enable read access for all users"
on public.chakra_crops for select
using (true);

-- Policy to allow authenticated users to insert crops
create policy "Enable insert for authenticated users"
on public.chakra_crops for insert
with check (true);

-- Policy to allow authenticated users to update their own crops (simplified to all for now based on app type)
create policy "Enable update for authenticated users"
on public.chakra_crops for update
using (true);

-- Policy to allow authenticated users to delete crops
create policy "Enable delete for authenticated users"
on public.chakra_crops for delete
using (true);
