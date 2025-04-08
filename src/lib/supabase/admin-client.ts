import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Debug environment variables
console.log('Supabase URL:', !!import.meta.env.VITE_SUPABASE_URL ? 'defined' : 'undefined');
console.log('Service Role Key:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing required Supabase environment variables. ' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are defined in your .env file.'
  );
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});