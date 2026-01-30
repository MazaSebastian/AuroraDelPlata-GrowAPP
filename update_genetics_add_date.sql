-- Add acquisition_date to genetics table
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'genetics' and column_name = 'acquisition_date') then
    alter table public.genetics add column acquisition_date date;
  end if;
end $$;
