/**
 * Database Module Exports
 *
 * Centralized exports for all database-related functionality
 */

// Client exports
export {
  supabase,
  getServiceSupabase,
  getServerSupabase,
  getMiddlewareSupabase,
  Tables,
  Buckets,
} from './client';

// Query helpers
export * from './queries';

// Types
export type { Database } from './types';
