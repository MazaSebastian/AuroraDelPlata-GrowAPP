import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export interface DailyLog {
    id: string;
    crop_id: string;
    date: string;
    notes: string;
    // Other fields can be added later (temp, humidity, etc.)
}

export const dailyLogsService = {
    // ... (rest of the file until upsertLog)

    async upsertLog(log: Omit<DailyLog, 'id'>): Promise<DailyLog | null> {
        if (!supabase) return null;

        // First check if exists to get ID (or use upsert with constraint)
        const { data, error } = await supabase
            .from('chakra_daily_logs')
            .upsert(log, { onConflict: 'crop_id,date' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting log:', error);
            return null;
        }

        if (data) {
            // Get Current User for Notification Attribution
            const { data: { user } } = await supabase.auth.getUser();
            const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alguien';

            const shortNote = data.notes.length > 50 ? data.notes.substring(0, 50) + '...' : data.notes;
            notificationService.sendSelfNotification(
                `Nueva Bitácora (${userName}) 📒`,
                `${data.date}: ${shortNote}`
            );
        }

        return data as DailyLog;
    },

    async getLogsByCropId(cropId: string): Promise<DailyLog[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_daily_logs')
            .select('*')
            .eq('crop_id', cropId);

        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }

        return data as DailyLog[];
    },

    async deleteLog(id: string): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_daily_logs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting log:', error);
            return false;
        }
        return true;
    }
};
