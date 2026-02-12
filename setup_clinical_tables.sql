-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Clinical Admissions Table (Baseline)
create table if not exists public.clinical_admissions (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.aurora_patients(id) on delete cascade not null,
    patient_hash text not null, -- Anonymized ID for research view
    
    -- Diagnosis & Pharmacology
    diagnosis_cie11 jsonb default '[]'::jsonb, -- Array of strings/objects
    medications jsonb default '[]'::jsonb, -- Current meds & interactions
    
    -- Baseline Metrics (The "Before" state)
    baseline_qol int check (baseline_qol between 0 and 100), -- Quality of Life (0-100)
    baseline_pain_avg int check (baseline_pain_avg between 0 and 10), -- EVA (0-10)
    baseline_pain_worst int check (baseline_pain_worst between 0 and 10), -- EVA (0-10)
    
    notes text,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id)
);

-- 2. Clinical Evolutions Table (Follow-up)
create table if not exists public.clinical_evolutions (
    id uuid primary key default uuid_generate_v4(),
    admission_id uuid references public.clinical_admissions(id) on delete cascade not null,
    
    date date default current_date not null,
    
    -- Traceability
    batch_id uuid, -- Optional link to inventory/batch used
    
    -- Assessment
    eva_score int check (eva_score between 0 and 10),
    improvement_percent numeric(5,2), -- Calculated field (e.g. 15.50%)
    
    -- Detailed Data
    sparing_effect jsonb default '[]'::jsonb, -- [{ drug: "Ibuprofeno", reduction: "50%" }]
    adverse_effects jsonb default '[]'::jsonb, -- [{ effect: "Dizziness", intensity: "mild" }]
    
    notes text,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id)
);

-- 3. RLS Policies
alter table public.clinical_admissions enable row level security;
alter table public.clinical_evolutions enable row level security;

-- Policy: Authenticated users can read/write (Modify as needed for roles)
create policy "Enable all access for authenticated users" on public.clinical_admissions
    for all using (auth.role() = 'authenticated');

create policy "Enable all access for authenticated users" on public.clinical_evolutions
    for all using (auth.role() = 'authenticated');

-- Indexes for performance
create index if not exists idx_clinical_admissions_patient on public.clinical_admissions(patient_id);
create index if not exists idx_clinical_evolutions_admission on public.clinical_evolutions(admission_id);
