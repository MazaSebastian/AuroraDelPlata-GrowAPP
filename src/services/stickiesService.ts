import { supabase } from './supabaseClient';
import { StickyNote } from '../types';

export const stickiesService = {
    async getStickies(roomId?: string): Promise<StickyNote[]> {
        if (!supabase) return [];

        let query = supabase
            .from('chakra_stickies')
            .select('*')
            .order('created_at', { ascending: false });

        if (roomId) {
            query = query.eq('room_id', roomId);
        } else {
            // If no room specified, maybe fetch only global/dashboard stickies? 
            // Or fetch all? For now, let's fetch those where room_id is null to avoid cluttering dashboard with calendar notes.
            query = query.is('room_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching stickies FULL DETAILS:', JSON.stringify(error, null, 2));
            return [];
        }
        return data || [];
    },

    async createSticky(content: string, color: StickyNote['color'] = 'yellow', roomId?: string, targetDate?: string): Promise<StickyNote | null> {
        if (!supabase) return null;

        // Get current user for attribution
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alguien';

        const { data, error } = await supabase
            .from('chakra_stickies')
            .insert([
                {
                    content,
                    color,
                    created_by: userName,
                    user_id: user?.id,
                    room_id: roomId || null,
                    target_date: targetDate || null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating sticky:', error);
            return null;
        }
        return data;
    },

    async updateSticky(id: string, updates: Partial<StickyNote>): Promise<StickyNote | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('chakra_stickies')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating sticky:', error);
            return null;
        }
        return data;
    },

    async deleteSticky(id: string): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_stickies')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting sticky:', error);
            return false;
        }
        return true;
    },


};
