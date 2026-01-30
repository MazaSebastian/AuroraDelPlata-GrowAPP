-- Add 'medium' column to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS medium text;
