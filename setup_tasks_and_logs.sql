-- Create table for Tasks
create table if not exists public.chakra_tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  type text not null,
  due_date text, -- Storing as text (YYYY-MM-DD) for simplicity with frontend, or date
  status text default 'pending',
  crop_id uuid -- references public.chakra_crops(id)
);

-- Create table for Daily Logs
create table if not exists public.chakra_daily_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date text not null,
  notes text,
  crop_id uuid -- references public.chakra_crops(id)
);

-- Add Unique Constraint for Daily Logs (One per day per crop)
alter table public.chakra_daily_logs add constraint chakra_daily_logs_crop_date_key unique (crop_id, date);

-- Enable RLS
alter table public.chakra_tasks enable row level security;
alter table public.chakra_daily_logs enable row level security;

-- Policies for Tasks
create policy "Enable read access for all users" on public.chakra_tasks for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_tasks for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_tasks for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_tasks for delete using (true);

-- Policies for Logs
create policy "Enable read access for all users" on public.chakra_daily_logs for select using (true);
create policy "Enable insert for authenticated users" on public.chakra_daily_logs for insert with check (true);
create policy "Enable update for authenticated users" on public.chakra_daily_logs for update using (true);
create policy "Enable delete for authenticated users" on public.chakra_daily_logs for delete using (true);
