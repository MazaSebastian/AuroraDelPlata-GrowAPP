import { supabase } from './supabaseClient';

export interface Profile {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
}

export const usersService = {
    async getUsers(): Promise<Profile[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');

        if (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }

        return data as Profile[];
    },

    async getProfileById(id: string): Promise<Profile | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data as Profile;
    }
};
