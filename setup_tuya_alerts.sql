-- Create table for storing Tuya Device Settings (Thresholds)
CREATE TABLE IF NOT EXISTS tuya_device_settings (
    device_id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    min_temp numeric,
    max_temp numeric,
    min_hum numeric,
    max_hum numeric,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tuya_device_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view settings" 
ON tuya_device_settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert/update settings" 
ON tuya_device_settings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON tuya_device_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
