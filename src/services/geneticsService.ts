import { supabase } from './supabaseClient';
import { Genetic } from '../types/genetics';

const getClient = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
};

export const geneticsService = {
    async getGenetics(): Promise<Genetic[]> {
        const { data, error } = await getClient()
            .from('genetics')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching genetics:', error);
            return [];
        }
        return data || [];
    },

    async createGenetic(genetic: Omit<Genetic, 'id' | 'created_at'>): Promise<Genetic | null> {
        const { data, error } = await getClient()
            .from('genetics')
            .insert([genetic])
            .select()
            .single();

        if (error) {
            console.error('Error creating genetic:', error);
            return null;
        }
        return data;
    },

    async updateGenetic(id: string, updates: Partial<Genetic>): Promise<boolean> {
        const { error } = await getClient()
            .from('genetics')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating genetic:', error);
            return false;
        }
        return true;
    },

    async deleteGenetic(id: string): Promise<boolean> {
        const { error } = await getClient()
            .from('genetics')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting genetic:', error);
            return false;
        }
        return true;
    }
};
