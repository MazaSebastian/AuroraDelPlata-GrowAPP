-- Allow public (anon) read access to Dispensary Batches
-- This is required for the QR / Passport Page to work without login.
drop policy if exists "Enable read access for all users" on public.chakra_dispensary_batches;

create policy "Enable public read access" 
on public.chakra_dispensary_batches 
for select 
to anon, authenticated
using (true);

-- Also ensure 'anon' can read linked Genetic info if needed (assuming genetics table exists)
-- If genetics table policy is restricted, we might need to open it too or replicate data.
-- Assuming 'genetics' table is already readable or we only use batch data for now.
-- Verify policy on 'genetics' table if applicable.
