import { supabase } from './supabaseClient';
import { Room, Batch, BatchStage } from '../types/rooms';

const getClient = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
};

export const roomsService = {
    // --- ROOMS ---
    async getRooms(spotId?: string): Promise<Room[]> {
        let query = getClient()
            .from('rooms')
            .select('*, batches(*)')
            .order('name');

        if (spotId) {
            query = query.eq('spot_id', spotId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
        return data || [];
    },

    async getRoomById(id: string): Promise<Room | null> {
        const { data, error } = await getClient()
            .from('rooms')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching room:', error);
            return null;
        }
        return data;
    },

    async createRoom(room: Omit<Room, 'id' | 'created_at'> & { created_at?: string }): Promise<Room | null> {
        const { data, error } = await getClient()
            .from('rooms')
            .insert([room])
            .select()
            .single();

        if (error) {
            console.error('Error creating room:', error);
            return null;
        }
        return data;
    },

    async updateRoom(id: string, updates: Partial<Room>): Promise<boolean> {
        const { error } = await getClient()
            .from('rooms')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating room:', error);
            return false;
        }
        return true;
    },

    async deleteRoom(id: string): Promise<boolean> {
        const { error } = await getClient()
            .from('rooms')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting room:', error);
            return false;
        }
        return true;
    },

    // --- BATCHES ---
    async getBatches(): Promise<Batch[]> {
        const { data, error } = await getClient()
            .from('batches')
            .select('*, room:rooms(id, name, type), genetic:genetics(name, type)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching batches:', error);
            return [];
        }
        return data || [];
    },

    async getBatchesByRoom(roomId: string): Promise<Batch[]> {
        const { data, error } = await getClient()
            .from('batches')
            .select('*')
            .eq('current_room_id', roomId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching batches for room:', error);
            return [];
        }
        return data || [];
    },

    async createBatch(batch: Omit<Batch, 'id' | 'created_at'>): Promise<Batch | null> {
        const { data, error } = await getClient()
            .from('batches')
            .insert([batch])
            .select()
            .single();

        if (error) {
            console.error('Error creating batch:', error);
            return null;
        }
        return data;
    },

    async moveBatch(batchId: string, fromRoomId: string | null, toRoomId: string, notes?: string): Promise<boolean> {
        // 1. Update Batch Location and potentially Stage (logic can be enhanced later)
        const { error: updateError } = await getClient()
            .from('batches')
            .update({ current_room_id: toRoomId })
            .eq('id', batchId);

        if (updateError) {
            console.error('Error moving batch:', updateError);
            return false;
        }

        // 2. Log Movement
        const { error: logError } = await getClient()
            .from('batch_movements')
            .insert([{
                batch_id: batchId,
                from_room_id: fromRoomId,
                to_room_id: toRoomId,
                notes: notes
            }]);

        if (logError) {
            console.error('Error logging movement:', logError);
            // Not critical enough to fail the whole operation, but good to know
        }

        return true;
    },

    async updateBatchStage(batchId: string, newStage: BatchStage): Promise<boolean> {
        const { error } = await getClient()
            .from('batches')
            .update({ stage: newStage })
            .eq('id', batchId);

        if (error) {
            console.error('Error updating batch stage:', error);
            return false;
        }
        return true;
    },

    async updateBatch(batchId: string, updates: Partial<Batch>): Promise<boolean> {
        const { error } = await getClient()
            .from('batches')
            .update(updates)
            .eq('id', batchId);

        if (error) {
            console.error('Error updating batch:', error);
            return false;
        }
        return true;
    },

    async deleteBatch(batchId: string): Promise<boolean> {
        const { error } = await getClient()
            .from('batches')
            .delete()
            .eq('id', batchId);

        if (error) {
            console.error('Error deleting batch:', error);
            return false;
        }
        return true;
    }
};
