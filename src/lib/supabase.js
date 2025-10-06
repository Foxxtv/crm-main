import { createClient } from '@supabase/supabase-js';

// Handle both client-side (import.meta.env) and server-side (process.env) contexts
const getEnvVar = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

const supabaseUrl =  'https://iajfqvvrhbvtgcufcige.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export const Database = {};