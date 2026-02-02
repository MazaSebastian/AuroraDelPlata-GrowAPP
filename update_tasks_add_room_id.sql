-- Add room_id to chakra_tasks to allow assigning tasks to specific rooms within a crop
ALTER TABLE public.chakra_tasks
ADD COLUMN IF NOT EXISTS room_id uuid; -- references public.rooms(id) implicitly or explicitly

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_room_id ON public.chakra_tasks(room_id);
