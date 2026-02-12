-- Add order_index column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Optional: Create an index for performance if ordering by this column frequently
CREATE INDEX IF NOT EXISTS idx_rooms_order_index ON public.rooms(order_index);
