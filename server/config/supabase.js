const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// The server must use the service-role key: it bypasses Row Level Security, so RLS can stay
// ENABLED on every table (blocking anyone who gets hold of the public anon key).
// SUPABASE_ANON_KEY is accepted only as a fallback for older deployments.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment (.env locally, Render dashboard in production).');
} else if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set; falling back to SUPABASE_ANON_KEY. Uploads and writes will fail once RLS is enabled.');
}

const supabase = createClient(supabaseUrl || 'http://invalid.local', supabaseKey || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;
