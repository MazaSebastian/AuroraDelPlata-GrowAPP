-- Add assigned_to column to chakra_tasks to allow assigning tasks to specific users (employees)
ALTER TABLE public.chakra_tasks
ADD COLUMN IF NOT EXISTS assigned_to uuid; -- references auth.users(id) ideally, or public.users if you have a public profile table

-- Optional: Add index
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_assigned_to ON public.chakra_tasks(assigned_to);
