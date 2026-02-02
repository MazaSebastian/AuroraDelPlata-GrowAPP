-- RPC Functions for Metrics Dashboard

-- 1. Get Monthly Financials & Yields
create or replace function get_monthly_metrics(query_year int)
returns table (
    month int,
    total_yield numeric,
    total_expenses numeric,
    total_revenue numeric
)
language plpgsql
as $$
begin
    return query
    with months as (
        select generate_series(1, 12) as m
    ),
    yields as (
        select 
            extract(month from created_at)::int as m, 
            sum(yield_amount) as amount
        from chakra_harvest_logs
        where extract(year from created_at) = query_year
        group by 1
    ),
    expenses as (
        select 
            extract(month from date)::int as m, 
            sum(amount) as total
        from chakra_expenses
        where extract(year from date) = query_year
        group by 1
    ),
    revenue as (
        select 
            extract(month from created_at)::int as m, 
            -- Revenue is usually Positive sum where type='dispense' (sale) if we tracked it as positive 
            -- But usually dispense removes stock. 
            -- Let's assume transaction_value is stored as positive for SALES.
            sum(transaction_value) as total
        from chakra_dispensary_movements
        where extract(year from created_at) = query_year
        and type = 'dispense' -- Assuming dispense acts as sale/outflow
        group by 1
    )
    select 
        months.m,
        coalesce(yields.amount, 0) as total_yield,
        coalesce(expenses.total, 0) as total_expenses,
        coalesce(revenue.total, 0) as total_revenue
    from months
    left join yields on months.m = yields.m
    left join expenses on months.m = expenses.m
    left join revenue on months.m = revenue.m
    order by months.m;
end;
$$;

-- 2. Performance by Genetic (Yield per Plant approximation)
-- This is tricky without exact plant counts per harvest, but we can average yield per batch if 1 batch = 1 harvest log usually.
create or replace function get_genetic_performance()
returns table (
    genetic_name text,
    total_yield_g numeric,
    harvest_count bigint,
    avg_yield_per_harvest numeric
)
language plpgsql
as $$
begin
    return query
    select 
        -- If harvest logs had genetic_id it would be better, but we rely on notes or joining back to crop/batch.
        -- For V1 we might rely on 'room_name' or if we can link batch.
        -- Wait, chakra_dispensary_batches has 'strain_name' and links to 'harvest_log_id'.
        -- So we can join dispensary batches to get strain name from harvest log?
        -- Actually distinct harvest logs don't directly store strain name in the table definition I saw earlier, 
        -- but dispensary_batches DOES refer to harvest_logs.
        d.strain_name,
        sum(h.yield_amount) as total_yield_g,
        count(distinct h.id) as harvest_count,
        round(avg(h.yield_amount), 2) as avg_yield_per_harvest
    from chakra_harvest_logs h
    join chakra_dispensary_batches d on d.harvest_log_id = h.id
    group by d.strain_name
    order by total_yield_g desc;
end;
$$;

-- 3. Cost Breakdown
create or replace function get_cost_breakdown(start_date date, end_date date)
returns table (
    category text,
    total_amount numeric,
    percentage numeric
)
language plpgsql
as $$
declare 
    total_sum numeric;
begin
    select sum(amount) into total_sum from chakra_expenses where date between start_date and end_date;
    
    return query
    select 
        e.category,
        sum(e.amount) as total_amount,
        case when total_sum > 0 then round((sum(e.amount) / total_sum) * 100, 1) else 0 end as percentage
    from chakra_expenses e
    where e.date between start_date and end_date
    group by e.category
    order by total_amount desc;
end;
$$;
