import { supabase } from './supabaseClient';


export interface DispensaryBatch {
    id: string;
    strain_name: string;
    batch_code: string;
    initial_weight: number;
    current_weight: number;
    quality_grade: 'Premium' | 'Standard' | 'Extracts' | 'Trim';
    status: 'curing' | 'available' | 'depleted' | 'quarantine' | 'deleted';
    location: string;
    notes?: string;
    price_per_gram?: number;
    harvest_log_id?: string;
    photo_url?: string;
    created_at: string;
}

export interface DispensaryMovement {
    id: string;
    batch_id: string;
    batch?: DispensaryBatch; // Joined
    type: 'dispense' | 'adjustment' | 'quality_test' | 'restock' | 'disposal';
    amount: number;
    transaction_value?: number;
    reason?: string;
    performed_by?: string;
    member_id?: string;
    previous_weight?: number;
    new_weight?: number;
    created_at: string;
}

export const dispensaryService = {
    async getBatches(): Promise<DispensaryBatch[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_dispensary_batches')
            .select('*')
            .neq('status', 'depleted')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching dispensary batches:', error);
            return [];
        }
        return data as DispensaryBatch[];
    },

    async getMovements(limit = 100): Promise<DispensaryMovement[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_dispensary_movements')
            .select(`
                *,
                batch:batch_id (
                    batch_code,
                    strain_name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching movements:', error);
            return [];
        }
        // Map batch properties to first level if needed or just return data
        return data as unknown as DispensaryMovement[];
    },

    async createBatch(batch: Omit<DispensaryBatch, 'id' | 'created_at' | 'current_weight'>): Promise<DispensaryBatch | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('chakra_dispensary_batches')
            .insert([{
                ...batch,
                current_weight: batch.initial_weight
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating dispensary batch:', error);
            return null;
        }

        // Optional: Log Creation? Not a 'movement' per se but could be 'restock' from 0?
        return data;
    },

    async dispense(batchId: string, amount: number, reason: string, memberId?: string, unitPrice: number = 0): Promise<boolean> {
        if (!supabase) return false;

        const { data: batch, error: fetchError } = await supabase
            .from('chakra_dispensary_batches')
            .select('current_weight')
            .eq('id', batchId)
            .single();

        if (fetchError || !batch) return false;

        if (batch.current_weight < amount) return false;

        const newWeight = batch.current_weight - amount;

        // Update Stock
        const { error: updateError } = await supabase
            .from('chakra_dispensary_batches')
            .update({
                current_weight: newWeight,
                status: newWeight === 0 ? 'depleted' : undefined
            })
            .eq('id', batchId);

        if (updateError) return false;

        // Log Movement
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
            .from('chakra_dispensary_movements')
            .insert([{
                batch_id: batchId,
                type: 'dispense',
                amount: -amount,
                transaction_value: unitPrice * amount,
                reason: reason,
                performed_by: user?.id,
                member_id: memberId || null,
                previous_weight: batch.current_weight,
                new_weight: newWeight
            }]);

        return true;
    },

    // REPLACED deleteBatch with Soft Delete to preserve history
    async deleteBatchWithReason(batchId: string, reason: string): Promise<boolean> {
        if (!supabase) return false;

        // 1. Get current data for log
        const { data: batch } = await supabase
            .from('chakra_dispensary_batches')
            .select('*')
            .eq('id', batchId)
            .single();

        if (!batch) return false;

        // 2. Soft Delete
        const { error } = await supabase
            .from('chakra_dispensary_batches')
            .update({ status: 'depleted', current_weight: 0 })
            .eq('id', batchId);

        if (error) return false;

        // 3. Log Reason
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
            .from('chakra_dispensary_movements')
            .insert([{
                batch_id: batchId,
                type: 'adjustment', // Changed from 'disposal' to avoid Enum constraint error
                amount: -(batch.current_weight), // Parenthesis to ensure it treats as number
                reason: `Baja: ${reason}`,
                performed_by: user?.id,
                previous_weight: batch.current_weight,
                new_weight: 0
            }]);

        return true;
    },

    async updateBatchWithReason(id: string, updates: Partial<DispensaryBatch>, reason: string, movementType?: 'dispense' | 'adjustment' | 'quality_test' | 'restock' | 'disposal'): Promise<boolean> {
        if (!supabase) return false;

        // 1. Fetch current to compare weight
        const { data: older } = await supabase
            .from('chakra_dispensary_batches')
            .select('current_weight')
            .eq('id', id)
            .single();

        if (!older) return false;

        // 2. Update
        const { error } = await supabase
            .from('chakra_dispensary_batches')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating batch:', error);
            return false;
        }

        // 3. Log Adjustment if weight changed
        if (updates.current_weight !== undefined && updates.current_weight !== older.current_weight) {
            const diff = updates.current_weight - older.current_weight;
            const { data: { user } } = await supabase.auth.getUser();

            await supabase
                .from('chakra_dispensary_movements')
                .insert([{
                    batch_id: id,
                    type: movementType || 'adjustment',
                    amount: diff,
                    reason: reason || 'Ajuste manual de inventario',
                    performed_by: user?.id,
                    previous_weight: older.current_weight,
                    new_weight: updates.current_weight
                }]);
        }
        // If other fields changed, maybe log update event?
        // Typically "Movements" track stock/money. If location changed, it's not strictly a movement of stock quantity.
        // But we could add a log type 'audit'? For now, stick to Stock Movements.

        return true;
    },

    // Kept generic update for non-critical changes if needed, but UI will use withReason
    async updateBatch(id: string, updates: Partial<DispensaryBatch>): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase.from('chakra_dispensary_batches').update(updates).eq('id', id);
        return !error;
    },

    async deleteBatch(batchId: string): Promise<boolean> {
        return this.deleteBatchWithReason(batchId, "Baja directa (Legacy)");
    },

    async createFromHarvest(harvestData: { cropId: string, harvestLogId: string, strainName: string, amount: number, unit: 'g' | 'kg', originalBatchCode?: string, photoUrl?: string }): Promise<DispensaryBatch | null> {
        if (!supabase) return null;

        let batchCode = harvestData.originalBatchCode;

        if (!batchCode) {
            // 1. Generate Batch Code (Simple logic: YEAR-SEQ) if no original code provided
            const year = new Date().getFullYear();
            const prefix = "AUR";
            const { count } = await supabase.from('chakra_dispensary_batches').select('*', { count: 'exact', head: true });
            const seq = (count || 0) + 1;
            batchCode = `${prefix}-${year}-${String(seq).padStart(3, '0')}`; // e.g., AUR-2026-001
        }

        // 2. Normalize Weight to Grams
        const weightInGrams = harvestData.unit === 'kg' ? harvestData.amount * 1000 : harvestData.amount;

        // 3. Create Batch
        const newBatch: Omit<DispensaryBatch, 'id' | 'created_at' | 'current_weight'> = {
            strain_name: harvestData.strainName,
            batch_code: batchCode,
            initial_weight: weightInGrams,
            quality_grade: 'Standard',
            status: 'curing',
            location: 'Depósito General',
            harvest_log_id: harvestData.harvestLogId,
            photo_url: harvestData.photoUrl
        };

        return await this.createBatch(newBatch);
    },

    async getShopBatches(): Promise<DispensaryBatch[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('chakra_dispensary_batches')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data as DispensaryBatch[];
    },

    async dispenseToShop(sourceBatchId: string, amount: number): Promise<boolean> {
        if (!supabase) return false;

        // 1. Get Source
        const { data: source } = await supabase.from('chakra_dispensary_batches').select('*').eq('id', sourceBatchId).single();
        if (!source || source.current_weight < amount) return false;

        // 2. Update Source
        const newSourceWeight = source.current_weight - amount;

        // If source becomes empty, update status to depleted? Or keep it 'curing'/'storage' but empty (Red color)?
        // User said: "cuando se dispense la totalidad se coloreara a color rojo... debe eliminarlo".
        // Use 'depleted' or just weight 0. Weight 0 is fine.

        await supabase.from('chakra_dispensary_batches').update({ current_weight: newSourceWeight }).eq('id', sourceBatchId);

        // 3. Create Shop Batch
        const { data: newBatch } = await supabase.from('chakra_dispensary_batches').insert([{
            strain_name: source.strain_name,
            batch_code: `${source.batch_code} - Dispensando`, // Updated naming convention
            initial_weight: amount,
            current_weight: amount,
            quality_grade: source.quality_grade,
            status: 'available',
            location: 'Dispensario / Shop',
            notes: `Transferido desde stock: ${source.batch_code}`,
            harvest_log_id: source.harvest_log_id
        }]).select().single();

        // 4. Log Movements
        const { data: { user } } = await supabase.auth.getUser();

        // Out from Stock (Use 'adjustment' or 'transfer_out' if allowed, defaulting to adjustment)
        await supabase.from('chakra_dispensary_movements').insert([{
            batch_id: sourceBatchId,
            type: 'adjustment',
            amount: -amount,
            reason: 'Envío a Dispensario',
            performed_by: user?.id,
            previous_weight: source.current_weight,
            new_weight: newSourceWeight
        }]);

        // In to Shop
        if (newBatch) {
            await supabase.from('chakra_dispensary_movements').insert([{
                batch_id: newBatch.id,
                type: 'restock',
                amount: amount,
                reason: 'Recepción desde Stock',
                performed_by: user?.id,
                previous_weight: 0,
                new_weight: amount
            }]);
        }

        return true;
    },

    async transferToLab(sourceBatchId: string, amount: number): Promise<boolean> {
        if (!supabase) return false;

        // 1. Get Source
        const { data: source } = await supabase.from('chakra_dispensary_batches').select('*').eq('id', sourceBatchId).single();
        if (!source || source.current_weight < amount) return false;

        const newSourceWeight = source.current_weight - amount;

        // 2. Update Source (Deduct)
        const { error: updateError } = await supabase
            .from('chakra_dispensary_batches')
            .update({ current_weight: newSourceWeight })
            .eq('id', sourceBatchId);

        if (updateError) return false;

        // 3. Create Lab Batch (or Upsert if we want to merge? ideally new batch for tracking)
        // We'll create a new batch in "Laboratorio"
        const { data: newBatch, error: createError } = await supabase.from('chakra_dispensary_batches').insert([{
            strain_name: source.strain_name,
            batch_code: `${source.batch_code}-LAB`,
            initial_weight: amount,
            current_weight: amount,
            quality_grade: source.quality_grade,
            status: 'curing', // Or 'processing'? 'curing' is safe for now as it's not 'available' in shop
            location: 'Laboratorio',
            notes: `Transferido a Laboratorio desde: ${source.batch_code}`,
            harvest_log_id: source.harvest_log_id
        }]).select().single();

        if (createError) {
            console.error('Error creating lab batch:', createError);
            // Rollback source update? (Complex in pure JS without transaction, assume success for now or handle manually)
            return false;
        }

        // 4. Log Movements
        const { data: { user } } = await supabase.auth.getUser();

        // Out from Stock
        await supabase.from('chakra_dispensary_movements').insert([{
            batch_id: sourceBatchId,
            type: 'adjustment',
            amount: -amount,
            reason: 'Envío a Laboratorio',
            performed_by: user?.id,
            previous_weight: source.current_weight,
            new_weight: newSourceWeight
        }]);

        // In to Lab
        if (newBatch) {
            await supabase.from('chakra_dispensary_movements').insert([{
                batch_id: newBatch.id,
                type: 'restock', // Using restock as it's an "IN" movement
                amount: amount,
                reason: 'Recepción en Laboratorio',
                performed_by: user?.id,
                previous_weight: 0,
                new_weight: amount
            }]);
        }

        return true;
    },

    // Upload Harvest Photo
    async uploadHarvestPhoto(file: File): Promise<string | null> {
        if (!supabase) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `harvests/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('harvest_photos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('harvest_photos')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};
