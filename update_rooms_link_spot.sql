-- Add foreign key to link Rooms to Spots (chakra_crops)
alter table public.rooms 
add column if not exists spot_id uuid references public.chakra_crops(id) on delete cascade;

-- Index for performance
create index if not exists idx_rooms_spot_id on public.rooms(spot_id);
