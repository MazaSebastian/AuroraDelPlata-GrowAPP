-- Add start_date column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS start_date date DEFAULT now();