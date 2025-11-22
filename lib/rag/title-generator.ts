/**
 * Session Title Generator
 *
 * Uses Claude to generate concise session titles from first message
 * Fallback to date-based titles if generation fails
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client lazily to ensure env vars are available
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      console.warn('[Title Generator] ANTHROPIC_API_KEY not set, title generation will use fallback');
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// Cache for generated titles to avoid regeneration
const titleCache = new Map<string, string>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface CachedTitle {
  title: string;
  timestamp: number;
}

/**
 * Generate a concise session title from the first user message
 * Format: "Questions about Next.js routing" or "Video upload troubleshooting"
 */
export async function generateSessionTitle(
  firstMessage: string,
): Promise<string> {
  // Check cache first
  const cached = titleCache.get(firstMessage);
  if (cached) {
    const cachedData = JSON.parse(cached) as CachedTitle;
    if (Date.now() - cachedData.timestamp < CACHE_TTL) {
      return cachedData.title;
    }
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Generate a concise, descriptive title (3-6 words) for a chat session that starts with this message. Return ONLY the title, no quotes or extra text.

Message: "${firstMessage.slice(0, 500)}"

Examples:
- "Questions about Next.js routing"
- "Video upload troubleshooting"
- "RAG implementation help"
- "Database schema design"`,
        },
      ],
    });

    const title =
      response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : getFallbackTitle();

    // Remove quotes if present
    const cleanTitle = title.replace(/^["']|["']$/g, '');

    // Validate title length
    if (cleanTitle.length < 3 || cleanTitle.length > 100) {
      return getFallbackTitle();
    }

    // Cache the result
    titleCache.set(
      firstMessage,
      JSON.stringify({
        title: cleanTitle,
        timestamp: Date.now(),
      }),
    );

    return cleanTitle;
  } catch (error) {
    console.error('Failed to generate session title:', error);
    return getFallbackTitle();
  }
}

/**
 * Generate fallback title with current date
 */
function getFallbackTitle(): string {
  const date = new Date();
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Chat from ${formatted}`;
}

/**
 * Clear title cache (useful for testing)
 */
export function clearTitleCache(): void {
  titleCache.clear();
}

/**
 * Get cache statistics
 */
export function getTitleCacheStats(): {
  size: number;
  entries: Array<{ message: string; title: string; age_ms: number }>;
} {
  const entries = Array.from(titleCache.entries()).map(([message, cached]) => {
    const data = JSON.parse(cached) as CachedTitle;
    return {
      message: message.slice(0, 50) + '...',
      title: data.title,
      age_ms: Date.now() - data.timestamp,
    };
  });

  return {
    size: titleCache.size,
    entries,
  };
}
