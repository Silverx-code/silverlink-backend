const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Deliberately does NOT throw if unconfigured — a missing/wrong config value here
// should fail the specific upload request that needs it (a clear 500 with a real
// message), not crash the entire server at boot. uploadToStorage.js checks for
// `supabase` being null and raises a proper ApiError at the point of use instead.
let supabase = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — file uploads will fail until configured.');
}

module.exports = supabase;
