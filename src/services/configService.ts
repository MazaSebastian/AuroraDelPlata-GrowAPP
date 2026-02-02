import { supabase } from './supabaseClient';

export interface AppConfig {
    key: string;
    value: any;
    description?: string;
    updated_at?: string;
}

export const configService = {
    async getConfig(key: string): Promise<any> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('app_configurations')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            console.error(`Error fetching config ${key}:`, error);
            return null;
        }

        return data?.value;
    },

    async updateConfig(key: string, value: any): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('app_configurations')
            .update({
                value: value,
                updated_at: new Date().toISOString()
            })
            .eq('key', key);

        if (error) {
            console.error(`Error updating config ${key}:`, error);
            return false;
        }

        return true;
    }
};
