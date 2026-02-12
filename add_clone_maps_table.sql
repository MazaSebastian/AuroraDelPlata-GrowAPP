-- Create clone_maps table
CREATE TABLE IF NOT EXISTS clone_maps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grid_rows INTEGER DEFAULT 10,
    grid_columns INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add clone_map_id to batches
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS clone_map_id UUID REFERENCES clone_maps(id) ON DELETE SET NULL;

-- Enable RLS on clone_maps (assuming public/auth policies similar to rooms)
ALTER TABLE clone_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON clone_maps
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON clone_maps
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON clone_maps
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON clone_maps
    FOR DELETE USING (auth.role() = 'authenticated');
