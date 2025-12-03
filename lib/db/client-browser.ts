/**
 * Browser-only Supabase Client
 *
 * Use this in client components (marked with 'use client')
 * This file doesn't import server-only modules like 'next/headers'
 *
 * SECURITY: This client ALWAYS uses the anon key and respects RLS policies.
 * The service role key is NEVER used in browser code as it bypasses ALL security.
 *
 * For development with DEV_BYPASS_AUTH=true, use API routes with proper
 * server-side authentication instead of exposing the service role key.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

/**
 * Client-side Supabase client for browser use
 *
 * ALWAYS uses the anonymous key and respects Row Level Security (RLS) policies.
 * This ensures that users can only access data they're authorized to see.
 *
 * For testing without authentication, use API routes that properly validate
 * DEV_BYPASS_AUTH on the server side, never expose service role keys to the browser.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'chronos-browser',
    },
  },
});
