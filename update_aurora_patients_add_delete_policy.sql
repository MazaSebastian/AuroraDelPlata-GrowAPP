-- Add Delete Policy for Aurora Patients
create policy "Allow staff to delete patients" 
on public.aurora_patients for delete 
to authenticated 
using (true);
