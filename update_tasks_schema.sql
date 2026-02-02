-- Add room_id to chakra_tasks to link tasks to specific rooms/salas
alter table public.chakra_tasks 
add column if not exists room_id uuid references public.rooms(id);

-- Add assigned_to to chakra_tasks to link tasks to users/profiles
alter table public.chakra_tasks 
add column if not exists assigned_to uuid references public.profiles(id);

-- Optional: Add index for performance
create index if not exists idx_tasks_room_id on public.chakra_tasks(room_id);
