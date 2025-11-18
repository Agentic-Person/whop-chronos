/**
 * Browser-only Supabase Client
 *
 * Use this in client components (marked with 'use client')
 * This file doesn't import server-only modules like 'next/headers'
 *
 * DEVELOPMENT MODE:
 * When DEV_BYPASS_AUTH=true, this client uses the service role key
 * to bypass RLS policies. This allows testing without authentication.
 *
 * WARNING: Service role key bypasses ALL RLS policies!
 * Only use in development. NEVER expose in production.
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

// Check if we're in dev mode with auth bypass enabled
const isDev = process.env.NODE_ENV === 'development';
const bypassAuth = process.env['NEXT_PUBLIC_DEV_BYPASS_AUTH'] === 'true';
const serviceRoleKey = process.env['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'];

// Determine which key to use
const supabaseKey = isDev && bypassAuth && serviceRoleKey
  ? serviceRoleKey  // Dev mode: bypass RLS
  : supabaseAnonKey; // Production: respect RLS

// Log warning in dev mode when using service role key
if (isDev && bypassAuth && serviceRoleKey) {
  console.warn(
    '⚠️  DEV MODE: Using Supabase service role key (bypassing RLS policies). ' +
    'This is only safe in development with DEV_BYPASS_AUTH=true'
  );
}

/**
 * Client-side Supabase client for browser use
 *
 * In production: Uses anonymous key (respects RLS policies)
 * In dev mode with DEV_BYPASS_AUTH=true: Uses service role key (bypasses RLS)
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
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
