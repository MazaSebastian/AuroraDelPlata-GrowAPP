-- Backfill tracking codes for existing batches
-- Format: {GeneticName}-{Position} (e.g., "OgKush-A1")

WITH batch_names AS (
    SELECT 
        b.id,
        COALESCE(g.name, b.name, 'Unknown') as genetic_name,
        COALESCE(b.grid_position, 'X') as position
    FROM public.batches b
    LEFT JOIN public.genetics g ON b.genetic_id = g.id
    WHERE b.tracking_code IS NULL
)
UPDATE public.batches b
SET tracking_code = bn.genetic_name || '-' || bn.position
FROM batch_names bn
WHERE b.id = bn.id;
