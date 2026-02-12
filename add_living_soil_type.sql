-- Add 'living_soil' to check constraint if it exists
-- Supabase doesn't support ALTER TYPE ... ADD VALUE inside a transaction block easily if it's an enum, 
-- but often room_type is a text column with a check constraint.

DO $$
BEGIN
    -- Check if it's a check constraint on the column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'rooms_type_check'
    ) THEN
        ALTER TABLE rooms DROP CONSTRAINT rooms_type_check;
        ALTER TABLE rooms ADD CONSTRAINT rooms_type_check CHECK (type IN ('vegetation', 'flowering', 'drying', 'curing', 'mother', 'clones', 'general', 'germination', 'living_soil'));
    END IF;

    -- If it's a Postgres ENUM type, we would do:
    -- ALTER TYPE room_type ADD VALUE 'living_soil';
    -- But likely it's text. Let's assume text with check first. 
    -- If it fails, user can report.
END $$;
