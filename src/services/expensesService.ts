
import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export interface CashMovement {
    id?: string;
    type: 'INGRESO' | 'EGRESO';
    concept: string;
    amount: number;
    date: string;
    owner: 'Sebastian' | 'Santiago' | string;
    created_at?: string;
    // Legacy fields likely not needed for new UI but present in DB
    owner_id?: string;
    organization_id?: string;
}

export const expensesService = {
    async getMovements() {
        if (!supabase) return [];
        console.log("Fetching movements...");
        const { data, error } = await supabase
            .from('cash_movements')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching movements:', error);
            return [];
        }
        return data as CashMovement[];
    },

    async createMovement(movement: CashMovement) {
        if (!supabase) return { success: false, error: "No Supabase client" };

        // Auto-generate ID if not present (legacy format)
        const newId = movement.id || `mov-${Date.now()}`;

        const payload = { ...movement, id: newId };

        const { data, error } = await supabase
            .from('cash_movements')
            .insert([payload])
            .select();

        if (error) {
            console.error('Error creating movement:', error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }
        if (data?.[0]) {
            const m = data[0];
            // Get Current User for Notification Attribution
            const { data: { user } } = await supabase.auth.getUser();
            const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || m.owner || 'Alguien';

            // Fire and forget notification
            notificationService.sendSelfNotification(
                `Nuevo ${m.type === 'INGRESO' ? 'Ingreso 💰' : 'Gasto 💸'} (${userName})`,
                `${m.concept}: $${m.amount}`
            );
        }

        return { success: true, data: data?.[0] as CashMovement };
    },

    async deleteMovement(id: string) {
        if (!supabase) return false;
        const { error } = await supabase
            .from('cash_movements')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting movement:', error);
            return false;
        }
        return true;
    }
};
