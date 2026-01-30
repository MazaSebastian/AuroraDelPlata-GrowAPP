-- Create Genetics table
create table if not exists public.genetics (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null, -- 'automatic', 'photoperiodic'
  vegetative_weeks int default 0,
  flowering_weeks int default 0,
  breeder text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Genetics
alter table public.genetics enable row level security;
create policy "Enable all access for now" on public.genetics for all using (true) with check (true);

-- Add Reference to Batches table
-- We use alter table to add the column if it doesn't exist.
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'batches' and column_name = 'genetic_id') then
    alter table public.batches add column genetic_id uuid references public.genetics(id) on delete set null;
  end if;
end $$;
