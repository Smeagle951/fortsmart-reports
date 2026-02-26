import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    const { data, error } = await supabase
        .from('relatorios')
        .select('id, is_public, share_token, json_data, dados')
        .eq('share_token', '1d88893b-8d32-473b-b2d6-abf3542c0c2c');

    if (error) console.error(error);
    else {
        console.log('--- FOUND:', data.length);
        if (data.length > 0) {
            console.log('id:', data[0].id);
            console.log('is_public:', data[0].is_public);
            console.log('dados len:', JSON.stringify(data[0].dados)?.length);
            console.log('json_data len:', JSON.stringify(data[0].json_data)?.length);
        }
    }
}

test();
