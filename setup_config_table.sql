-- Create app_configurations table
CREATE TABLE IF NOT EXISTS app_configurations (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view configs
CREATE POLICY "Enable read access for authenticated users" 
ON app_configurations FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users (or admins) to update configs
CREATE POLICY "Enable update access for authenticated users" 
ON app_configurations FOR UPDATE
TO authenticated 
USING (true)
WITH CHECK (true);

-- Insert default price per gram if not exists
INSERT INTO app_configurations (key, value, description)
VALUES ('dispensary_price_per_gram', '0'::jsonb, 'Valor monetario por gramo para el dispensario')
ON CONFLICT (key) DO NOTHING;
