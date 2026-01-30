-- Add table_number column to batches to link a batch to a specific table in the room
alter table public.batches 
add column if not exists table_number int;

-- Optional: Add constraint to prevent multiple active batches on the same table in the same room?
-- For now, we will handle this in the UI logic to allow history.
-- A unique constraint on (current_room_id, table_number) where stage != 'completed' could be useful but complex to manage if not careful.
-- We'll stick to simple column for now.
