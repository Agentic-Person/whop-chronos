/**
 * Supabase Database Client
 *
 * Provides configured Supabase clients for different contexts:
 * - Client-side (browser) with anon key
 * - Server-side with service role key
 * - Server components with cookies support
 */

import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
 * Client-side Supabase client
 * Uses anon key and respects RLS policies
 * Use in Client Components and API routes for user-scoped operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'chronos',
    },
  },
});

/**
 * Server-side Supabase client with service role
 * BYPASSES Row Level Security - use with caution
 * Only use for:
 * - Background jobs (Inngest)
 * - Admin operations
 * - System-level queries
 * - Webhook handlers
 */
export function getServiceSupabase(): ReturnType<typeof createClient<Database>> {
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-application-name': 'chronos-service',
      },
    },
  });
}

/**
 * Server Component Supabase client
 * Uses cookies for authentication
 * Respects RLS policies based on JWT claims
 * Use in Server Components and Server Actions
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle cookies set error in server components
          console.error('Error setting cookie:', error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookies remove error in server components
          console.error('Error removing cookie:', error);
        }
      },
    },
  });
}

/**
 * Middleware Supabase client
 * For use in Next.js middleware
 * Cannot use async cookies() - use request/response objects instead
 */
export function getMiddlewareSupabase(
  request: Request,
  response: Response,
) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.headers
          .get('cookie')
          ?.split('; ')
          .find((cookie) => cookie.startsWith(`${name}=`))
          ?.split('=')[1];
      },
      set(name: string, value: string, options: CookieOptions) {
        response.headers.append(
          'Set-Cookie',
          `${name}=${value}; Path=${options.path || '/'}; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''} ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`.trim(),
        );
      },
      remove(name: string, options: CookieOptions) {
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=${options.path || '/'}; Max-Age=0`,
        );
      },
    },
  });
}

/**
 * Type-safe table names
 */
export const Tables = {
  CREATORS: 'creators',
  STUDENTS: 'students',
  VIDEOS: 'videos',
  VIDEO_CHUNKS: 'video_chunks',
  COURSES: 'courses',
  COURSE_MODULES: 'course_modules',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages',
  VIDEO_ANALYTICS: 'video_analytics',
  USAGE_METRICS: 'usage_metrics',
} as const;

/**
 * Storage bucket names
 */
export const Buckets = {
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  USER_UPLOADS: 'user-uploads',
} as const;
