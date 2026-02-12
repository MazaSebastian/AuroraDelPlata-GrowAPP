-- Add dimensions to rooms table (using specific columns for querying simplicity, or JSONB if preferred. Plan said columns or JSONB. Let's stick to JSONB 'dimensions' as per plan or specific columns? Plan decision: "Let's go with specific columns grid_rows, grid_columns for simplicity". Wait, plan actually debated and concluded "Let's use properties JSONB column... is better". But then "Let's go with specific columns grid_rows, grid_columns for simplicity in this specific feature". Let's use specific columns for explicit schema.)

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS grid_rows INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_columns INTEGER DEFAULT 0;

-- Add grid_position to batches table
-- Storing as Text "A1", "B2" etc.
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS grid_position TEXT;
