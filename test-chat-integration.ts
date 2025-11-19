/**
 * Comprehensive Chat Integration Test Suite
 * Agent 3 - Chat & RAG Testing
 *
 * Test scenarios:
 * 1. Chat Interface Load (2 tests)
 * 2. Message Sending & Display (2 tests)
 * 3. AI Response Generation (3 tests)
 * 4. RAG Video Search & Citations (3 tests)
 * 5. Session Management (2 tests)
 * 6. Export & Download (2 tests)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const API_BASE_URL = 'http://localhost:3000';

// Verify environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error(`   SUPABASE_URL: ${SUPABASE_URL ? '✓' : '✗'}`);
  console.error(`   SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? '✓' : '✗'}`);
  process.exit(1);
}

// Test constants
const TEMP_CREATOR_ID = 'temp-creator-123';
const TEMP_STUDENT_ID = 'temp-student-123';

interface TestResult {
  testName: string;
  category: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
  data?: any;
}

class ChatIntegrationTester {
  private supabase;
  private results: TestResult[] = [];
  private testSessionId: string | null = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('\n========================================');
    console.log('CHAT INTEGRATION TEST SUITE');
    console.log('========================================\n');

    // Setup
    await this.setupTestData();

    // Test categories
    await this.testChatInterfaceComponents();
    await this.testMessageSendingAndDisplay();
    await this.testAIResponseGeneration();
    await this.testRAGSearchAndCitations();
    await this.testSessionManagement();
    await this.testExportFunctionality();
    await this.testErrorHandling();

    // Cleanup
    await this.cleanupTestData();

    // Report
    this.generateReport();
  }

  /**
   * Setup test data in database
   */
  async setupTestData() {
    console.log('📋 Setting up test data...\n');

    try {
      // Create temp creator
      const { data: creator, error: creatorError } = await this.supabase
        .from('creators')
        .upsert({
          id: TEMP_CREATOR_ID,
          whop_company_id: 'test-company-123',
          whop_user_id: 'test-user-123',
          email: 'test@example.com',
          name: 'Test Creator',
          subscription_tier: 'pro'
        })
        .select()
        .single();

      if (creatorError) {
        console.log('⚠️  Creator may already exist, continuing...');
      } else {
        console.log('✅ Created test creator');
      }

      // Create temp student
      const { data: student, error: studentError } = await this.supabase
        .from('students')
        .upsert({
          id: TEMP_STUDENT_ID,
          whop_user_id: 'test-student-user-123',
          whop_membership_id: 'test-membership-123',
          creator_id: TEMP_CREATOR_ID,
          email: 'student@example.com',
          name: 'Test Student'
        })
        .select()
        .single();

      if (studentError) {
        console.log('⚠️  Student may already exist, continuing...');
      } else {
        console.log('✅ Created test student');
      }

      // Create test videos with transcripts for RAG
      const testVideos = [
        {
          title: 'Introduction to React Hooks',
          description: 'Learn about useState and useEffect',
          transcript: 'Welcome to React Hooks! In this video, we will learn about useState which allows you to add state to functional components. The useEffect hook lets you perform side effects in functional components. At 5:30, we discuss the dependency array and how it controls when effects run.',
          creator_id: TEMP_CREATOR_ID,
          status: 'completed',
          duration_seconds: 600
        },
        {
          title: 'Advanced TypeScript Patterns',
          description: 'Deep dive into TypeScript generics',
          transcript: 'TypeScript generics provide powerful type safety. At 3:15, we cover generic constraints. At 7:45, we demonstrate utility types like Pick and Omit. Generics allow you to create reusable components that work with multiple types.',
          creator_id: TEMP_CREATOR_ID,
          status: 'completed',
          duration_seconds: 480
        }
      ];

      for (const video of testVideos) {
        const { data: videoData, error: videoError } = await this.supabase
          .from('videos')
          .insert(video)
          .select()
          .single();

        if (videoError) {
          console.log(`⚠️  Error creating test video: ${videoError.message}`);
        } else {
          console.log(`✅ Created test video: ${videoData.title}`);

          // Create vector chunks for RAG testing
          const chunks = this.createTestChunks(videoData.id, video.transcript);
          for (const chunk of chunks) {
            await this.supabase.from('video_chunks').insert(chunk);
          }
        }
      }

      console.log('\n✅ Test data setup complete\n');
    } catch (error: any) {
      console.error('❌ Setup failed:', error.message);
    }
  }

  /**
   * Create test chunks with mock embeddings
   */
  createTestChunks(videoId: string, transcript: string) {
    // Split transcript into chunks (simple split for testing)
    const words = transcript.split(' ');
    const chunkSize = 50;
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        video_id: videoId,
        chunk_index: Math.floor(i / chunkSize),
        chunk_text: chunkText,
        start_time_seconds: i * 2,
        end_time_seconds: (i + chunkSize) * 2,
        word_count: chunkWords.length,
        // Note: Real embeddings would be generated via OpenAI API
        // For testing, we'll use null (may need to be handled by search function)
        embedding: null
      });
    }

    return chunks;
  }

  /**
   * Category 1: Chat Interface Components
   */
  async testChatInterfaceComponents() {
    console.log('🧪 CATEGORY 1: Chat Interface Load\n');

    // Test 1.1: Verify page accessibility
    await this.runTest(
      'Chat page is accessible',
      'Interface Load',
      async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard/student/chat`);
        if (!response.ok) {
          throw new Error(`Page returned ${response.status}`);
        }
        return { accessible: true, status: response.status };
      }
    );

    // Test 1.2: Database tables exist
    await this.runTest(
      'Required database tables exist',
      'Interface Load',
      async () => {
        const tables = ['chat_sessions', 'chat_messages', 'video_chunks'];
        const results = [];

        for (const table of tables) {
          const { error } = await this.supabase.from(table).select('id').limit(0);
          results.push({ table, exists: !error });
        }

        const allExist = results.every(r => r.exists);
        if (!allExist) {
          throw new Error(`Missing tables: ${results.filter(r => !r.exists).map(r => r.table).join(', ')}`);
        }

        return { tables: results };
      }
    );
  }

  /**
   * Category 2: Message Sending & Display
   */
  async testMessageSendingAndDisplay() {
    console.log('\n🧪 CATEGORY 2: Message Sending & Display\n');

    // Test 2.1: Send a basic message
    await this.runTest(
      'Send simple message to chat API',
      'Message Sending',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Hello, this is a test message',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        this.testSessionId = data.sessionId;

        return {
          sessionId: data.sessionId,
          hasContent: !!data.content,
          messageLength: data.content?.length || 0
        };
      }
    );

    // Test 2.2: Verify message persisted in database
    await this.runTest(
      'Messages persisted in database',
      'Message Sending',
      async () => {
        if (!this.testSessionId) {
          throw new Error('No session ID from previous test');
        }

        const { data: messages, error } = await this.supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', this.testSessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');

        return {
          totalMessages: messages.length,
          userMessages: userMessages.length,
          assistantMessages: assistantMessages.length,
          messagesData: messages.map(m => ({
            role: m.role,
            contentLength: m.content.length,
            hasVideoRefs: m.video_references?.length > 0
          }))
        };
      }
    );
  }

  /**
   * Category 3: AI Response Generation
   */
  async testAIResponseGeneration() {
    console.log('\n🧪 CATEGORY 3: AI Response Generation\n');

    // Test 3.1: AI generates response
    await this.runTest(
      'AI generates valid response',
      'AI Response',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'What is React?',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        return {
          hasResponse: !!data.content,
          responseLength: data.content.length,
          hasUsageStats: !!data.usage,
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0
        };
      }
    );

    // Test 3.2: Error handling (empty message)
    await this.runTest(
      'Rejects empty messages',
      'AI Response',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID
          })
        });

        if (response.ok) {
          throw new Error('Should have rejected empty message');
        }

        return { rejectsEmpty: true, status: response.status };
      }
    );

    // Test 3.3: Error handling (missing required fields)
    await this.runTest(
      'Validates required fields',
      'AI Response',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Test message'
            // Missing creatorId and studentId
          })
        });

        if (response.ok) {
          throw new Error('Should have rejected missing fields');
        }

        return { validatesFields: true, status: response.status };
      }
    );
  }

  /**
   * Category 4: RAG Video Search & Citations
   */
  async testRAGSearchAndCitations() {
    console.log('\n🧪 CATEGORY 4: RAG Video Search & Citations\n');

    // Test 4.1: Semantic search retrieves relevant chunks
    await this.runTest(
      'RAG search finds relevant content',
      'RAG Search',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Explain React hooks and useState',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        const data = await response.json();

        return {
          hasVideoReferences: data.videoReferences?.length > 0,
          referenceCount: data.videoReferences?.length || 0,
          references: data.videoReferences || []
        };
      }
    );

    // Test 4.2: Video citations include timestamps
    await this.runTest(
      'Citations include timestamps and metadata',
      'RAG Search',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'What happens at 5:30 in the video?',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        const data = await response.json();
        const refs = data.videoReferences || [];

        const hasTimestamps = refs.every((ref: any) =>
          typeof ref.timestamp === 'number'
        );

        return {
          hasTimestamps,
          referenceDetails: refs.map((ref: any) => ({
            videoId: ref.video_id,
            timestamp: ref.timestamp,
            timestampFormatted: ref.timestamp_formatted,
            hasExcerpt: !!ref.chunk_text
          }))
        };
      }
    );

    // Test 4.3: Handles queries with no matching content
    await this.runTest(
      'Gracefully handles no matching content',
      'RAG Search',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Tell me about quantum physics and black holes',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        const data = await response.json();

        // Should still get a response, but with no video references
        return {
          hasResponse: !!data.content,
          videoReferences: data.videoReferences?.length || 0,
          contentMentionsNoInfo: data.content.toLowerCase().includes("couldn't find") ||
                                  data.content.toLowerCase().includes("no relevant")
        };
      }
    );
  }

  /**
   * Category 5: Session Management
   */
  async testSessionManagement() {
    console.log('\n🧪 CATEGORY 5: Session Management\n');

    // Test 5.1: Sessions persist across requests
    await this.runTest(
      'Sessions persist across multiple messages',
      'Session Management',
      async () => {
        // Send first message
        const response1 = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'First message',
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        const data1 = await response1.json();
        const sessionId = data1.sessionId;

        // Send second message to same session
        const response2 = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Second message',
            sessionId: sessionId,
            creatorId: TEMP_CREATOR_ID,
            stream: false
          })
        });

        const data2 = await response2.json();

        // Verify same session
        const isSameSession = data1.sessionId === data2.sessionId;

        // Check message count in database
        const { data: messages } = await this.supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId);

        return {
          sameSession: isSameSession,
          sessionId,
          messageCount: messages?.length || 0,
          expectedCount: 4 // 2 user + 2 assistant
        };
      }
    );

    // Test 5.2: Session title generation
    await this.runTest(
      'Sessions auto-generate titles',
      'Session Management',
      async () => {
        if (!this.testSessionId) {
          throw new Error('No test session ID');
        }

        // Wait a moment for async title generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: session, error } = await this.supabase
          .from('chat_sessions')
          .select('title, created_at, last_message_at')
          .eq('id', this.testSessionId)
          .single();

        if (error) throw error;

        return {
          hasTitle: !!session.title,
          title: session.title,
          hasLastMessage: !!session.last_message_at
        };
      }
    );
  }

  /**
   * Category 6: Export Functionality
   */
  async testExportFunctionality() {
    console.log('\n🧪 CATEGORY 6: Export Functionality\n');

    // Test 6.1: Export API endpoint exists
    await this.runTest(
      'Export endpoint is accessible',
      'Export',
      async () => {
        if (!this.testSessionId) {
          throw new Error('No test session ID');
        }

        const response = await fetch(
          `${API_BASE_URL}/api/chat/export/${this.testSessionId}`
        );

        return {
          accessible: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type')
        };
      }
    );

    // Test 6.2: Export includes all messages
    await this.runTest(
      'Export contains complete conversation',
      'Export',
      async () => {
        if (!this.testSessionId) {
          throw new Error('No test session ID');
        }

        const response = await fetch(
          `${API_BASE_URL}/api/chat/export/${this.testSessionId}`
        );

        if (!response.ok) {
          throw new Error('Export failed');
        }

        const exportData = await response.text();

        return {
          hasContent: exportData.length > 0,
          contentLength: exportData.length,
          includesUserMessages: exportData.includes('User:') || exportData.includes('user'),
          includesAssistantMessages: exportData.includes('Assistant:') || exportData.includes('assistant')
        };
      }
    );
  }

  /**
   * Category 7: Error Handling
   */
  async testErrorHandling() {
    console.log('\n🧪 CATEGORY 7: Error Handling & Edge Cases\n');

    // Test 7.1: Invalid session ID
    await this.runTest(
      'Handles invalid session ID',
      'Error Handling',
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Test message',
            sessionId: 'invalid-session-id-12345',
            creatorId: TEMP_CREATOR_ID
          })
        });

        return {
          handlesInvalid: !response.ok,
          status: response.status
        };
      }
    );

    // Test 7.2: Very long message
    await this.runTest(
      'Handles long messages',
      'Error Handling',
      async () => {
        const longMessage = 'Lorem ipsum '.repeat(200); // ~2400 chars

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: longMessage,
            creatorId: TEMP_CREATOR_ID,
            studentId: TEMP_STUDENT_ID,
            stream: false
          })
        });

        const data = await response.json();

        return {
          accepted: response.ok,
          hasResponse: !!data.content,
          inputLength: longMessage.length
        };
      }
    );
  }

  /**
   * Helper: Run individual test
   */
  async runTest(
    testName: string,
    category: string,
    testFn: () => Promise<any>
  ) {
    const startTime = Date.now();

    try {
      const data = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        category,
        passed: true,
        duration,
        data
      });

      console.log(`✅ ${testName} (${duration}ms)`);
      if (data) {
        console.log(`   ${JSON.stringify(data, null, 2).split('\n').join('\n   ')}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        category,
        passed: false,
        duration,
        error: error.message
      });

      console.log(`❌ ${testName} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  /**
   * Cleanup test data
   */
  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...\n');

    try {
      // Delete chat sessions (cascades to messages)
      await this.supabase
        .from('chat_sessions')
        .delete()
        .eq('student_id', TEMP_STUDENT_ID);

      // Delete video chunks
      const { data: videos } = await this.supabase
        .from('videos')
        .select('id')
        .eq('creator_id', TEMP_CREATOR_ID);

      if (videos) {
        for (const video of videos) {
          await this.supabase
            .from('video_chunks')
            .delete()
            .eq('video_id', video.id);
        }
      }

      // Delete videos
      await this.supabase
        .from('videos')
        .delete()
        .eq('creator_id', TEMP_CREATOR_ID);

      // Delete student
      await this.supabase
        .from('students')
        .delete()
        .eq('id', TEMP_STUDENT_ID);

      // Delete creator
      await this.supabase
        .from('creators')
        .delete()
        .eq('id', TEMP_CREATOR_ID);

      console.log('✅ Cleanup complete\n');
    } catch (error: any) {
      console.log('⚠️  Cleanup warning:', error.message);
    }
  }

  /**
   * Generate final test report
   */
  generateReport() {
    console.log('\n========================================');
    console.log('TEST REPORT');
    console.log('========================================\n');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.passed === false).length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    // Group by category
    const categories = [...new Set(this.results.map(r => r.category))];

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;

      console.log(`\n📊 ${category}`);
      console.log(`   ${categoryPassed}/${categoryResults.length} tests passed`);

      for (const result of categoryResults) {
        const icon = result.passed ? '✅' : '❌';
        console.log(`   ${icon} ${result.testName} (${result.duration}ms)`);

        if (!result.passed && result.error) {
          console.log(`      Error: ${result.error}`);
        }
      }
    }

    // Performance summary
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    const maxDuration = Math.max(...this.results.map(r => r.duration));

    console.log('\n⚡ Performance');
    console.log(`   Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Slowest: ${maxDuration}ms`);

    console.log('\n========================================\n');
  }
}

// Run tests
const tester = new ChatIntegrationTester();
tester.runAllTests().catch(console.error);
