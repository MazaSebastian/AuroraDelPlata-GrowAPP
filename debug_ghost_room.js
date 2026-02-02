
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    console.log('--- DEBUGGING GHOST DATA ---');

    // 1. Fetch All Crops
    const { data: crops, error: cropError } = await supabase.from('crops').select('*');
    if (cropError) console.error('Error fetching crops:', cropError);
    console.log(`Found ${crops?.length || 0} Crops:`);
    crops?.forEach(c => console.log(` - [${c.id}] ${c.name} (Status: ${c.status})`));

    // 2. Fetch All Rooms
    const { data: rooms, error: roomError } = await supabase.from('rooms').select('*');
    if (roomError) console.error('Error fetching rooms:', roomError);
    console.log(`\nFound ${rooms?.length || 0} Rooms:`);
    rooms?.forEach(r => console.log(` - [${r.id}] ${r.name} (Type: ${r.type}) -> Linked to Spot: ${r.spot_id}`));

    // 3. Find the specific "Sala Vegetacion A"
    const ghost = rooms?.find(r => r.name === 'Sala Vegetacion A');
    if (ghost) {
        console.log('\n--- GHOST ROOM DETAILS ---');
        console.log(ghost);
        const parent = crops?.find(c => c.id === ghost.spot_id);
        if (parent) {
            console.log(`It is linked to Crop: ${parent.name} [${parent.id}]`);
        } else {
            console.log('It is linked to a NON-EXISTENT Crop ID!');
        }
    } else {
        console.log('\n"Sala Vegetacion A" NOT FOUND in DB query. It might be hardcoded in frontend?');
    }
}

debugData();
