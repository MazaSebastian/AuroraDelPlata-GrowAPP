import { supabase } from './supabaseClient';
import { Crop } from '../types';
import { notificationService } from './notificationService';

export const cropsService = {
    async getCrops(): Promise<Crop[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_crops')
            .select('*, rooms(*)')
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching crops:', error);
            return [];
        }

        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            location: c.location,
            startDate: c.start_date,
            estimatedHarvestDate: c.estimated_harvest_date,
            photoUrl: c.photo_url,
            partners: [], // Not yet implemented in DB fully
            status: c.status,
            color: c.color || 'green',
            rooms: c.rooms || []
        }));
    },

    async getCropById(id: string): Promise<Crop | null> {
        if (!supabase) return null;
        console.log("Fetching crop with ID:", id);

        const { data, error } = await supabase
            .from('chakra_crops')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching crop:', error);
            return null;
        }

        if (!data) {
            console.warn(`No crop found with ID: ${id}`);
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            location: data.location,
            startDate: data.start_date,
            estimatedHarvestDate: data.estimated_harvest_date,
            photoUrl: data.photo_url,
            partners: [],
            status: data.status,
            color: data.color || 'green'
        };
    },

    async createCrop(crop: Omit<Crop, 'id' | 'partners' | 'status'> & { estimatedHarvestDate?: string }): Promise<Crop | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('chakra_crops')
            .insert([{
                name: crop.name,
                location: crop.location,
                start_date: crop.startDate,
                estimated_harvest_date: crop.estimatedHarvestDate,
                status: 'active',
                color: crop.color || 'green'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating crop:', error);
            throw error; // Throw to let the component handle/display it
        }

        if (data) {
            // Get Current User for Notification Attribution
            const { data: { user } } = await supabase.auth.getUser();
            const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alguien';

            notificationService.sendSelfNotification(
                `Nuevo Cultivo Iniciado (${userName}) 🌱`,
                `Se ha creado "${data.name}" en ${data.location}`
            );
        }

        return {
            id: data.id,
            name: data.name,
            location: data.location,
            startDate: data.start_date,
            photoUrl: data.photo_url,
            partners: [],
            status: data.status,
            color: data.color || 'green'
        };
    },

    async deleteCrop(id: string): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_crops')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting crop:', error);
            return false;
        }

        return true;
    },

    async updateCrop(id: string, updates: Partial<Crop>): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_crops')
            .update({
                name: updates.name,
                location: updates.location,
                start_date: updates.startDate,
                estimated_harvest_date: updates.estimatedHarvestDate,
                status: updates.status,
                color: updates.color
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating crop:', error);
            return false;
        }

        return true;
    },

    async logHarvest(data: { cropId: string, roomName: string, amount: number, unit: 'g' | 'kg', notes?: string }): Promise<string | null> {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();

        const { data: logData, error } = await supabase
            .from('chakra_harvest_logs')
            .insert([{
                crop_id: data.cropId,
                room_name: data.roomName,
                yield_amount: data.amount,
                yield_unit: data.unit,
                notes: data.notes,
                logged_by: user?.id
            }])
            .select('id')
            .single();

        if (error) {
            console.error('Error logging harvest:', error);
            return null;
        }
        return logData?.id || null;
    }
};
