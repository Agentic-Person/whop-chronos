/**
 * Chat API Route
 *
 * POST /api/chat - Send a message and get AI response
 * Supports both streaming and non-streaming responses
 */

import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import { searchVideoChunks } from '@/lib/video/vector-search';
import {
  generateStreamingRAGResponse,
  generateRAGResponse,
  type ChatMessage,
} from '@/lib/ai/claude';
import { checkRateLimit, formatRateLimitError } from '@/lib/ai/rate-limit';
import { trackMessageCost } from '@/lib/ai/cost-tracker';
import { getCachedResponse, cacheResponse } from '@/lib/ai/cache';
import { createSSEStream, createStreamingResponse } from '@/lib/ai/streaming';
import { extractVideoReferences } from '@/lib/ai/prompts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  sessionId: string;
  stream?: boolean;
  videoIds?: string[]; // Optional: restrict search to specific videos
}

/**
 * POST /api/chat
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { message, sessionId, stream = true, videoIds } = body;

    // Validate request
    if (!message || !message.trim()) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return Response.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session and validate
    const supabase = getServiceSupabase();

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        student:students!inner(id, whop_user_id, creator_id, is_active),
        creator:creators!inner(id, subscription_tier, is_active)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json(
        { error: 'Invalid session' },
        { status: 404 }
      );
    }

    // Check if student and creator are active
    if (!session.student.is_active || !session.creator.is_active) {
      return Response.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    const studentId = session.student.id;
    const creatorId = session.creator.id;
    const tier = session.creator.subscription_tier as 'basic' | 'pro' | 'enterprise';

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(studentId, creatorId, tier);

    if (!rateLimitCheck.allowed) {
      return Response.json(
        {
          error: 'Rate limit exceeded',
          message: formatRateLimitError(rateLimitCheck),
          rateLimitInfo: {
            limitedBy: rateLimitCheck.limitedBy,
            student: rateLimitCheck.student,
            creator: rateLimitCheck.creator,
          },
        },
        { status: 429 }
      );
    }

    // Check cache first (only for non-streaming)
    if (!stream) {
      // Perform vector search
      const searchResults = await searchVideoChunks(message, {
        match_count: 5,
        similarity_threshold: 0.7,
        filter_video_ids: videoIds || session.context_video_ids || null,
      });

      const cachedResponse = await getCachedResponse(message, searchResults);

      if (cachedResponse) {
        // Save user message
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          role: 'user',
          content: message,
        });

        // Save cached assistant response
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: cachedResponse.content,
          video_references: cachedResponse.videoReferences || [],
          model: cachedResponse.model,
          metadata: { cached: true },
        });

        // Update session timestamp
        await supabase
          .from('chat_sessions')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', sessionId);

        return Response.json({
          content: cachedResponse.content,
          videoReferences: cachedResponse.videoReferences,
          cached: true,
        });
      }
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10); // Last 10 messages for context

    const conversationHistory: ChatMessage[] = (messages || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Perform vector search
    const searchResults = await searchVideoChunks(message, {
      match_count: 5,
      similarity_threshold: 0.7,
      filter_video_ids: videoIds || session.context_video_ids || null,
    });

    console.log(`Found ${searchResults.length} relevant video chunks for query`);

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    });

    // Generate response (streaming or non-streaming)
    if (stream) {
      // Streaming response
      const streamGenerator = generateStreamingRAGResponse(
        message,
        searchResults,
        conversationHistory
      );

      // Collect full response for database storage
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      async function* enhancedStream() {
        for await (const chunk of streamGenerator) {
          yield chunk;

          if (chunk.type === 'content' && chunk.content) {
            fullContent += chunk.content;
          }

          if (chunk.type === 'done' && chunk.usage) {
            inputTokens = chunk.usage.inputTokens;
            outputTokens = chunk.usage.outputTokens;

            // Save assistant message and track cost
            const videoReferences = extractVideoReferences(fullContent, searchResults);

            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: fullContent,
              video_references: videoReferences,
              token_count: inputTokens + outputTokens,
              model: process.env['ANTHROPIC_MODEL'] || 'claude-3-5-haiku-20241022',
            });

            // Track cost
            await trackMessageCost(
              creatorId,
              inputTokens,
              outputTokens,
              process.env['ANTHROPIC_MODEL'] || 'claude-3-5-haiku-20241022'
            );

            // Update session timestamp
            await supabase
              .from('chat_sessions')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', sessionId);
          }
        }
      }

      const sseStream = createSSEStream(enhancedStream());
      return createStreamingResponse(sseStream);
    }

    // Non-streaming response
    const response = await generateRAGResponse(
      message,
      searchResults,
      conversationHistory
    );

    // Save assistant message
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: response.content,
      video_references: response.videoReferences || [],
      token_count: response.inputTokens + response.outputTokens,
      model: response.model,
    });

    // Track cost
    await trackMessageCost(
      creatorId,
      response.inputTokens,
      response.outputTokens,
      response.model
    );

    // Cache the response
    await cacheResponse(message, searchResults, response);

    // Update session timestamp
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId);

    return Response.json({
      content: response.content,
      videoReferences: response.videoReferences,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cost: response.cost,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return Response.json(
      {
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat?sessionId=xxx
 * Get chat history for a session
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return Response.json({
      session,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Chat history error:', error);

    return Response.json(
      {
        error: 'Failed to fetch chat history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
