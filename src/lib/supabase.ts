import { createClient } from '@supabase/supabase-js';

// Handle both client-side (import.meta.env) and server-side (process.env) contexts
const getEnvVar = (key: string, fallback: string) => {
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

export type Database = {
  public: {
    Tables: {
      prospects: {
        Row: {
          id: string;
          nom: string;
          telephone: string | null;
          adresse: string | null;
          site_web: string | null;
          score_seo: number | null;
          message_personnalise: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          nom: string;
          telephone?: string | null;
          adresse?: string | null;
          site_web?: string | null;
          score_seo?: number | null;
          message_personnalise?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          nom?: string;
          telephone?: string | null;
          adresse?: string | null;
          site_web?: string | null;
          score_seo?: number | null;
          message_personnalise?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      custom_tables: {
        Row: {
          id: string;
          name: string;
          schema: any;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          schema: any;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          schema?: any;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};