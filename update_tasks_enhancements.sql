-- Add new columns for enhanced task tracking
alter table public.chakra_tasks 
add column if not exists observations text,
add column if not exists photos text[], 
add column if not exists completed_at timestamp with time zone;

-- Ensure array type is handled correctly (default to empty array)
alter table public.chakra_tasks 
alter column photos set default '{}';
