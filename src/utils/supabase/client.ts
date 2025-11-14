import { createClient } from '@jsr/supabase__supabase-js';

// Access Vite environment variables correctly
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

const supabaseUrl = envUrl || (envProjectId ? `https://${envProjectId}.supabase.co` : 'https://test.supabase.co');
const supabaseAnonKey = envAnon || 'test-anon-key';

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase Config:', {
    hasUrl: !!envUrl,
    hasAnonKey: !!envAnon,
    hasProjectId: !!envProjectId,
    url: envUrl || (envProjectId ? `https://${envProjectId}.supabase.co` : 'not set'),
    anonKeyLength: envAnon?.length || 0,
    anonKeyPreview: envAnon ? `${envAnon.substring(0, 20)}...` : 'not set',
  });
}

if (!envUrl && !envProjectId && !envAnon) {
  console.warn('⚠️ Supabase URL or Anon Key not found. Auth features will not work.');
  console.warn('Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Validate anon key format (should be a JWT-like string starting with eyJ)
if (envAnon && !envAnon.startsWith('eyJ')) {
  console.warn('⚠️ Warning: Supabase anon key should start with "eyJ". Make sure you\'re using the "anon public" key, not the "service_role" key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

