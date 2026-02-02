
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
    console.log('Verifying Movements Table Columns...');

    // Try to select member_id from the table
    // We limit to 0 rows just to check if the query parsing fails (which it would if column doesn't exist)
    // Or insert a dummy row? No, safer to select.

    const { data, error } = await supabase
        .from('chakra_dispensary_movements')
        .select('member_id')
        .limit(1);

    if (error) {
        console.error('Error Checking Column:', error.message);
        console.log('Result: Column likely MISSING.');
    } else {
        console.log('Result: Column member_id EXISTS.');
    }
}

verify();
