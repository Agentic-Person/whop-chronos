# AI Chat System - Claude Integration

Complete AI chat completion system for Chronos with RAG (Retrieval-Augmented Generation), streaming support, cost tracking, and caching.

## Overview

This module provides:
- **Claude API Integration** - Chat completions with Claude 3.5 Haiku/Sonnet/Opus
- **Streaming Responses** - Server-Sent Events (SSE) for real-time chat
- **RAG (Retrieval-Augmented Generation)** - Semantic search + AI responses
- **Cost Tracking** - Per-message and monthly usage tracking
- **Rate Limiting** - Tier-based limits (Basic/Pro/Enterprise)
- **Response Caching** - Redis caching for common questions
- **Educational Prompts** - Specialized prompts for teaching

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat API Route                           │
│                  /app/api/chat/route.ts                      │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Rate Limit      Vector Search     Session
   (Upstash)     (pgvector + RAG)   Validation
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │  Cache  │ (Check Redis)
                    └────┬────┘
                         │
                    Cache Miss
                         │
                         ▼
                ┌────────────────┐
                │  Claude API    │
                │  (Streaming)   │
                └────────┬───────┘
                         │
                ┌────────┼────────┐
                │        │        │
                ▼        ▼        ▼
           Database   Cache    Cost
           Storage   Update  Tracking
```

## Files

### Core Integration
- **`claude.ts`** - Claude API client with streaming support
- **`config.ts`** - Model configuration and pricing
- **`prompts.ts`** - Educational assistant prompts and templates
- **`streaming.ts`** - SSE utilities for real-time responses
- **`cache.ts`** - Redis caching for common questions
- **`cost-tracker.ts`** - Usage tracking and cost calculation
- **`rate-limit.ts`** - Tier-based rate limiting with Upstash

### API Routes
- **`/app/api/chat/route.ts`** - Main chat endpoint (POST + GET)

## Usage

### 1. Send a Chat Message

```typescript
// POST /api/chat
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How do I get started with trading?',
    sessionId: 'session-uuid',
    stream: true, // Enable streaming
    videoIds: ['video-1', 'video-2'], // Optional: restrict search
  }),
});

// Streaming response
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const events = parseSSE(chunk);

  for (const { event, data } of events) {
    if (event === 'content') {
      console.log('Content:', data.content);
    } else if (event === 'done') {
      console.log('Usage:', data.usage);
    }
  }
}
```

### 2. Get Chat History

```typescript
// GET /api/chat?sessionId=xxx
const response = await fetch('/api/chat?sessionId=session-uuid');
const { session, messages } = await response.json();
```

### 3. Direct API Usage

```typescript
import {
  generateRAGResponse,
  generateStreamingRAGResponse,
} from '@/lib/ai';
import { searchVideoChunks } from '@/lib/video/vector-search';

// Non-streaming
const searchResults = await searchVideoChunks('trading basics');
const response = await generateRAGResponse(
  'How do I start trading?',
  searchResults,
  conversationHistory
);

console.log(response.content);
console.log('Cost:', response.cost);
console.log('Video refs:', response.videoReferences);

// Streaming
const stream = generateStreamingRAGResponse(
  'Explain options trading',
  searchResults,
  conversationHistory
);

for await (const chunk of stream) {
  if (chunk.type === 'content') {
    console.log(chunk.content);
  }
}
```

## Configuration

### Environment Variables

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022  # Default model

# Cache (Vercel KV / Upstash Redis)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Model Selection

Switch models by changing `ANTHROPIC_MODEL`:

```bash
# Fastest, cheapest (default)
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Balanced performance
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Most intelligent
ANTHROPIC_MODEL=claude-3-opus-20240229
```

## Cost Tracking

### Track Costs Per Message

```typescript
import { trackMessageCost } from '@/lib/ai';

await trackMessageCost(
  creatorId,
  inputTokens,
  outputTokens,
  'claude-3-5-haiku-20241022'
);
```

### Get Monthly Usage

```typescript
import { getMonthlyUsage, checkTierLimits } from '@/lib/ai';

// Get usage
const usage = await getMonthlyUsage(creatorId);
console.log('Messages:', usage.total_messages);
console.log('Cost:', usage.total_cost_usd);

// Check limits
const check = await checkTierLimits(creatorId, 'pro');
if (!check.withinLimits) {
  console.log('Limit exceeded!');
  console.log('Warning level:', check.warningLevel);
}
```

### Tier Limits

```typescript
{
  basic: {
    monthly_messages: 1000,
    monthly_cost_limit: 10.0, // $10/month
  },
  pro: {
    monthly_messages: 5000,
    monthly_cost_limit: 50.0, // $50/month
  },
  enterprise: {
    monthly_messages: -1, // Unlimited
    monthly_cost_limit: -1,
  },
}
```

## Rate Limiting

### Check Rate Limits

```typescript
import { checkRateLimit, formatRateLimitError } from '@/lib/ai';

const check = await checkRateLimit(studentId, creatorId, 'pro');

if (!check.allowed) {
  console.error(formatRateLimitError(check));
  console.log('Limited by:', check.limitedBy); // 'student' or 'creator'
  console.log('Retry after:', check.student.retryAfter, 'seconds');
}
```

### Rate Limit Tiers

- **Student limits:**
  - 10 requests/minute
  - 100 requests/hour

- **Creator limits:**
  - Basic: 500 requests/day
  - Pro: 2000 requests/day
  - Enterprise: 10,000 requests/day

## Caching

### Cache Configuration

- **TTL:** 7 days
- **Key:** Hash of (query + video context)
- **Store:** Vercel KV (Redis)
- **Invalidation:** On new video uploads

### Cache Operations

```typescript
import {
  getCachedResponse,
  cacheResponse,
  invalidateVideoCache,
  getCacheStats,
} from '@/lib/ai';

// Check cache
const cached = await getCachedResponse(query, searchResults);
if (cached) {
  console.log('Cache hit!');
  return cached.content;
}

// Cache response
await cacheResponse(query, searchResults, response);

// Invalidate
await invalidateVideoCache(videoId);

// Stats
const stats = await getCacheStats();
console.log('Hit rate:', stats.hitRate);
console.log('Total saved:', stats.totalSaved);
```

## Prompts

### System Prompt

Educational assistant persona with citation formatting:

```typescript
import { getSystemPrompt, buildPrompt } from '@/lib/ai';

const systemPrompt = getSystemPrompt({
  studentName: 'Alex',
  courseTitle: 'Trading Fundamentals',
});

// Full prompt with context
const { systemPrompt, userPrompt } = buildPrompt(
  'How do I read candlestick charts?',
  searchResults,
  { studentName: 'Alex' }
);
```

### Citation Format

Responses automatically cite sources:

```
As explained in [Introduction to Trading @ 3:45], candlestick
charts show price movement over time...
```

### Specialized Prompts

```typescript
import {
  getQuizGenerationPrompt,
  getConceptExplanationPrompt,
  getTimestampQuestionPrompt,
} from '@/lib/ai';

// Generate quiz questions
const quizPrompt = getQuizGenerationPrompt(videoChunks, 5, 'medium');

// Explain a concept
const explanationPrompt = getConceptExplanationPrompt(
  'support and resistance',
  searchResults
);

// Answer timestamp-specific question
const timestampPrompt = getTimestampQuestionPrompt(
  'Trading Basics',
  180,
  chunkText,
  'What does this indicator mean?'
);
```

## Streaming

### Server-Side Streaming

```typescript
import {
  generateStreamingRAGResponse,
  createSSEStream,
  createStreamingResponse,
} from '@/lib/ai';

// Generate stream
const generator = generateStreamingRAGResponse(query, searchResults);

// Convert to SSE
const sseStream = createSSEStream(generator);

// Return as response
return createStreamingResponse(sseStream);
```

### Client-Side Parsing

```typescript
import { SSEParser } from '@/lib/ai';

const parser = new SSEParser();
const response = await fetch('/api/chat', { ... });
const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const events = parser.parse(chunk);

  for (const { event, data } of events) {
    switch (event) {
      case 'content':
        appendContent(data.content);
        break;
      case 'done':
        console.log('Done!', data.usage);
        break;
      case 'error':
        console.error(data.error);
        break;
    }
  }
}
```

## Testing

### Test Claude API Connection

```typescript
import { testClaudeAPI, validateAPIKey } from '@/lib/ai';

// Validate API key
if (!validateAPIKey()) {
  console.error('Invalid API key');
}

// Test connection
const result = await testClaudeAPI();
console.log('Success:', result.success);
console.log('Model:', result.model);
console.log('Cost:', result.cost);
```

## Error Handling

### Common Errors

```typescript
try {
  const response = await generateRAGResponse(...);
} catch (error) {
  if (error.message.includes('invalid_api_key')) {
    // API key is invalid
  } else if (error.message.includes('rate_limit')) {
    // Rate limit exceeded
  } else if (error.message.includes('timeout')) {
    // Request timed out
  } else {
    // Other error
  }
}
```

### Retry Logic

Built-in retry with exponential backoff (3 attempts):
- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay

## Best Practices

### 1. Use Streaming for Real-Time UX

```typescript
// ✅ Good - Streaming for better UX
const stream = generateStreamingRAGResponse(query, searchResults);

// ❌ Avoid - Blocking for long responses
const response = await generateRAGResponse(query, searchResults);
```

### 2. Cache Common Questions

```typescript
// Check cache first
const cached = await getCachedResponse(query, searchResults);
if (cached) return cached;

// Generate and cache
const response = await generateRAGResponse(query, searchResults);
await cacheResponse(query, searchResults, response);
```

### 3. Track Costs

```typescript
// Always track costs after generating responses
await trackMessageCost(creatorId, inputTokens, outputTokens, model);

// Monitor usage
const usage = await getMonthlyUsage(creatorId);
if (usage.total_cost_usd > 40) {
  console.warn('Approaching limit!');
}
```

### 4. Handle Rate Limits Gracefully

```typescript
const check = await checkRateLimit(studentId, creatorId, tier);

if (!check.allowed) {
  return Response.json(
    { error: formatRateLimitError(check) },
    { status: 429 }
  );
}
```

## Pricing

### Claude Model Costs (per 1M tokens)

| Model | Input | Output | Total (10K tokens) |
|-------|-------|--------|-------------------|
| Haiku (default) | $0.25 | $1.25 | ~$0.015 |
| Sonnet | $3.00 | $15.00 | ~$0.18 |
| Opus | $15.00 | $75.00 | ~$0.90 |

**Estimated costs per chat message:**
- Haiku: $0.001 - $0.005
- Sonnet: $0.015 - $0.050
- Opus: $0.050 - $0.150

## Monitoring

### Analytics to Track

```typescript
// Cache performance
const cacheInfo = await getCacheInfo();
console.log('Hit rate:', cacheInfo.stats.hitRate);
console.log('Cached responses:', cacheInfo.cachedResponses);

// Cost trends
const trend = await getCostTrend(creatorId, 30);
console.log('Daily costs:', trend);

// Top spenders
const topSpenders = await getTopSpenders(10);
console.log('Top 10 creators by cost:', topSpenders);
```

## Future Enhancements

- [ ] Quiz generation from video content
- [ ] Follow-up question suggestions
- [ ] Multi-turn conversation summarization
- [ ] Video content summarization
- [ ] Concept relationship mapping
- [ ] Learning progress tracking via chat
- [ ] Personalized learning paths
- [ ] A/B testing different prompts

## Support

For issues or questions:
1. Check error logs in Sentry
2. Review Claude API status: https://status.anthropic.com
3. Check Redis/KV connectivity
4. Verify environment variables
