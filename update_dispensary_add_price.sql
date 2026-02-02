-- Add price_per_gram column to chakra_dispensary_batches
ALTER TABLE chakra_dispensary_batches 
ADD COLUMN IF NOT EXISTS price_per_gram numeric DEFAULT 0;

-- Optional: Comment on the column
COMMENT ON COLUMN chakra_dispensary_batches.price_per_gram IS 'Price per gram in local currency';
