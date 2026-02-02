
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Schema...');

    // 1. Check Bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) console.error('Bucket Error:', bucketError);
    else {
        const found = buckets.find(b => b.name === 'patient_docs');
        console.log('Bucket "patient_docs" exists:', !!found);
    }

    // 2. Check Columns by trying to insert/select (or just select)
    const { data, error } = await supabase
        .from('aurora_patients')
        .select('file_reprocann_url, file_affidavit_url, file_consent_url')
        .limit(1);

    if (error) {
        console.error('Column Check Error:', error.message);
    } else {
        console.log('Columns exist. Row Data:', data);
    }
}

verify();
