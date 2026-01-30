-- Add parent_batch_id to linking batches
alter table public.batches 
add column if not exists parent_batch_id uuid references public.batches(id) on delete set null;
