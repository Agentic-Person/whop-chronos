/**
 * Inngest webhook endpoint
 * Handles all Inngest events and background job execution
 */

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import {
  transcribeVideoFunction,
  transcribeVideoErrorHandler,
} from '@/inngest/transcribe-video';

// Register all Inngest functions
const functions = [
  transcribeVideoFunction,
  transcribeVideoErrorHandler,
];

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  servePath: '/api/inngest',
  streaming: 'allow', // Enable streaming for better performance
});
