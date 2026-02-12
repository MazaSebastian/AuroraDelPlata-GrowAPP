-- Add soft delete columns to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS discarded_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS discard_reason text NULL;

-- Index for filtering active batches quickly
CREATE INDEX IF NOT EXISTS idx_batches_discarded_at ON public.batches(discarded_at);
