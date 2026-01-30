-- Add detailed columns to genetics table
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'thc_percent') then
    alter table public.genetics add column thc_percent numeric;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'cbd_percent') then
    alter table public.genetics add column cbd_percent numeric;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'estimated_yield_g') then
    alter table public.genetics add column estimated_yield_g numeric;
  end if;
end $$;
