import { supabase } from './supabaseClient';

export interface MonthlyMetric {
    month: number;
    total_yield: number;
    total_expenses: number;
    total_revenue: number;
}

export interface GeneticPerformance {
    genetic_name: string;
    total_yield_g: number;
    harvest_count: number;
    avg_yield_per_harvest: number;
}

export interface CostCategory {
    category: string;
    total_amount: number;
    percentage: number;
}

export interface Expense {
    id: string;
    date: string;
    amount: number;
    category: 'electricity' | 'water' | 'nutrients' | 'substrates' | 'rent' | 'salaries' | 'maintenance' | 'equipment' | 'other';
    description?: string;
    room_id?: string;
    logged_by?: string;
}

export const metricsService = {
    // RPC Calls
    async getMonthlyMetrics(year: number): Promise<MonthlyMetric[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('get_monthly_metrics', { query_year: year });
        if (error) {
            console.error('Error fetching monthly metrics:', error);
            return [];
        }
        return data || [];
    },

    async getGeneticPerformance(): Promise<GeneticPerformance[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('get_genetic_performance');
        if (error) {
            console.error('Error fetching genetic performance:', error);
            return [];
        }
        return data || [];
    },

    async getCostBreakdown(startDate: string, endDate: string): Promise<CostCategory[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('get_cost_breakdown', { start_date: startDate, end_date: endDate });
        if (error) {
            console.error('Error fetching cost breakdown:', error);
            return [];
        }
        return data || [];
    },

    // Expenses CRUD
    async getExpenses(limit = 50): Promise<Expense[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('chakra_expenses')
            .select('*')
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching expenses:', error);
            return [];
        }
        return data || [];
    },

    async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense | null> {
        if (!supabase) return null;
        const { data, error } = await supabase.from('chakra_expenses').insert([expense]).select().single();
        if (error) {
            console.error('Error creating expense:', error);
            return null;
        }
        return data;
    },

    async deleteExpense(id: string): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase.from('chakra_expenses').delete().eq('id', id);
        if (error) return false;
        return true;
    }
};
