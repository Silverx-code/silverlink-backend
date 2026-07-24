const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Server-side client — uses the service role key so uploads bypass Row Level
// Security entirely. NEVER expose this key to the frontend/mobile app; it
// only ever lives here, in the backend's environment variables.
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});

module.exports = { supabase };
