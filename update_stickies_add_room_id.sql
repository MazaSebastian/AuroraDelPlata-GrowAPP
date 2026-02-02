-- Add room_id and target_date to chakra_stickies for Calendar integration
ALTER TABLE chakra_stickies 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE chakra_stickies
ADD COLUMN IF NOT EXISTS target_date DATE;

-- Index for faster filtering by room and date
CREATE INDEX IF NOT EXISTS idx_stickies_room_date ON chakra_stickies(room_id, target_date);
