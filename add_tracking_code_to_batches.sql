-- Add unique tracking code column to batches table
ALTER TABLE public.batches 
ADD COLUMN tracking_code text;

-- Create an index for faster lookups since we will query by this code
CREATE INDEX idx_batches_tracking_code ON public.batches(tracking_code);
