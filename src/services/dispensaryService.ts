import { supabase } from './supabaseClient';
import { configService } from './configService';

export interface DispensaryBatch {
    id: string;
    strain_name: string;
    batch_code: string;
    initial_weight: number;
    current_weight: number;
    quality_grade: 'Premium' | 'Standard' | 'Extracts' | 'Trim';
    status: 'curing' | 'available' | 'depleted' | 'quarantine';
    location: string;
    notes?: string;
    price_per_gram?: number;
    harvest_log_id?: string;
    created_at: string;
}

export interface DispensaryMovement {
    id: string;
    batch_id: string;
    type: 'dispense' | 'adjustment' | 'quality_test' | 'restock';
    amount: number;
    transaction_value?: number;
    reason?: string;
    performed_by?: string;
    created_at: string;
}

export const dispensaryService = {
    async getBatches(): Promise<DispensaryBatch[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_dispensary_batches')
            .select('*')
            .neq('status', 'depleted') // Optional: Don't show depleted by default? Or maybe show them separately.
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching dispensary batches:', error);
            return [];
        }
        return data as DispensaryBatch[];
    },

    async createBatch(batch: Omit<DispensaryBatch, 'id' | 'created_at' | 'current_weight'>): Promise<DispensaryBatch | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('chakra_dispensary_batches')
            .insert([{
                ...batch,
                current_weight: batch.initial_weight // Initial current weight = initial weight
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating dispensary batch:', error);
            return null;
        }
        return data;
    },

    async dispense(batchId: string, amount: number, reason: string, memberId?: string, unitPrice: number = 0): Promise<boolean> {
        if (!supabase) return false;

        // 1. Get current batch to validate stock
        const { data: batch, error: fetchError } = await supabase
            .from('chakra_dispensary_batches')
            .select('current_weight')
            .eq('id', batchId)
            .single();

        if (fetchError || !batch) {
            console.error("Error fetching batch for dispense:", fetchError);
            return false;
        }

        if (batch.current_weight < amount) {
            console.error("Insufficient stock");
            return false;
        }

        // 2. Decrease Stock
        const newWeight = batch.current_weight - amount;
        const { error: updateError } = await supabase
            .from('chakra_dispensary_batches')
            .update({
                current_weight: newWeight,
                status: newWeight === 0 ? 'depleted' : undefined // Auto-deplete
            })
            .eq('id', batchId);

        if (updateError) {
            console.error("Error updating batch stock:", updateError);
            return false;
        }

        // 3. Log Movement
        const transactionValue = unitPrice * amount;

        const { data: { user } } = await supabase.auth.getUser();
        const { error: logError } = await supabase
            .from('chakra_dispensary_movements')
            .insert([{
                batch_id: batchId,
                type: 'dispense',
                amount: -amount, // Negative for dispense
                transaction_value: transactionValue,
                reason: reason,
                performed_by: user?.id,
                member_id: memberId || null, // Record member if provided
                previous_weight: batch.current_weight,
                new_weight: newWeight
            }]);

        if (logError) console.error("Error logging movement (Stock updated though):", logError);

        return true;
    },

    async createFromHarvest(harvestData: { cropId: string, harvestLogId: string, strainName: string, amount: number, unit: 'g' | 'kg', originalBatchCode?: string }): Promise<DispensaryBatch | null> {
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
            harvest_log_id: harvestData.harvestLogId
        };

        return await this.createBatch(newBatch);
    },

    async deleteBatch(batchId: string): Promise<boolean> {
        if (!supabase) return false;

        // 1. Delete associated movements first (Manual Cascade)
        const { error: movementError } = await supabase
            .from('chakra_dispensary_movements')
            .delete()
            .eq('batch_id', batchId);

        if (movementError) {
            console.error('Error deleting batch movements:', movementError);
            return false;
        }

        // 2. Delete the batch
        const { error } = await supabase
            .from('chakra_dispensary_batches')
            .delete()
            .eq('id', batchId);

        if (error) {
            console.error('Error deleting dispensary batch:', error);
            return false;
        }
        return true;
    },

    async updateBatch(id: string, updates: Partial<DispensaryBatch>): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_dispensary_batches')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating dispensary batch:', error);
            return false;
        }
        return true;
    }
};
