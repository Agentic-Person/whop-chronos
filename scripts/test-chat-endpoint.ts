/**
 * Test Script for Enhanced RAG Chat API Endpoint
 *
 * Tests the /api/chat endpoint with:
 * - Session creation
 * - Streaming responses
 * - Non-streaming responses
 * - Conversation history
 * - Cost tracking
 * - Error handling
 *
 * Usage:
 *   npm run test:chat
 */

import * as dotenv from 'dotenv';
import { getServiceSupabase } from '../lib/db/client';

dotenv.config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface ChatResponse {
  content: string;
  sessionId: string;
  videoReferences: any[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    embedding_queries: number;
    total_tokens: number;
    cost_breakdown: any;
    cost_formatted: string;
  };
  cached: boolean;
}

/**
 * Test 1: Create new session with non-streaming response
 */
async function testNewSessionNonStreaming() {
  console.log('\n=== Test 1: New Session (Non-Streaming) ===\n');

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What is RSI and how do traders use it?',
      creatorId: await getTestCreatorId(),
      studentId: await getTestStudentId(),
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error:', error);
    return null;
  }

  const data: ChatResponse = await response.json();

  console.log('✅ Response received:');
  console.log('Session ID:', data.sessionId);
  console.log('Answer:', data.content.substring(0, 200) + '...');
  console.log('Video References:', data.videoReferences.length);
  console.log('Cost:', data.usage.cost_formatted);
  console.log('Tokens:', `${data.usage.input_tokens} in + ${data.usage.output_tokens} out = ${data.usage.total_tokens} total`);

  return data.sessionId;
}

/**
 * Test 2: Continue session with streaming response
 */
async function testContinueSessionStreaming(sessionId: string) {
  console.log('\n=== Test 2: Continue Session (Streaming) ===\n');

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Can you explain RSI divergence in more detail?',
      sessionId,
      creatorId: await getTestCreatorId(),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Streaming response:');
  console.log('---');

  let fullContent = '';
  let usage = null;

  if (!response.body) {
    console.error('❌ No response body');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const events = parseSSE(chunk);

      for (const event of events) {
        if (event.event === 'content') {
          const content = event.data.content;
          fullContent += content;
          process.stdout.write(content);
        } else if (event.event === 'done') {
          usage = event.data;
          console.log('\n---');
          console.log(`\n✅ Stream complete:`);
          console.log('Total Cost:', `$${event.data.cost.total_cost.toFixed(6)}`);
          console.log('Tokens:', `${event.data.usage.inputTokens} in + ${event.data.usage.outputTokens} out`);
          console.log('Video References:', event.data.videoReferences.length);
        } else if (event.event === 'error') {
          console.error('\n❌ Stream error:', event.data.error);
        }
      }
    }
  } catch (error) {
    console.error('\n❌ Error reading stream:', error);
  }
}

/**
 * Test 3: Course-specific search
 */
async function testCourseSpecificSearch() {
  console.log('\n=== Test 3: Course-Specific Search ===\n');

  // First, get a test course ID
  const supabase = getServiceSupabase();
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .limit(1)
    .single();

  if (!courses) {
    console.log('⏭️  Skipping: No courses found in database');
    return;
  }

  console.log('Searching within course:', courses.title);

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What topics are covered in this course?',
      creatorId: await getTestCreatorId(),
      studentId: await getTestStudentId(),
      courseId: courses.id,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error:', error);
    return;
  }

  const data: ChatResponse = await response.json();

  console.log('✅ Response received:');
  console.log('Answer:', data.content.substring(0, 200) + '...');
  console.log('Video References:', data.videoReferences.length);
  console.log('Cost:', data.usage.cost_formatted);
}

/**
 * Test 4: Get session history
 */
async function testGetSessionHistory(sessionId: string) {
  console.log('\n=== Test 4: Get Session History ===\n');

  const response = await fetch(`${API_URL}/api/chat?sessionId=${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error:', error);
    return;
  }

  const session = await response.json();

  console.log('✅ Session retrieved:');
  console.log('Session ID:', session.id);
  console.log('Title:', session.title || '(No title yet)');
  console.log('Messages:', session.messages?.length || 0);
  console.log('Created:', new Date(session.created_at).toLocaleString());

  if (session.messages && session.messages.length > 0) {
    console.log('\nMessage History:');
    session.messages.forEach((msg: any, i: number) => {
      console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 80)}...`);
    });
  }
}

/**
 * Test 5: Error handling - Invalid session
 */
async function testErrorHandling() {
  console.log('\n=== Test 5: Error Handling ===\n');

  // Test 5a: Invalid session ID
  console.log('Testing invalid session ID...');
  const response1 = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Test message',
      sessionId: 'invalid-session-id',
      creatorId: await getTestCreatorId(),
    }),
  });

  if (!response1.ok) {
    console.log('✅ Expected error:', (await response1.json()).error);
  } else {
    console.log('❌ Should have returned error');
  }

  // Test 5b: Missing required field
  console.log('\nTesting missing required field...');
  const response2 = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Test message',
      // Missing creatorId
    }),
  });

  if (!response2.ok) {
    console.log('✅ Expected error:', (await response2.json()).error);
  } else {
    console.log('❌ Should have returned error');
  }
}

/**
 * Test 6: Cost tracking verification
 */
async function testCostTracking() {
  console.log('\n=== Test 6: Cost Tracking Verification ===\n');

  const supabase = getServiceSupabase();
  const creatorId = await getTestCreatorId();
  const today = new Date().toISOString().split('T')[0];

  const { data: metrics } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('date', today)
    .single();

  if (metrics) {
    console.log('✅ Usage metrics found for today:');
    console.log('Messages Sent:', metrics.chat_messages_sent);
    console.log('AI Credits Used:', metrics.ai_credits_used);
    console.log('Total Input Tokens:', metrics.metadata?.total_input_tokens || 0);
    console.log('Total Output Tokens:', metrics.metadata?.total_output_tokens || 0);
    console.log('Total Cost:', `$${(metrics.metadata?.total_ai_cost_usd || 0).toFixed(6)}`);
  } else {
    console.log('⚠️  No usage metrics found for today');
  }
}

/**
 * Helper: Parse SSE events
 */
function parseSSE(chunk: string): Array<{ event: string; data: any }> {
  const events: Array<{ event: string; data: any }> = [];
  const lines = chunk.split('\n');

  let currentEvent = 'message';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6).trim();
    } else if (line === '' && currentData) {
      try {
        events.push({
          event: currentEvent,
          data: JSON.parse(currentData),
        });
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
      currentEvent = 'message';
      currentData = '';
    }
  }

  return events;
}

/**
 * Helper: Get test creator ID
 */
async function getTestCreatorId(): Promise<string> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('creators')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!data) {
    throw new Error('No active creators found in database. Please seed database first.');
  }

  return data.id;
}

/**
 * Helper: Get test student ID
 */
async function getTestStudentId(): Promise<string> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('students')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!data) {
    throw new Error('No active students found in database. Please seed database first.');
  }

  return data.id;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Testing Enhanced RAG Chat API Endpoint');
  console.log('==========================================');

  try {
    // Test 1: New session (non-streaming)
    const sessionId = await testNewSessionNonStreaming();

    if (!sessionId) {
      console.log('\n❌ Test 1 failed, skipping remaining tests');
      return;
    }

    // Test 2: Continue session (streaming)
    await testContinueSessionStreaming(sessionId);

    // Test 3: Course-specific search
    await testCourseSpecificSearch();

    // Test 4: Get session history
    await testGetSessionHistory(sessionId);

    // Test 5: Error handling
    await testErrorHandling();

    // Test 6: Cost tracking
    await testCostTracking();

    console.log('\n✅ All tests completed!');
    console.log('==========================================');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
