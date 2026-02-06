-- Create Extractions Table
CREATE TABLE IF NOT EXISTS extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_batch_id UUID REFERENCES chakra_dispensary_batches(id),
  date DATE NOT NULL,
  technique TEXT NOT NULL CHECK (technique IN ('Rosin', 'BHO', 'Ice', 'Dry Sift')),
  input_weight NUMERIC NOT NULL CHECK (input_weight > 0),
  output_weight NUMERIC NOT NULL CHECK (output_weight >= 0),
  yield_percentage NUMERIC GENERATED ALWAYS AS ((output_weight / input_weight) * 100) STORED,
  parameters JSONB DEFAULT '{}'::jsonb, -- Stores temp, pressure, microns, cycles, etc.
  ratings JSONB DEFAULT '{}'::jsonb, -- Stores aroma, texture, potency (1-10)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

-- Create Policies (Assuming public access for authenticated users for now, similar to other tables)
CREATE POLICY "Enable read access for all users" ON extractions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON extractions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on email" ON extractions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for users based on email" ON extractions FOR DELETE USING (auth.role() = 'authenticated');
