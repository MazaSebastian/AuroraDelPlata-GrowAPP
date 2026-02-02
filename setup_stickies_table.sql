-- Create Stickies Table
create table if not exists public.chakra_stickies (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    color text default 'yellow',
    created_by text,
    user_id uuid references auth.users(id),
    room_id uuid references public.rooms(id) on delete cascade, -- referencing rooms table
    target_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chakra_stickies enable row level security;

-- Policies
create policy "Enable read access for all authenticated users"
    on public.chakra_stickies for select
    to authenticated
    using (true);

create policy "Enable insert access for authenticated users"
    on public.chakra_stickies for insert
    to authenticated
    with check (true);

create policy "Enable update for users based on id"
    on public.chakra_stickies for update
    to authenticated
    using (true); -- Relaxed policy for now, or restrict to user_id = auth.uid()

create policy "Enable delete for users based on id"
    on public.chakra_stickies for delete
    to authenticated
    using (true); -- Relaxed policy for now

-- Index for performance
create index if not exists idx_stickies_room_date on public.chakra_stickies(room_id, target_date);
