-- Add alert_type column to batches table
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS alert_type text CHECK (alert_type IN ('pest', 'fungus', 'nutrient', 'other'));

-- Or simpler, just text or boolean. User said "Alerta" (singular). 
-- Let's make it a text field to allow for "type" in future layout, but treat as boolean presence for now.
-- Actually, let's keep it simple: 'warning' | null
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS has_alert boolean DEFAULT false;

-- Add index for performance if needed (probably overkill for now)
