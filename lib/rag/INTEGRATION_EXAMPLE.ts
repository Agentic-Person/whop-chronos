/**
 * RAG Engine Integration Example
 *
 * This file demonstrates how to integrate the RAG engine with the Claude API
 * for a complete AI chat experience with video content retrieval.
 *
 * This is a reference implementation - copy patterns to app/api/chat/route.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  enhancedSearch,
  buildContext,
  buildSystemPrompt,
  extractCitations,
} from '@/lib/rag';

// ============================================================================
// EXAMPLE 1: Simple Question Answering
// ============================================================================

export async function simpleRAGChat(
  userQuestion: string,
  studentId: string
): Promise<{
  answer: string;
  sources: Array<{
    video_id: string;
    video_title: string;
    timestamp: string;
    url?: string;
  }>;
}> {
  console.log(`[RAG] Processing question: "${userQuestion}"`);

  // 1. Search for relevant video content
  const searchResults = await enhancedSearch(userQuestion, {
    match_count: 5,
    similarity_threshold: 0.7,
    boost_viewed_by_student: studentId,
    boost_recent_videos: true,
    enable_cache: true,
  });

  console.log(`[RAG] Found ${searchResults.length} relevant chunks`);

  if (searchResults.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the videos to answer your question. Please try rephrasing or ask about a different topic.",
      sources: [],
    };
  }

  // 2. Build context for Claude
  const context = buildContext(searchResults, {
    max_tokens: 8000,
    format: 'markdown',
    include_timestamps: true,
    include_video_titles: true,
  });

  console.log(`[RAG] Built context with ${context.total_chunks} chunks, ${context.total_tokens} tokens`);

  // 3. Create system prompt
  const systemPrompt = buildSystemPrompt(context, `
    You are a helpful learning assistant for an online course platform.

    Guidelines:
    - Answer based ONLY on the video transcript excerpts provided
    - Always cite the video and timestamp when referencing information
    - If the answer isn't in the provided context, say so clearly
    - Be concise but thorough
    - Use a friendly, encouraging tone
    - Format your response with markdown
  `);

  // 4. Call Claude API
  const anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']!,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userQuestion,
      },
    ],
  });

  const firstContent = response.content[0];
  const answer = firstContent?.type === 'text' ? firstContent.text : '';

  // 5. Extract citations for UI
  const citations = extractCitations(searchResults);

  return {
    answer,
    sources: citations.map(c => ({
      video_id: c.video_id,
      video_title: c.video_title,
      timestamp: c.timestamp_formatted,
      url: c.video_url,
    })),
  };
}

// ============================================================================
// EXAMPLE 2: Multi-Turn Conversation
// ============================================================================

export async function conversationalRAGChat(
  currentQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  studentId: string,
  previousVideoContext?: string[] // Video IDs from previous turns
): Promise<{
  answer: string;
  sources: Array<any>;
  context_used: boolean;
}> {
  console.log(`[RAG] Conversational turn, history length: ${conversationHistory.length}`);

  // 1. Search for relevant content
  const searchResults = await enhancedSearch(currentQuestion, {
    match_count: 5,
    similarity_threshold: 0.7,
    boost_viewed_by_student: studentId,
    filter_video_ids: previousVideoContext || null, // Optionally restrict to previous videos
  });

  // 2. Build context if we have results
  let systemPrompt: string;
  let contextUsed = false;

  if (searchResults.length > 0) {
    const context = buildContext(searchResults, {
      max_tokens: 6000, // Leave room for conversation history
      format: 'markdown',
    });

    systemPrompt = buildSystemPrompt(context, `
      You are continuing a conversation with a student.
      Use the video content provided to answer their question, but maintain context from previous messages.
    `);

    contextUsed = true;
  } else {
    systemPrompt = `You are a helpful learning assistant. The student's question doesn't match any specific video content, so provide a helpful general response or ask for clarification.`;
  }

  // 3. Build conversation messages
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: currentQuestion,
    },
  ];

  // 4. Call Claude API
  const anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']!,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages,
  });

  const firstContent = response.content[0];
  const answer = firstContent?.type === 'text' ? firstContent.text : '';

  return {
    answer,
    sources: extractCitations(searchResults),
    context_used: contextUsed,
  };
}

// ============================================================================
// EXAMPLE 3: Course-Specific Assistant
// ============================================================================

export async function courseAssistant(
  courseId: string,
  question: string,
  studentId: string
): Promise<{
  answer: string;
  sources: Array<any>;
  course_specific: boolean;
}> {
  console.log(`[RAG] Course-specific question for course ${courseId}`);

  // Import searchWithinCourse
  const { searchWithinCourse } = await import('./search');

  // Search only within this course
  const searchResults = await searchWithinCourse(courseId, question, {
    match_count: 5,
    similarity_threshold: 0.7,
    boost_viewed_by_student: studentId,
  });

  if (searchResults.length === 0) {
    return {
      answer: "I couldn't find relevant information in this course to answer your question. Try asking about a different topic or check other courses.",
      sources: [],
      course_specific: true,
    };
  }

  // Build context
  const context = buildContext(searchResults, {
    max_tokens: 8000,
    format: 'markdown',
  });

  // Create course-specific system prompt
  const systemPrompt = buildSystemPrompt(context, `
    You are a course assistant helping students with this specific course.

    Guidelines:
    - Answer using ONLY content from this course's videos
    - Reference specific lessons and timestamps
    - Suggest which videos to watch for deeper understanding
    - Keep answers focused on the course curriculum
  `);

  const anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']!,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  });

  const firstContent = response.content[0];
  const answer = firstContent?.type === 'text' ? firstContent.text : '';

  return {
    answer,
    sources: extractCitations(searchResults),
    course_specific: true,
  };
}

// ============================================================================
// EXAMPLE 4: Debugging Assistant (with rank scores)
// ============================================================================

export async function debuggingAssistant(
  question: string,
  studentId: string
): Promise<{
  answer: string;
  sources: Array<any>;
  debug_info: {
    search_results_count: number;
    avg_similarity: number;
    top_rank_score: number;
    context_tokens: number;
    videos_searched: number;
  };
}> {
  // Search with lower threshold for debugging
  const searchResults = await enhancedSearch(question, {
    match_count: 10,
    similarity_threshold: 0.5, // Lower threshold
    boost_viewed_by_student: studentId,
    enable_cache: false, // Disable cache for fresh results
  });

  // Build context with rank scores visible
  const context = buildContext(searchResults, {
    max_tokens: 8000,
    format: 'markdown',
    show_rank_scores: true, // Include scores in context
  });

  // Calculate debug metrics
  const avgSimilarity = searchResults.length > 0
    ? searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
    : 0;

  const topRankScore = searchResults.length > 0
    ? searchResults[0]!.rank_score
    : 0;

  const uniqueVideos = new Set(searchResults.map(r => r.video_id)).size;

  const systemPrompt = buildSystemPrompt(context, `
    You are a debugging assistant helping troubleshoot code issues.
    Focus on error messages, common pitfalls, and step-by-step solutions.
  `);

  const anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']!,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 3000, // More tokens for detailed debugging
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  });

  const firstContent = response.content[0];
  const answer = firstContent?.type === 'text' ? firstContent.text : '';

  return {
    answer,
    sources: extractCitations(searchResults),
    debug_info: {
      search_results_count: searchResults.length,
      avg_similarity: avgSimilarity,
      top_rank_score: topRankScore,
      context_tokens: context.total_tokens,
      videos_searched: uniqueVideos,
    },
  };
}

// ============================================================================
// EXAMPLE 5: Streaming Response with RAG
// ============================================================================

export async function streamingRAGChat(
  question: string,
  studentId: string,
  onChunk: (chunk: string) => void
): Promise<{
  full_answer: string;
  sources: Array<any>;
}> {
  // 1. Search (synchronous)
  const searchResults = await enhancedSearch(question, {
    match_count: 5,
    boost_viewed_by_student: studentId,
  });

  // 2. Build context
  const context = buildContext(searchResults);
  const systemPrompt = buildSystemPrompt(context);

  // 3. Stream response from Claude
  const anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']!,
  });

  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  });

  let fullAnswer = '';

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text;
      fullAnswer += text;
      onChunk(text);
    }
  }

  return {
    full_answer: fullAnswer,
    sources: extractCitations(searchResults),
  };
}

// ============================================================================
// EXAMPLE 6: Error Handling and Fallbacks
// ============================================================================

export async function robustRAGChat(
  question: string,
  studentId: string
): Promise<{
  answer: string;
  sources: Array<any>;
  error?: string;
  fallback_used: boolean;
}> {
  try {
    // Attempt RAG flow
    const searchResults = await enhancedSearch(question, {
      match_count: 5,
      boost_viewed_by_student: studentId,
    });

    if (searchResults.length === 0) {
      // Fallback: General assistant without RAG
      console.warn('[RAG] No results found, using general assistant');

      const anthropic = new Anthropic({
        apiKey: process.env['ANTHROPIC_API_KEY']!,
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: 'You are a helpful learning assistant. The specific content was not found, so provide general guidance.',
        messages: [{ role: 'user', content: question }],
      });

      const firstContent = response.content[0];
  const answer = firstContent?.type === 'text' ? firstContent.text : '';

      return {
        answer,
        sources: [],
        fallback_used: true,
      };
    }

    // Normal RAG flow
    const context = buildContext(searchResults);
    const systemPrompt = buildSystemPrompt(context);

    const anthropic = new Anthropic({
      apiKey: process.env['ANTHROPIC_API_KEY']!,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });

    const firstContent = response.content[0];
  const answer = firstContent?.type === 'text' ? firstContent.text : '';

    return {
      answer,
      sources: extractCitations(searchResults),
      fallback_used: false,
    };

  } catch (error) {
    console.error('[RAG] Error in chat flow:', error);

    return {
      answer: "I'm sorry, I encountered an error while processing your question. Please try again.",
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback_used: true,
    };
  }
}

// ============================================================================
// UTILITY: Performance Tracking
// ============================================================================

export async function measureRAGPerformance(
  question: string,
  studentId: string
): Promise<{
  search_time_ms: number;
  context_build_time_ms: number;
  llm_time_ms: number;
  total_time_ms: number;
}> {
  const startTotal = Date.now();

  // Measure search
  const searchStart = Date.now();
  const searchResults = await enhancedSearch(question, {
    match_count: 5,
    boost_viewed_by_student: studentId,
  });
  const searchTime = Date.now() - searchStart;

  // Measure context building
  const contextStart = Date.now();
  const context = buildContext(searchResults);
  const systemPrompt = buildSystemPrompt(context);
  const contextTime = Date.now() - contextStart;

  // Measure LLM call
  const llmStart = Date.now();
  const anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY']!,
  });

  await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  });
  const llmTime = Date.now() - llmStart;

  const totalTime = Date.now() - startTotal;

  return {
    search_time_ms: searchTime,
    context_build_time_ms: contextTime,
    llm_time_ms: llmTime,
    total_time_ms: totalTime,
  };
}
