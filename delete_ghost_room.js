
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteGhost() {
    const ghostId = '5e7b8077-cad0-47fb-912c-1ca36bd9c9b2';
    console.log(`Deleting room ${ghostId}...`);

    // 1. Delete linked tasks first
    const { error: taskError } = await supabase.from('chakra_tasks').delete().eq('room_id', ghostId);
    if (taskError) console.error('Error deleting tasks:', taskError);

    // 2. Delete linked batches (if any)
    const { error: batchError } = await supabase.from('batches').delete().eq('current_room_id', ghostId);
    if (batchError) console.error('Error deleting batches:', batchError);

    // 3. Delete room
    const { error } = await supabase.from('rooms').delete().eq('id', ghostId);

    if (error) {
        console.error('Error deleting room:', error);
    } else {
        console.log('Successfully deleted the ghost room!');
    }
}

deleteGhost();
