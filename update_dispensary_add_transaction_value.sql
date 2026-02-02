-- Add transaction_value column to chakra_dispensary_movements
ALTER TABLE chakra_dispensary_movements
ADD COLUMN IF NOT EXISTS transaction_value numeric DEFAULT 0;

-- Optional: Comment on the column
COMMENT ON COLUMN chakra_dispensary_movements.transaction_value IS 'Total monetary value of the transaction (Price * Amount)';
