/**
 * Inngest webhook endpoint
 * Handles all Inngest events and background job execution
 */

import { serve } from 'inngest/next';
import { inngest, functions } from '@/inngest';

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  servePath: '/api/inngest',
  streaming: 'allow', // Enable streaming for better performance
});
