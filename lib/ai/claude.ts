/**
 * Claude API Integration
 *
 * Handles AI chat completion with Claude:
 * - Streaming responses
 * - Token usage tracking
 * - Error handling with retries
 * - Cost calculation
 */

import Anthropic from '@anthropic-ai/sdk';
import { getCurrentModel, calculateCost } from './config';
import type { VectorSearchResult } from '@/lib/video/vector-search';
import { buildPrompt, extractVideoReferences } from './prompts';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'] || '',
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  searchResults?: VectorSearchResult[];
  systemPrompt?: string;
  stream?: boolean;
  maxRetries?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
  videoReferences?: Array<{
    video_id: string;
    video_title: string;
    timestamp: number;
    snippet: string;
  }>;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
}

/**
 * Generate chat completion with Claude
 */
export async function generateChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const {
    messages,
    searchResults = [],
    systemPrompt,
    maxRetries = 3,
    temperature = 0.7,
    maxTokens,
  } = options;

  const model = getCurrentModel();
  const retryDelays = [1000, 2000, 4000]; // Exponential backoff

  let lastError: Error | null = null;

  // Try with retries
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: model.id,
        max_tokens: maxTokens || model.maxTokens,
        temperature,
        system: systemPrompt || buildPrompt('', searchResults).systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      // Extract text content
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('\n');

      // Calculate cost
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cost = calculateCost(inputTokens, outputTokens, model.id);

      // Extract video references from response
      const videoReferences = extractVideoReferences(content, searchResults);

      return {
        content,
        inputTokens,
        outputTokens,
        cost,
        model: model.id,
        videoReferences,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(
        `Claude API error (attempt ${attempt + 1}/${maxRetries}):`,
        lastError.message
      );

      // Don't retry on certain errors
      if (
        lastError.message.includes('invalid_api_key') ||
        lastError.message.includes('permission_denied')
      ) {
        throw lastError;
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Generate streaming chat completion
 */
export async function* generateStreamingCompletion(
  options: ChatCompletionOptions
): AsyncGenerator<StreamChunk> {
  const {
    messages,
    searchResults = [],
    systemPrompt,
    temperature = 0.7,
    maxTokens,
  } = options;

  const model = getCurrentModel();

  try {
    const stream = await anthropic.messages.stream({
      model: model.id,
      max_tokens: maxTokens || model.maxTokens,
      temperature,
      system: systemPrompt || buildPrompt('', searchResults).systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Stream content chunks
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield {
            type: 'content',
            content: event.delta.text,
          };
        }
      }
    }

    // Get final message with usage stats
    const finalMessage = await stream.finalMessage();
    const inputTokens = finalMessage.usage.input_tokens;
    const outputTokens = finalMessage.usage.output_tokens;

    yield {
      type: 'done',
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Claude streaming error:', errorMessage);

    yield {
      type: 'error',
      error: errorMessage,
    };
  }
}

/**
 * Generate chat response with RAG context
 */
export async function generateRAGResponse(
  query: string,
  searchResults: VectorSearchResult[],
  conversationHistory: ChatMessage[] = [],
  options: Partial<ChatCompletionOptions> = {}
): Promise<ChatCompletionResult> {
  // Build prompt with context
  const { systemPrompt, userPrompt } = buildPrompt(query, searchResults);

  // Combine history with new query
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];

  return generateChatCompletion({
    messages,
    searchResults,
    systemPrompt,
    ...options,
  });
}

/**
 * Generate streaming RAG response
 */
export async function* generateStreamingRAGResponse(
  query: string,
  searchResults: VectorSearchResult[],
  conversationHistory: ChatMessage[] = [],
  options: Partial<ChatCompletionOptions> = {}
): AsyncGenerator<StreamChunk> {
  // Build prompt with context
  const { systemPrompt, userPrompt } = buildPrompt(query, searchResults);

  // Combine history with new query
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];

  yield* generateStreamingCompletion({
    messages,
    searchResults,
    systemPrompt,
    stream: true,
    ...options,
  });
}

/**
 * Test Claude API connection
 */
export async function testClaudeAPI(): Promise<{
  success: boolean;
  model: string;
  cost: number;
  error?: string;
}> {
  try {
    const result = await generateChatCompletion({
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Chronos!" and nothing else.',
        },
      ],
      maxTokens: 50,
    });

    return {
      success: true,
      model: result.model,
      cost: result.cost,
    };
  } catch (error) {
    return {
      success: false,
      model: getCurrentModel().id,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate API key
 */
export function validateAPIKey(): boolean {
  const apiKey = process.env['ANTHROPIC_API_KEY'];

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return false;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    console.error('Invalid Anthropic API key format');
    return false;
  }

  return true;
}

/**
 * Get current model info
 */
export function getModelInfo() {
  return getCurrentModel();
}
