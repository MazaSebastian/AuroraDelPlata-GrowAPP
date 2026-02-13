import { supabase } from './supabaseClient';
import { Room, Batch, BatchStage, CloneMap } from '../types/rooms';

const getClient = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
};

// Helper for Excel-style row labels (A, ..., Z, AA, AB, ...)
const getRowLabel = (n: number) => {
    let s = "";
    while (n > 0) {
        let remainder = (n - 1) % 26;
        s = String.fromCharCode(65 + remainder) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
};

export const roomsService = {

    // --- ROOMS ---
    async getRooms(spotId?: string): Promise<Room[]> {
        let query = getClient()
            .from('rooms')
            .select('*, batches(*, genetic:genetics(*), parent_batch:batches!parent_batch_id(name)), spot:chakra_crops(name), clone_maps(*)')
            .order('order_index', { ascending: true })
            .order('name', { ascending: true });

        if (spotId) {
            query = query.eq('spot_id', spotId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching rooms:', error);
            return [];
        }
        if (data) {
            data.forEach(room => {
                if (room.batches) {
                    room.batches = room.batches.filter((b: Batch) => !b.discarded_at);
                }
            });
        }
        return data || [];
    },

    async getRoomById(id: string): Promise<Room | null> {
        const { data, error } = await getClient()
            .from('rooms')
            .select('*, batches:batches!current_room_id(*, genetic:genetics(*), parent_batch:batches!parent_batch_id(name)), spot:chakra_crops(name), clone_maps(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching room:', error);
            return null;
        }
        if (data) {
            // Filter out discarded batches from the result
            if (data.batches) {
                data.batches = data.batches.filter((b: Batch) => !b.discarded_at);
            }
        }
        return data;
    },

    async createRoom(room: Omit<Room, 'id' | 'created_at'> & { created_at?: string }): Promise<Room | null> {
        const { data, error } = await getClient()
            .from('rooms')
            .insert([{
                ...room,
                start_date: room.start_date, // Ensure this is passed
                grid_rows: room.grid_rows,
                grid_columns: room.grid_columns
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

    async updateRoomOrder(orderedRooms: Room[]): Promise<boolean> {
        // Prepare bulk update or sequential updates
        // Since Supabase doesn't support bulk update with different values easily in one query without a function,
        // we'll run sequential updates or a custom RPC if performance becomes an issue.
        // For < 20 rooms, sequential is fine.

        try {
            const updates = orderedRooms.map((room, index) =>
                getClient()
                    .from('rooms')
                    .update({ order_index: index })
                    .eq('id', room.id)
            );

            await Promise.all(updates);
            return true;
        } catch (error) {
            console.error('Error updating room order:', error);
            return false;
        }
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

    // --- Clone Maps ---

    async getCloneMaps(roomId: string): Promise<CloneMap[]> {
        const { data, error } = await getClient()
            .from('clone_maps')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching clone maps:', error);
            // return []; // Or assume empty
            return [];
        }
        return data || [];
    },

    async createCloneMap(map: Omit<CloneMap, 'id' | 'created_at'>): Promise<CloneMap | null> {
        const { data, error } = await getClient()
            .from('clone_maps')
            .insert([map])
            .select()
            .single();

        if (error) {
            console.error('Error creating clone map:', error);
            throw error;
        }
        return data;
    },

    async deleteCloneMap(id: string): Promise<void> {
        const { error } = await getClient()
            .from('clone_maps')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting clone map:', error);
            throw error;
        }
    },

    async updateCloneMapPosition(id: string, x: number, y: number): Promise<boolean> {
        const { error } = await getClient()
            .from('clone_maps')
            .update({ position_x: x, position_y: y })
            .eq('id', id);

        if (error) {
            console.error('Error updating clone map position:', error);
            return false;
        }
        return true;
    },

    async updateCloneMap(id: string, updates: { name?: string, grid_rows?: number, grid_columns?: number }): Promise<CloneMap | null> {
        const { data, error } = await getClient()
            .from('clone_maps')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating clone map:', error);
            throw error;
        }
        return data;
    },
    // --- GENETICS ---
    async getGenetics(): Promise<any[]> {
        const { data, error } = await getClient()
            .from('genetics')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching genetics:', error);
            return [];
        }
        return data || [];
    },

    // --- BATCHES ---
    async getBatches(): Promise<Batch[]> {
        const { data, error } = await getClient()
            .from('batches')
            .select('*, room:rooms(id, name, type), genetic:genetics(name, type)')
            .is('discarded_at', null) // Only active batches
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
            .is('discarded_at', null) // Only active batches
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching batches for room:', error);
            return [];
        }
        return data || [];
    },

    async createBatch(batch: Omit<Batch, 'id' | 'created_at'>, userId?: string): Promise<Batch | null> {
        const { data, error } = await getClient()
            .from('batches')
            .insert([batch])
            .select()
            .single();

        if (error) {
            console.error('Error creating batch:', error);
            return null;
        }

        // Log Creation
        if (data) {
            await getClient()
                .from('batch_movements')
                .insert([{
                    batch_id: data.id,
                    to_room_id: data.current_room_id,
                    notes: 'Creación de Lote',
                    created_by: userId
                }]);
        }

        return data;
    },



    async updateBatchAlert(batchId: string, hasAlert: boolean): Promise<boolean> {
        const { error } = await getClient()
            .from('batches')
            .update({ has_alert: hasAlert })
            .eq('id', batchId);

        if (error) {
            console.error('Error updating batch alert:', error);
            return false;
        }
        return true;
    },

    async updateBatchStage(batchId: string, newStage: BatchStage, userId?: string): Promise<boolean> {
        // 1. Get current room for logging
        const { data: batch } = await getClient().from('batches').select('current_room_id, stage').eq('id', batchId).single();

        const { error } = await getClient()
            .from('batches')
            .update({ stage: newStage })
            .eq('id', batchId);

        if (error) {
            console.error('Error updating batch stage:', error);
            return false;
        }

        // 2. Log Movement
        if (userId && batch) {
            await getClient().from('batch_movements').insert([{
                batch_id: batchId,
                from_room_id: batch.current_room_id,
                to_room_id: batch.current_room_id,
                moved_at: new Date().toISOString(),
                notes: `Cambio de etapa: ${batch.stage} -> ${newStage}`,
                created_by: userId
            }]);
        }

        return true;
    },

    async updateBatch(batchId: string, updates: Partial<Batch>, userId?: string, actionDetail?: string): Promise<boolean> {
        // 1. Get current info for logging if needed
        let currentRoomId = updates.current_room_id;
        if (!currentRoomId && userId) {
            const { data: batch } = await getClient().from('batches').select('current_room_id').eq('id', batchId).single();
            currentRoomId = batch?.current_room_id;
        }

        const { error } = await getClient()
            .from('batches')
            .update(updates)
            .eq('id', batchId);

        if (error) {
            console.error('Error updating batch:', error);
            return false;
        }

        // 2. Log Action if userId provided
        if (userId && actionDetail) {
            // Use the actual note content if available in updates, otherwise use the action description
            const logNote = updates.notes ? `${actionDetail}: ${updates.notes}` : actionDetail;

            await getClient().from('batch_movements').insert([{
                batch_id: batchId,
                from_room_id: currentRoomId,
                to_room_id: currentRoomId,
                moved_at: new Date().toISOString(),
                notes: logNote,
                created_by: userId
            }]);
        }

        return true;
    },

    async deleteBatch(batchId: string, reason?: string, userId?: string): Promise<boolean> {
        // SOFT DELETE LOGIC

        // 1. Fetch info for logging
        const { data: batch } = await getClient().from('batches').select('current_room_id').eq('id', batchId).single();
        const roomId = batch?.current_room_id;

        // 2. Mark as discarded
        const { error } = await getClient()
            .from('batches')
            .update({
                discarded_at: new Date().toISOString(),
                // discard_reason: reason || 'Eliminado manualmente', 
                current_room_id: null,
                clone_map_id: null,
                grid_position: null
            })
            .eq('id', batchId);

        if (error) {
            console.error('Error soft deleting batch:', error);
            return false;
        }

        // 3. Log Deletion/Death
        await getClient()
            .from('batch_movements')
            .insert([{
                batch_id: batchId,
                from_room_id: roomId,
                to_room_id: null, // Goes nowhere
                notes: `Eliminado/Baja: ${reason || 'Manual'}`,
                created_by: userId,
                moved_at: new Date().toISOString()
            }]);

        return true;
    },

    async deleteBatches(batchIds: string[], reason?: string, userId?: string): Promise<boolean> {
        if (batchIds.length === 0) return true;

        // 1. Fetch room info for logging BEFORE deleting (soft delete clears room_id)
        const { data: batchesInfo } = await getClient()
            .from('batches')
            .select('id, current_room_id')
            .in('id', batchIds);

        const batchRoomMap = new Map(batchesInfo?.map(b => [b.id, b.current_room_id]) || []);

        const CHUNK_SIZE = 50;
        let hasError = false;

        // 2. Mark as discarded in Chunks
        for (let i = 0; i < batchIds.length; i += CHUNK_SIZE) {
            const chunk = batchIds.slice(i, i + CHUNK_SIZE);

            const { error } = await getClient()
                .from('batches')
                .update({
                    discarded_at: new Date().toISOString(),
                    // discard_reason: reason || 'Eliminación Masiva', 
                    current_room_id: null,
                    clone_map_id: null,
                    grid_position: null
                })
                .in('id', chunk);

            if (error) {
                console.error(`Error soft deleting batches chunk ${i} - ${i + CHUNK_SIZE}:`, error);
                hasError = true;
            }
        }

        if (hasError) {
            console.warn("Some chunks failed during bulk delete. Attempting fallback on remaining/failed items is complex. Returning false to indicate partial failure.");
            return false;
        }

        // 3. Log Movements (Chunked)
        const allLogs = batchIds.map(id => ({
            batch_id: id,
            from_room_id: batchRoomMap.get(id) || null,
            to_room_id: null,
            notes: `Eliminado/Baja Masiva: ${reason || 'Manual'}`,
            created_by: userId,
            moved_at: new Date().toISOString()
        }));

        const LOG_CHUNK_SIZE = 100;
        for (let i = 0; i < allLogs.length; i += LOG_CHUNK_SIZE) {
            const logChunk = allLogs.slice(i, i + LOG_CHUNK_SIZE);
            const { error: logError } = await getClient().from('batch_movements').insert(logChunk);
            if (logError) {
                console.error('Error logging batch movements chunk:', logError);
            }
        }

        return true;
    },

    async batchAssignToMap(sourceBatchId: string, mapId: string, positions: string[], roomId: string, userId?: string): Promise<boolean> {
        const qty = positions.length;
        if (qty === 0) return true;

        // 1. Fetch Source
        const { data: sourceBatch } = await getClient()
            .from('batches')
            .select('*')
            .eq('id', sourceBatchId)
            .single();

        if (!sourceBatch || sourceBatch.quantity < qty) {
            console.error("Not enough quantity");
            return false;
        }

        // 2. Decrement Source (ONE CALL)
        const { error: updateError } = await getClient()
            .from('batches')
            .update({ quantity: sourceBatch.quantity - qty })
            .eq('id', sourceBatchId);

        if (updateError) {
            console.error("Error updating source qty", updateError);
            return false;
        }

        // 2a. Fetch Genetic Info for Nomenclatura
        const { data: genetic } = await getClient()
            .from('genetics')
            .select('nomenclatura') // Fetch explicit field
            .eq('id', sourceBatch.genetic_id)
            .single();

        // Use defined nomenclatura or fallback to 'GEN'
        const prefix = genetic?.nomenclatura || 'GEN';

        // 2b. Count existing batches of this genetic to determine sequence start
        // We count ALL batches of this genetic used for tracking
        const { count } = await getClient()
            .from('batches')
            .select('*', { count: 'exact', head: true })
            .eq('genetic_id', sourceBatch.genetic_id)
            .not('tracking_code', 'is', null);

        let sequenceStart = (count || 0) + 1;

        // 3. Prepare Bulk Insert Data with Tracking Codes
        const newBatches = positions.map((pos, index) => {
            const sequenceNumber = sequenceStart + index;
            const trackingCode = `${prefix}-${String(sequenceNumber).padStart(3, '0')}`;

            return {
                name: `${trackingCode}`, // Name becomes the tracking code for clarity
                quantity: 1,
                stage: sourceBatch.stage,
                genetic_id: sourceBatch.genetic_id,
                start_date: sourceBatch.start_date,
                current_room_id: roomId,
                clone_map_id: mapId,
                grid_position: pos,
                parent_batch_id: sourceBatchId,
                tracking_code: trackingCode
            };
        });

        // 4. Bulk Insert (ONE CALL)
        const { data: createdBatches, error: insertError } = await getClient()
            .from('batches')
            .insert(newBatches)
            .select();

        if (insertError) {
            console.error("Error bulk inserting batches", insertError);
            // Ideally revert source update here, but for now log error.
            return false;
        }

        // 5. Bulk Log Movements (ONE CALL)
        if (createdBatches && createdBatches.length > 0) {
            const movements = createdBatches.map(b => ({
                batch_id: b.id,
                from_room_id: sourceBatch.current_room_id,
                to_room_id: roomId,
                notes: `Creación (Auto-Assign): ${b.tracking_code}`,
                created_by: userId
            }));

            await getClient().from('batch_movements').insert(movements);
        }

        return true;
    },

    async distributeBatchToMap(sourceBatchId: string, mapId: string, startRow: number, startCol: number, mapRows: number, mapCols: number, userId?: string): Promise<boolean> {
        // 1. Fetch Source Batch
        const { data: sourceBatch } = await getClient()
            .from('batches')
            .select('*')
            .eq('id', sourceBatchId)
            .single();

        if (!sourceBatch || sourceBatch.quantity <= 0) return false;

        const totalToDistribute = sourceBatch.quantity;
        const positions: string[] = [];

        // 2. Calculate Positions (Row-major order)
        let currentRow = startRow;
        let currentCol = startCol;

        for (let i = 0; i < totalToDistribute; i++) {
            // Check boundaries
            if (currentRow > mapRows) break; // Should not happen if UI restricts, but safety check.

            // Format position A1, A2... B1...
            const rowChar = getRowLabel(currentRow);
            const colNum = currentCol;
            positions.push(`${rowChar}${colNum}`);

            // Increment
            currentCol++;
            if (currentCol > mapCols) {
                currentCol = 1;
                currentRow++;
            }
        }

        if (positions.length < totalToDistribute) {
            console.warn("Not enough space on map to distribute all units.");
            // Optional: return false or distribute partial? 
            // For now, fail if not enough space to preserve integrity of "Lote"
            return false;
        }

        // 3. Mark Source Batch as Discarded (Converted)
        // We do this BEFORE creating new ones to avoid double counting if something fails, 
        // though strictly transactional would be better. Supabase JS doesn't support concise transactions easily without RPC.
        // We will assume success.

        const { error: updateError } = await getClient()
            .from('batches')
            .update({
                discarded_at: new Date().toISOString(),
                discard_reason: 'Distribuido en Mapa (Individualización)',
                quantity: 0, // Set to 0 to be sure
                current_room_id: null,
                notes: `Distribuido en mapa ${mapId} como ${totalToDistribute} plantas individuales. Log: ${userId || 'No User'}`
            })
            .eq('id', sourceBatchId);

        if (updateError) {
            console.error("Error archiving source batch", updateError);
            return false;
        }

        // 4. Create Individual Batches
        // Reuse batchAssignToMap logic for tracking codes? 
        // We need to generate tracking codes based on genetic.

        const { data: genetic } = await getClient()
            .from('genetics')
            .select('nomenclatura')
            .eq('id', sourceBatch.genetic_id)
            .single();

        const prefix = genetic?.nomenclatura || 'GEN';

        // Get sequence start
        const { count } = await getClient()
            .from('batches')
            .select('*', { count: 'exact', head: true })
            .eq('genetic_id', sourceBatch.genetic_id)
            .not('tracking_code', 'is', null);

        let sequenceStart = (count || 0) + 1;

        const newBatches = positions.map((pos, index) => {
            const sequenceNumber = sequenceStart + index;
            const trackingCode = `${prefix}-${String(sequenceNumber).padStart(3, '0')}`;

            return {
                name: `${trackingCode}`,
                quantity: 1,
                stage: sourceBatch.stage, // Keep same stage (Vegetation)
                genetic_id: sourceBatch.genetic_id,
                start_date: sourceBatch.start_date,
                current_room_id: sourceBatch.current_room_id, // Same room
                clone_map_id: mapId,
                grid_position: pos,
                // INHERIT PARENT ID for Color Consistency (Flatten Lineage)
                // If source has a parent, use it (so we stay siblings of the group). 
                // If not, use source ID (we are the root).
                parent_batch_id: sourceBatch.parent_batch_id || sourceBatchId,
                tracking_code: trackingCode,
                notes: sourceBatch.notes?.match(/\[Grupo:.*?\]/)?.[0] || ''
            };
        });

        const { data: insertedBatches, error: insertError } = await getClient()
            .from('batches')
            .insert(newBatches)
            .select('id, tracking_code');

        if (insertError) {
            console.error("Error creating individual batches", insertError);
            return false;
        }

        // 5. Log Distribution
        if (insertedBatches && insertedBatches.length > 0) {
            const movements = insertedBatches.map(b => ({
                batch_id: b.id,
                from_room_id: sourceBatch.current_room_id,
                to_room_id: sourceBatch.current_room_id,
                notes: `Individualización en Mapa: ${b.tracking_code}`,
                created_by: userId
            }));

            await getClient().from('batch_movements').insert(movements);
        }

        return true;
    },

    async moveBatch(batchId: string, fromRoomId: string | null, toRoomId: string | null, notes?: string, quantity?: number, gridPosition?: string, cloneMapId?: string, userId?: string): Promise<boolean> {
        // 1. Check if we need to split
        if (quantity) {
            const { data: batch } = await getClient().from('batches').select('quantity, name, genetic_id, stage, start_date').eq('id', batchId).single();

            if (batch && batch.quantity > quantity) {
                // SPLIT LOGIC
                const newQuantity = batch.quantity - quantity;

                // Update original (remaining)
                await getClient().from('batches').update({ quantity: newQuantity }).eq('id', batchId);

                // Create new moved batch
                const { data: newBatch, error: createError } = await getClient().from('batches').insert([{
                    name: `${batch.name}-Movido`, // Should ideally prompt for name or auto-generate properly
                    quantity: quantity,
                    genetic_id: batch.genetic_id,
                    stage: batch.stage,
                    start_date: batch.start_date,
                    current_room_id: toRoomId,
                    clone_map_id: cloneMapId,
                    grid_position: gridPosition,
                    notes: notes
                }]).select().single();

                if (createError) {
                    console.error("Error splitting batch", createError);
                    return false;
                }

                // Log Movement for NEW batch
                await getClient().from('batch_movements').insert([{
                    batch_id: newBatch.id,
                    from_room_id: fromRoomId,
                    to_room_id: toRoomId,
                    notes: `Movido (Split): ${notes}`,
                    created_by: userId
                }]);

                return true;
            }
        }

        // STANDARD MOVE (or full move)
        const updates: any = {
            current_room_id: toRoomId,
            notes: notes // Update note on batch too? Maybe append?
        };

        if (gridPosition !== undefined) updates.grid_position = gridPosition;
        if (cloneMapId !== undefined) updates.clone_map_id = cloneMapId;

        const { error } = await getClient()
            .from('batches')
            .update(updates)
            .eq('id', batchId);

        if (error) {
            console.error('Error moving batch:', error);
            return false;
        }

        // Log Movement
        await getClient().from('batch_movements').insert([{
            batch_id: batchId,
            from_room_id: fromRoomId,
            to_room_id: toRoomId,
            notes: notes,
            created_by: userId
        }]);

        return true;
    },


    // Bulk API for faster map creation
    async bulkDistributeBatchesToMap(batches: any[], mapId: string, startRow: number, startCol: number, mapRows: number, mapCols: number, userId?: string): Promise<boolean> {
        if (!batches || batches.length === 0) return false;

        // 0. Fetch existing batches in the map to avoid overlap
        const { data: existingBatches } = await getClient()
            .from('batches')
            .select('grid_position')
            .eq('clone_map_id', mapId)
            .neq('quantity', 0); // Only count active ones

        const occupiedPositions = new Set(existingBatches?.map(b => b.grid_position) || []);

        // 1. Calculate Positions for ALL items sequentially
        let currentRow = startRow;
        let currentCol = startCol;

        const newBatchesToInsert: any[] = [];
        const sourceBatchIdsToUpdate: string[] = [];

        // Pre-fetch genetics info if needed for naming
        const geneticIds = batches.map(b => b.genetic_id).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i);
        const { data: genetics } = await getClient()
            .from('genetics')
            .select('id, nomenclatura')
            .in('id', geneticIds);

        const geneticMap = new Map(genetics?.map(g => [g.id, g.nomenclatura]));

        // Get sequence counters for each genetic
        const trackingCodeMap = new Map<string, number>();

        for (const genId of geneticIds) {
            const { count } = await getClient()
                .from('batches')
                .select('*', { count: 'exact', head: true })
                .eq('genetic_id', genId)
                .not('tracking_code', 'is', null);
            trackingCodeMap.set(genId, (count || 0) + 1);
        }

        const getNextFreePosition = () => {
            while (currentRow <= mapRows) {
                const rowChar = getRowLabel(currentRow);
                const colNum = currentCol;
                const pos = `${rowChar}${colNum}`;

                // Advance pointers
                currentCol++;
                if (currentCol > mapCols) {
                    currentCol = 1;
                    currentRow++;
                }

                if (!occupiedPositions.has(pos)) {
                    occupiedPositions.add(pos); // Mark as taken for this batch op
                    return pos;
                }
            }
            return null; // No more space
        };

        for (const batch of batches) {
            if (batch.quantity <= 0) continue;
            sourceBatchIdsToUpdate.push(batch.id);

            const prefix = geneticMap.get(batch.genetic_id) || 'GEN';
            let currentSeq = trackingCodeMap.get(batch.genetic_id) || 1;

            for (let i = 0; i < batch.quantity; i++) {
                // Find next free position
                const pos = getNextFreePosition();

                if (!pos) {
                    console.warn("Map full during bulk distribution");
                    break; // Stop distributing if full
                }

                // Tracking
                const trackingCode = `${prefix}-${String(currentSeq).padStart(3, '0')}`;
                currentSeq++;

                newBatchesToInsert.push({
                    name: `${trackingCode}`,
                    quantity: 1,
                    stage: batch.stage,
                    genetic_id: batch.genetic_id,
                    start_date: batch.start_date,
                    current_room_id: batch.current_room_id,
                    clone_map_id: mapId,
                    grid_position: pos,
                    parent_batch_id: batch.parent_batch_id || batch.id,
                    tracking_code: trackingCode,
                    notes: batch.notes?.match(/\[Grupo:.*?\]/)?.[0] || ''
                });
            }
            // Update seq for next batch of same genetic
            trackingCodeMap.set(batch.genetic_id, currentSeq);
        }

        if (newBatchesToInsert.length === 0) return false;

        // 2. Perform Batch Operations

        // A. Insert new batches
        const { data: insertedBatches, error: insertError } = await getClient()
            .from('batches')
            .insert(newBatchesToInsert)
            .select('id, tracking_code');

        if (insertError) {
            console.error("Bulk insert failed", insertError);
            return false;
        }

        // B. Mark sources as discarded
        const { error: updateError } = await getClient()
            .from('batches')
            .update({
                discarded_at: new Date().toISOString(),
                discard_reason: 'Distribuido en Mapa (Bulk)',
                quantity: 0,
                current_room_id: null,
                notes: `Distribuido en mapa ${mapId} como parte de grupo. Log: ${userId || 'No User'}`
            })
            .in('id', sourceBatchIdsToUpdate);

        if (updateError) {
            console.error("Bulk update source failed", updateError);
            return false;
        }

        // C. Log Distribution
        if (insertedBatches && insertedBatches.length > 0) {
            const movements = insertedBatches.map(b => ({
                batch_id: b.id,
                from_room_id: null, // Source was from various rooms? Or same map context?
                // Usually bulk distribute comes from "Available Batches" in the room.
                // But batches might have 'current_room_id' set.
                // For now, let's use null or try to infer.
                // Actually, we can just say "Distribucion Masiva".
                // Ideally we should know the room.
                to_room_id: null, // It stays in the room technically? Or map specific?
                // The batches table has 'current_room_id'.
                // The new batches have 'current_room_id' set from source.
                // Let's rely on that.
                notes: `Distribución Masiva en Mapa: ${b.tracking_code}`,
                created_by: userId
            }));

            // Note: batch_movements usually requires valid room IDs for filtering history.
            // If from/to are null, history might not show it.
            // We should use the room ID from the source batches.
            // But we don't have it easily here without fetching or passing.
            // 'distributeBatchesToMap' doesn't take roomId?
            // Actually newBatchesToInsert has 'current_room_id'.
            // Let's use that.

            const movementsWithRooms = newBatchesToInsert.map((nb, idx) => ({
                batch_id: insertedBatches[idx].id,
                from_room_id: nb.current_room_id,
                to_room_id: nb.current_room_id,
                notes: `Distribución Masiva: ${insertedBatches[idx].tracking_code}`,
                created_by: userId
            }));

            await getClient().from('batch_movements').insert(movementsWithRooms);
        }

        return true;
    },

    async sizeMap(mapId: string): Promise<number> {
        const { count, error } = await getClient()
            .from('batches')
            .select('*', { count: 'exact', head: true })
            .eq('clone_map_id', mapId);

        if (error) return 0;
        return count || 0;
    },

    async clearMap(mapId: string): Promise<boolean> {
        // 1. Delete movements first (Foreign Key constraint usually)
        const { data: batches } = await getClient()
            .from('batches')
            .select('id')
            .eq('clone_map_id', mapId);

        if (batches && batches.length > 0) {
            const batchIds = batches.map(b => b.id);
            // In Soft Delete model, we might want to keep movements, but clearMap implies creating space.
            // If active batches are deleted here, we should probably soft-delete them too. 
            // But for now, keeping existing logic of HARD delete or update as requested?
            // Actually, clearMap usually implies resetting the grid. 

            // Let's stick to the previous implementation logic but respecting constraints if any.
            // If FK exists, we might need to handle it.
            // Assuming no strict FK that prevents delete if we delete childs first.

            await getClient()
                .from('batch_movements')
                .delete()
                .in('batch_id', batchIds);

            // 2. Delete Batches
            const { error } = await getClient()
                .from('batches')
                .delete()
                .eq('clone_map_id', mapId);

            if (error) {
                console.error("Error clearing map", error);
                return false;
            }
        }
        return true;
    },

    async getRoomMovements(roomId: string): Promise<any[]> {
        const { data: movements, error } = await getClient()
            .from('batch_movements')
            .select(`
                *,
                batch:batches(name, tracking_code),
                from_room:rooms!from_room_id(name),
                to_room:rooms!to_room_id(name)
            `)
            .or(`from_room_id.eq.${roomId},to_room_id.eq.${roomId}`)
            .order('moved_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching movements:', error);
            return [];
        }

        if (!movements || movements.length === 0) return [];

        // Fetch User Profiles for created_by
        const userIds = Array.from(new Set(movements.map(m => m.created_by).filter(Boolean)));

        if (userIds.length > 0) {
            const { data: profiles } = await getClient()
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // Merge profile info
            return movements.map(m => ({
                ...m,
                user: m.created_by ? profileMap.get(m.created_by) : null
            }));
        }

        return movements;
    },

    async transplantBatches(fromRoomId: string, toRoomId: string, movements: { geneticId: string, quantity: number }[], userId?: string): Promise<boolean> {
        // This function needs to process each genetic group
        // Strategy: 
        // 1. For each genetic, fetch ALL available batches in the room, ordered by creation date (older first).
        // 2. Iterate and move/split until quantity is satisfied.

        for (const move of movements) {
            if (move.quantity <= 0) continue;

            // Fetch batches of this genetic in the room
            const { data: batches } = await getClient()
                .from('batches')
                .select('*')
                .eq('current_room_id', fromRoomId)
                .eq('genetic_id', move.geneticId)
                .is('discarded_at', null)
                .order('created_at', { ascending: true }); // FIFO

            if (!batches) continue;

            let remaining = move.quantity;

            for (const batch of batches) {
                if (remaining <= 0) break;

                const qtyToTake = Math.min(batch.quantity, remaining);

                // Re-use moveBatch logic but optimized or called in loop?
                // Calling moveBatch is safer as it handles splits.
                // We'll reset position/map since we are moving to Veg (usually no map there yet, or at least no grid auto-assign).

                // Destination: New Room, No Map, No Position.
                await this.moveBatch(
                    batch.id,
                    fromRoomId,
                    toRoomId,
                    'Transplante a Vegetación',
                    qtyToTake,
                    undefined, // No grid position in target (for now)
                    undefined,  // No map in target
                    userId
                );

                remaining -= qtyToTake;
            }
        }

        return true;
    },

    async moveBatches(batchIds: string[], toRoomId: string, notes: string = 'Transplante Masivo', userId?: string): Promise<boolean> {
        if (!batchIds.length) return false;

        const { error } = await getClient()
            .from('batches')
            .update({
                current_room_id: toRoomId,
                clone_map_id: null,
                grid_position: null,
                stage: 'vegetation', // Promote to Veg
                notes: notes // Append or set notes? Ideally append, but simple set for now or DB trigger
            })
            .in('id', batchIds);

        if (error) {
            console.error('Error moving batches:', error);
            throw error;
        }

        // Ideally we should record movement history for each, but for bulk ops might be heavy.
        // Let's rely on DB triggers or loop if strict history needed.
        // For now, single bulk update is efficient.

        return true;
    },

    async harvestBatches(batchIds: string[], toRoomId?: string, userId?: string): Promise<boolean> {
        if (!batchIds.length) return false;

        const updates: any = {
            stage: 'drying',
            clone_map_id: null,
            grid_position: null,
        };

        if (toRoomId) {
            updates.current_room_id = toRoomId;
        }

        const { error } = await getClient()
            .from('batches')
            .update(updates)
            .in('id', batchIds);

        if (error) {
            console.error('Error harvesting batches:', error);
            throw error;
        }

        // Log Harvest Movement
        const movements = batchIds.map(id => ({
            batch_id: id,
            from_room_id: null, // Unknown without fetch, but allowable in log? Or we leave null.
            to_room_id: toRoomId || null,
            notes: 'Cosecha: Planta procesada',
            created_by: userId,
            moved_at: new Date().toISOString()
        }));

        const { error: logError } = await getClient().from('batch_movements').insert(movements);
        if (logError) console.error("Error logging harvest:", logError);

        return true;
    },

    async mergeBatches(sourceBatchIds: string[], intoNewBatchData: Partial<Batch>): Promise<boolean> {
        if (!sourceBatchIds.length) return false;

        // 1. Create the new batch
        const { data: newBatch, error: createError } = await getClient()
            .from('batches')
            .insert(intoNewBatchData)
            .select()
            .single();

        if (createError) {
            console.error('Error creating merged batch:', createError);
            throw createError;
        }



        // 2. Mark source batches as 'transplanted' AND remove from room/map
        const { error: updateError } = await getClient()
            .from('batches')
            .update({
                discarded_at: new Date().toISOString(),
                current_room_id: null,
                clone_map_id: null,
                grid_position: null,
                notes: `Transplantado y fusionado en lote ${newBatch.id} (${newBatch.tracking_code || newBatch.name})`
            })
            .in('id', sourceBatchIds);

        if (updateError) {
            console.error('Error archiving source batches:', updateError);
            // Should we rollback new batch? For now, let's just log.
            throw updateError;
        }

        return true;

    },
    async finalizeBatch(batchId: string, finalWeight: number, notes: string = ''): Promise<boolean> {
        // 1. Get Batch Data
        const { data: batch, error: fetchError } = await getClient()
            .from('batches')
            .select('*, genetic:genetics(*)')
            .eq('id', batchId)
            .single();

        if (fetchError || !batch) {
            console.error("Error fetching batch to finalize", fetchError);
            return false;
        }

        // 2. Generate Code for Dispensary if needed
        let code = batch.tracking_code;
        if (!code || code.length < 5) {
            const year = new Date().getFullYear();
            code = `HAR-${year}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        }

        // 3. Create in Dispensary (Stock)
        const dispensaryBatch = {
            strain_name: batch.genetic?.name || batch.name,
            batch_code: code,
            initial_weight: finalWeight,
            current_weight: finalWeight,
            quality_grade: 'Standard',
            status: 'curing' as const, // Or 'available'
            location: 'Depósito General',
            notes: `Finalizado desde Secado. ${notes}`,
            created_at: new Date().toISOString()
        };

        const { error: dispError } = await getClient()
            .from('chakra_dispensary_batches')
            .insert([dispensaryBatch]);

        if (dispError) {
            console.error("Error creating stock batch", dispError);
            return false;
        }

        // 4. Archive/Delete from Room Batches
        // We'll delete it to remove from the room view
        const { error: delError } = await getClient()
            .from('batches')
            .delete()
            .eq('id', batchId);

        if (delError) {
            console.error("Error deleting room batch", delError);
            return false;
        }

        return true;
    },

    async getCloneSuccessMetrics(roomId: string): Promise<any[]> {
        // 1. Get all batches currently in the room (Active)
        const { data: activeBatches } = await getClient()
            .from('batches')
            .select('genetic:genetics(name)')
            .eq('current_room_id', roomId)
            .is('discarded_at', null);

        // 2. Get history of batches that left this room (Moved or Deleted)
        // We look for movements FROM this room.
        const { data: movements } = await getClient()
            .from('batch_movements')
            .select(`
                to_room_id,
                notes,
                batch:batches(
                    discarded_at,
                    discard_reason,
                    genetic:genetics(name)
                )
            `)
            .eq('from_room_id', roomId);

        // Aggregation Structure
        const stats: Record<string, { total: number, active: number, success: number, failed: number }> = {};

        const initStat = (genName: string) => {
            if (!stats[genName]) stats[genName] = { total: 0, active: 0, success: 0, failed: 0 };
        };

        // Process Active
        activeBatches?.forEach((b: any) => {
            const genName = b.genetic?.name || 'Desconocida';
            initStat(genName);
            stats[genName].active++;
            stats[genName].total++;
        });

        // Process Movements (History)
        // Set to track processed batch IDs to avoid double counting if multiple movements?
        // Actually, a batch usually leaves once. If it moves back and forth, it might be complex.
        // Simplified approach: Last movement determines fate?
        // Or just count "Outcomes".

        movements?.forEach((m: any) => {
            const genName = m.batch?.genetic?.name || 'Desconocida';
            initStat(genName);

            // Determine Outcome based on movement/batch state
            const isDiscarded = !!m.batch?.discarded_at;
            const reason = m.batch?.discard_reason || '';
            const toRoom = m.to_room_id;

            if (toRoom) {
                // Moved to another room -> SUCCESS (Transplant)
                // Note: If it moved to another room and THEN died, strictly speaking it rooted successfully in this room.
                stats[genName].success++;
                stats[genName].total++;
            } else if (isDiscarded) {
                // No destination + Discarded -> Check Reason
                if (reason.toLowerCase().includes('distribuido') || reason.toLowerCase().includes('individualización')) {
                    // Ignore "System" discards (Splits/Maps)
                } else {
                    // "Baja", "Eliminado", "Muerte" -> FAILURE
                    stats[genName].failed++;
                    stats[genName].total++;
                }
            }
        });

        // Calculate Percentages
        return Object.entries(stats).map(([name, data]) => ({
            name,
            ...data,
            successRate: data.total > 0 ? ((data.success / (data.success + data.failed)) * 100).toFixed(1) : '0.0',
            // Alternative: Success Rate relative to Total (including Active)?
            // Usually we want "Of those that finished (Success+Fail), what % succeeded?"
            // Or "Total Survival Rate including active"?
            // User asked: "% Porcentaje de exito" counting eliminated ones.
            // Let's provide both or typical simplified: Success / (Success + Failed)
            globalSuccessRate: data.total > 0 ? (((data.success + data.active) / data.total) * 100).toFixed(1) : '0.0'
        })).sort((a, b) => b.total - a.total);
    }
};
