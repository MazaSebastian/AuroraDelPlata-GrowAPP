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
            .select('*, batches(*, genetic:genetics(*))')
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
            .select('*, batches(*, genetic:genetics(*))')
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
            .insert([{
                ...room,
                start_date: room.start_date // Ensure this is passed
            }])
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
        // 1. Unassign Batches currently in this room
        const { error: batchError } = await getClient()
            .from('batches')
            .update({ current_room_id: null })
            .eq('current_room_id', id);

        if (batchError) {
            console.error('Error unassigning batches:', batchError);
            // Proceeding cautiously, or return false? Usually better to try proceed or fail.
            // If this fails, delete will likely fail too.
        }

        // 2. Clear history references (Movements)
        await getClient()
            .from('batch_movements')
            .update({ from_room_id: null })
            .eq('from_room_id', id);

        await getClient()
            .from('batch_movements')
            .update({ to_room_id: null })
            .eq('to_room_id', id);

        // 3. Delete Linked Tasks
        // The room deletion will fail if tasks reference it.
        await getClient()
            .from('chakra_tasks')
            .delete()
            .eq('room_id', id);

        // 4. Delete Room (Now safe from FK constraints)
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

    async moveBatch(batchId: string, fromRoomId: string | null, toRoomId: string, notes?: string, quantityToMove?: number): Promise<boolean> {
        // Fetch source batch first to check quantity if splitting
        const { data: sourceBatch } = await getClient()
            .from('batches')
            .select('*')
            .eq('id', batchId)
            .single();

        if (!sourceBatch) return false;

        // Check if it's a split
        if (quantityToMove && quantityToMove < sourceBatch.quantity) {
            // SPLIT LOGIC
            // 1. Decrement Source
            const { error: updateError } = await getClient()
                .from('batches')
                .update({ quantity: sourceBatch.quantity - quantityToMove })
                .eq('id', batchId);

            if (updateError) {
                console.error('Error updating source batch quantity:', updateError);
                return false;
            }

            // 2. Create New Batch for the moved part
            const { data: newBatch, error: createError } = await getClient()
                .from('batches')
                .insert([{
                    name: `${sourceBatch.name}-M`, // Suffix for moved/split? Or just kept same name convention? Let's append -M or similar or keep format verify. Ideally generate new barcode but maybe keeping lineage is enough.
                    // Actually, usually we might want a new name or just keep same genetic.
                    // Let's copy properties
                    quantity: quantityToMove,
                    stage: sourceBatch.stage,
                    genetic_id: sourceBatch.genetic_id,
                    start_date: sourceBatch.start_date,
                    current_room_id: toRoomId,
                    parent_batch_id: batchId // Link to parent
                }])
                .select()
                .single();

            if (createError || !newBatch) {
                console.error('Error creating split batch:', createError);
                return false;
            }

            // 3. Log Movement for the NEW batch
            await getClient()
                .from('batch_movements')
                .insert([{
                    batch_id: newBatch.id,
                    from_room_id: fromRoomId,
                    to_room_id: toRoomId,
                    notes: `${notes || ''} (Split ${quantityToMove} copies)`
                }]);

            return true;

        } else {
            // FULL MOVE LOGIC (Existing)
            // 1. Update Batch Location
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
            }

            return true;
        }
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
        // 1. Delete associated movements (Manual Cascade)
        await getClient()
            .from('batch_movements')
            .delete()
            .eq('batch_id', batchId);

        // 2. Delete the batch
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
