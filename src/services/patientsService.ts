import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js'; // Import createClient for temp instance
import { Profile } from './usersService';

export interface Patient {
    id: string;
    profile_id: string;
    profile?: Profile;
    reprocann_number?: string;
    reprocann_status: 'active' | 'pending' | 'expired' | 'rejected';
    expiration_date?: string;
    monthly_limit: number;
    notes?: string;

    // New Fields
    phone?: string;
    address?: string;
    document_number?: string;
    reprocann_issue_date?: string;
    file_reprocann_url?: string;
    file_affidavit_url?: string; // Declaracion Jurada
    file_consent_url?: string;   // Consentimiento Bilateral

    created_at?: string;
}

export const patientsService = {
    // Get all patients with their profile data
    async getPatients(): Promise<Patient[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('aurora_patients')
            .select('*, profile:profiles(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching patients:', error);
            return [];
        }

        // Map the joined profile correctly
        return data.map((p: any) => ({
            ...p,
            profile: p.profile // Supabase returns the joined relation as a property
        }));
    },

    // Get a single patient by their aurora_patients ID
    async getPatientById(id: string): Promise<Patient | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('aurora_patients')
            .select('*, profile:profiles(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching patient:', error);
            return null;
        }

        return data;
    },

    // Create or Update a patient record
    // Note: Since it's 1:1 with Profile, we usually create it when "promoting" a user to patient
    async upsertPatient(patient: Partial<Patient>): Promise<Patient | null> {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();

        const payload: any = {
            ...patient,
            created_by: user?.id,
            updated_at: new Date().toISOString()
        };

        // Remove joined profile object if present to avoid errors
        delete payload.profile;
        delete payload.created_at;

        const { data, error } = await supabase
            .from('aurora_patients')
            .upsert(payload, { onConflict: 'profile_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving patient:', error);
            throw error;
        }

        return data;
    },

    // Specific method to create a patient from an existing user profile
    async createPatientFromProfile(profileId: string): Promise<boolean> {
        if (!supabase) return false;

        // Check if already exists
        const { data: existing } = await supabase
            .from('aurora_patients')
            .select('id')
            .eq('profile_id', profileId)
            .maybeSingle();

        if (existing) return true; // Already a patient

        const { error } = await supabase
            .from('aurora_patients')
            .insert([{
                profile_id: profileId,
                reprocann_status: 'pending',
                monthly_limit: 40 // Default
            }]);

        if (error) {
            console.error('Error creating patient:', error);
            return false;
        }
        return true;
    },

    // Calculate consumption for the current month
    async getPatientConsumption(patientId: string): Promise<{ current: number, limit: number }> {
        if (!supabase) return { current: 0, limit: 0 };

        // 1. Get Limit
        const { data: patient } = await supabase
            .from('aurora_patients')
            .select('monthly_limit, profile_id')
            .eq('profile_id', patientId)
            .single();

        if (!patient) return { current: 0, limit: 0 };

        // 2. Calculate Consumption (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: movements, error } = await supabase
            .from('chakra_dispensary_movements')
            .select('amount')
            .eq('member_id', patientId)
            .eq('type', 'dispense')
            .gte('created_at', startOfMonth.toISOString());

        if (error) {
            console.error("Error fetching consumption:", error);
            return { current: 0, limit: patient.monthly_limit };
        }

        // Sum absolute amounts (amounts are stored negative for dispense)
        const totalDispensed = movements.reduce((acc, m) => acc + Math.abs(m.amount), 0);

        return {
            current: totalDispensed,
            limit: patient.monthly_limit
        };
    },

    // Upload a document to patient_docs bucket
    async uploadDocument(file: File, path: string): Promise<string | null> {
        if (!supabase) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('patient_docs')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return null;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('patient_docs')
            .getPublicUrl(filePath);

        return publicUrl;

    },

    // Delete a patient record
    async deletePatient(id: string): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('aurora_patients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting patient:', error);
            return false;
        }
        return true;
    },

    // Register a NEW patient (creates Auth User + Patient Record)
    async registerNewPatient(patientData: Partial<Patient>, userData: { email: string, fullName: string }): Promise<Patient | null> {
        if (!supabase) return null;

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Missing Supabase Env Vars");
            return null;
        }

        // 1. Create a temporary client that does NOT persist session
        // This ensures the Admin stays logged in while we create the new user
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false, // Vital!
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        // 2. Sign Up the new user
        // We use a temporary password since the user isn't using the app yet
        const tempPassword = "TempPassword123!";

        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: userData.email,
            password: tempPassword,
            options: {
                data: {
                    name: userData.fullName,
                    role: 'member' // Default role for members
                }
            }
        });

        if (authError || !authData.user) {
            console.error("Error creating auth user:", authError);
            throw new Error(authError?.message || "Failed to create user");
        }

        const newUserId = authData.user.id;

        // 3. Create Patient Record linked to the new Auth User
        // Note: The 'profiles' record is created automatically by the DB trigger 'handle_new_user'

        const payload: any = {
            ...patientData,
            profile_id: newUserId,
        };

        return await this.upsertPatient(payload);
    }
};
