/**
 * Browser-only Supabase Client
 *
 * Use this in client components (marked with 'use client')
 * This file doesn't import server-only modules like 'next/headers'
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
 * Safe to use in client components
 * Respects RLS policies
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
