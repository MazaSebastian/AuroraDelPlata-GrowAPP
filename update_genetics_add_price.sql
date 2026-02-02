-- Add default_price_per_gram to genetics table
ALTER TABLE genetics 
ADD COLUMN IF NOT EXISTS default_price_per_gram numeric DEFAULT NULL;

COMMENT ON COLUMN genetics.default_price_per_gram IS 'Specific price per gram for this genetic. Overrides global configuration if set.';
