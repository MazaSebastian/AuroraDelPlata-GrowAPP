-- Add order_index column to rooms table
ALTER TABLE rooms 
ADD COLUMN order_index INTEGER DEFAULT 0;

-- Optional: Initial population based on name or creation date to avoid nulls/zeros if desired, though default 0 is fine.
-- UPDATE rooms SET order_index = EXTRACT(EPOCH FROM created_at); 
-- Better: Using a sequence or just letting the frontend handle initial reorder. 
-- For now, default 0 is sufficient as the drag-and-drop will overwrite it.
