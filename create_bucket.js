
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// Must use SERVICE_ROLE_KEY to create buckets if RLS blocks it, or just try with anon if allowed (unlikely).
// Actually, creating buckets usually requires admin privileges or service role.
// I will try with the ANON key first (if policy allows), but usually it doesn't.
// If I don't have the service role key in .env (I only saw ANON_KEY in previous logs), I might be stuck.
// Checking .env logic... usually REACT_APP_SUPABASE_ANON_KEY is all I have.
// IF I can't create it via JS, I might need to output the SQL for the user to run in the Supabase Dashboard.

const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// Note: If this fails, I will generate a SQL snippet for the user.

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log('Creating Bucket...');

    const { data, error } = await supabase.storage.createBucket('patient_docs', {
        public: true
    });

    if (error) {
        console.error('Error creating bucket:', error);
    } else {
        console.log('Bucket created:', data);
    }
}

createBucket();
