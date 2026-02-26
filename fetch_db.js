const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const dotenv = require('dotenv');
        dotenv.config({ path: '.env.local' });
    } catch (e) {
        // If dotenv is not installed, parse manually
        const content = fs.readFileSync('.env.local', 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim();
            }
        });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("Missing URL or Key");
        return;
    }

    const token = '1d88893b-8d32-473b-b2d6-abf3542c0c2c';
    console.log(`Fetching from: ${url}/rest/v1/relatorios?share_token=eq.${token}`);

    const res = await fetch(`${url}/rest/v1/relatorios?share_token=eq.${token}&select=id,is_public,share_token,share_expires_at,app_id`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (!res.ok) {
        console.error("Fetch failed", res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log("Data from DB:", JSON.stringify(data, null, 2));
}

test();
