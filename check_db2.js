const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data, error } = await supabase
        .from('relatorios')
        .select('id, share_token, is_public, dados, json_data')
        .eq('share_token', '1d88893b-8d32-473b-b2d6-abf3542c0c2c');

    if (error) {
        console.error(error);
    } else {
        console.log('--- FOUND:', data.length);
        if (data.length > 0) {
            console.log('id:', data[0].id);
            console.log('is_public:', data[0].is_public);
            console.log('dados len:', data[0].dados ? JSON.stringify(data[0].dados).length : 'null');
            console.log('json_data len:', data[0].json_data ? JSON.stringify(data[0].json_data).length : 'null');
        }
    }
}

test();
