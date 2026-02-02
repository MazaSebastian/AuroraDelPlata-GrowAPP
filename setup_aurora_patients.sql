-- Create Aurora Patients Table (CRM)
-- Extends the basic 'profiles' table with medical/legal data.

create table if not exists public.aurora_patients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Link to Auth Profile (1:1)
  profile_id uuid references public.profiles(id) not null unique,
  
  -- Reprocann Data
  reprocann_number text,
  reprocann_status text default 'pending' check (reprocann_status in ('active', 'pending', 'expired', 'rejected')),
  expiration_date date,
  
  -- Dispensing Limits
  monthly_limit numeric default 40 check (monthly_limit >= 0), -- Grams per month
  
  -- Internal Notes
  notes text,
  
  -- Audit
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.aurora_patients enable row level security;

-- Policies
-- 1. Read: Authenticated staff can view patient details
create policy "Allow staff to view patients" 
on public.aurora_patients for select 
to authenticated 
using (true);

-- 2. Write: Authenticated staff can manage patients
create policy "Allow staff to insert patients" 
on public.aurora_patients for insert 
to authenticated 
with check (true);

create policy "Allow staff to update patients" 
on public.aurora_patients for update 
to authenticated 
using (true);

-- Indexes
create index if not exists idx_aurora_patients_profile on public.aurora_patients(profile_id);
create index if not exists idx_aurora_patients_status on public.aurora_patients(reprocann_status);
