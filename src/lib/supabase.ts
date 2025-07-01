/**
 * Supabase client configuration and initialization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration interface
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Get Supabase configuration from environment variables
 * @returns Supabase configuration object
 * @throws Error if required environment variables are missing
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return {
    url,
    anonKey
  };
}

/**
 * Create a Supabase client instance
 * @param config Optional custom configuration (uses environment variables if not provided)
 * @returns Configured Supabase client
 */
export function createSupabaseClient(config?: SupabaseConfig): SupabaseClient {
  const supabaseConfig = config || getSupabaseConfig();
  
  return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

/**
 * Default Supabase client instance
 * Use this for most operations unless you need a custom configuration
 */
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}