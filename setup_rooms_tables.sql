-- Create Rooms table
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null, -- 'indoor', 'outdoor', 'drying', etc.
  capacity int default 0,
  current_temperature float,
  current_humidity float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Rooms
alter table public.rooms enable row level security;
create policy "Enable all access for now" on public.rooms for all using (true) with check (true);

-- Create Batches table
create table if not exists public.batches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  strain text,
  quantity int default 0,
  stage text not null default 'vegetation', -- 'seedling', 'vegetation', 'flowering', 'drying', 'curing', 'completed'
  start_date date default now(),
  current_room_id uuid references public.rooms(id) on delete set null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Batches
alter table public.batches enable row level security;
create policy "Enable all access for now" on public.batches for all using (true) with check (true);

-- Create Batch Movement History table
create table if not exists public.batch_movements (
  id uuid default gen_random_uuid() primary key,
  batch_id uuid references public.batches(id) on delete cascade not null,
  from_room_id uuid references public.rooms(id) on delete set null,
  to_room_id uuid references public.rooms(id) on delete set null,
  moved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_by uuid references auth.users(id)
);

-- Enable RLS for Movements
alter table public.batch_movements enable row level security;
create policy "Enable all access for now" on public.batch_movements for all using (true) with check (true);

-- Insert some default rooms (optional, helps with visualization)
insert into public.rooms (name, type, capacity) values 
('Sala A - Vegetación', 'vegetation', 500),
('Sala B - Floración 1', 'flowering', 300),
('Sala C - Floración 2', 'flowering', 300),
('Secadero Principal', 'drying', 1000);
