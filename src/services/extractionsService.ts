import { supabase } from './supabaseClient';
import { Extraction, ExtractionTechnique } from '../types/extractions';
import { DispensaryBatch } from './dispensaryService';

export const extractionsService = {

    async getExtractions(): Promise<Extraction[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('extractions')
            .select(`
        *,
        source_batch:source_batch_id (
          id,
          strain_name,
          batch_code,
          quality_grade,
          photo_url
        )
      `)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching extractions:', error);
            return [];
        }
        return data as any as Extraction[];
    },

    async createExtraction(extraction: Omit<Extraction, 'id' | 'created_at' | 'yield_percentage'>): Promise<Extraction | null> {
        if (!supabase) return null;

        // Calculate yield manually if DB generated column isn't returned immediately correctly or relies on refresh
        // But we are sending input/output, so DB will handle storage.

        // We also need to DEDUCT the input_weight from the Source Batch in Dispensary!
        // This transaction should ideally be atomic.

        // 1. Check Source Availability
        const { data: sourceBatch } = await supabase
            .from('chakra_dispensary_batches')
            .select('current_weight')
            .eq('id', extraction.source_batch_id)
            .single();

        if (!sourceBatch || sourceBatch.current_weight < extraction.input_weight) {
            console.error("Insufficient source material");
            return null;
        }

        const { data: { user } } = await supabase.auth.getUser();

        // 2. Transact: Create Extraction + Update Source
        // Supabase JS doesn't support complex transactions easily without RPC, so we do specific operations.

        // A. Create Extraction
        const { data, error } = await supabase
            .from('extractions')
            .insert([{
                ...extraction,
                created_by: user?.id
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating extraction:', error);
            return null;
        }

        // B. Deduct from Source (Log as 'process' or 'extraction_input')
        const newWeight = sourceBatch.current_weight - extraction.input_weight;

        await supabase.from('chakra_dispensary_batches')
            .update({ current_weight: newWeight })
            .eq('id', extraction.source_batch_id);

        await supabase.from('chakra_dispensary_movements')
            .insert([{
                batch_id: extraction.source_batch_id,
                type: 'dispense', // or 'processing' if we add that enum type
                amount: -extraction.input_weight,
                reason: `Procesamiento: Extracción ${extraction.technique}`,
                performed_by: user?.id,
                previous_weight: sourceBatch.current_weight,
                new_weight: newWeight
            }]);

        return data as Extraction;
    },

    async getAvailableSourceBatches(): Promise<DispensaryBatch[]> {
        if (!supabase) return [];

        // Get batches that have weight > 0
        // Maybe filter by quality? 'Trim' or 'Standard' are usual candidates for extraction.
        const { data, error } = await supabase
            .from('chakra_dispensary_batches')
            .select('*')
            .gt('current_weight', 0)
            .neq('status', 'depleted')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data as DispensaryBatch[];
    },

    async deleteExtraction(id: string): Promise<boolean> {
        if (!supabase) return false;
        try {
            // Optional: Revert stock deduction logic could go here if we wanted strict inventory tracking
            // For now, simpler delete.
            const { error } = await supabase.from('extractions').delete().eq('id', id);
            return !error;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    async updateExtraction(id: string, updates: Partial<Extraction>): Promise<boolean> {
        if (!supabase) return false;

        // Note: If input_weight changes, we should ideally adjust stock. 
        // For this version, we will assume weight updates are handled carefully or ignored for stock reversions 
        // unless we strictly implement the delta logic. 
        // Given constraint/risk, we'll update the record directly.

        const { error } = await supabase
            .from('extractions')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating extraction:', error);
            return false;
        }
        return true;
    }
};
