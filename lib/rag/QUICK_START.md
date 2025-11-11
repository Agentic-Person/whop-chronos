# RAG Engine - Quick Start Guide

## 5-Minute Integration

### 1. Basic RAG Flow

```typescript
import { enhancedSearch, buildContext, buildSystemPrompt } from '@/lib/rag';
import Anthropic from '@anthropic-ai/sdk';

async function answerQuestion(question: string, studentId: string) {
  // Step 1: Search for relevant video content
  const results = await enhancedSearch(question, {
    match_count: 5,
    similarity_threshold: 0.7,
    boost_viewed_by_student: studentId,
  });

  // Step 2: Build context for Claude
  const context = buildContext(results, {
    max_tokens: 8000,
    format: 'markdown',
  });

  // Step 3: Create system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Step 4: Call Claude API
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  });

  return {
    answer: response.content[0].text,
    sources: context.sources,
  };
}
```

### 2. Search Within a Course

```typescript
import { searchWithinCourse } from '@/lib/rag';

const results = await searchWithinCourse(
  courseId,
  'How do I deploy to production?',
  { match_count: 3 }
);
```

### 3. Extract Citations for UI

```typescript
import { extractCitations } from '@/lib/rag';

const citations = extractCitations(results);

// Returns:
// [
//   {
//     video_id: 'uuid',
//     video_title: 'Deployment Guide',
//     video_url: 'https://...',
//     timestamp: 120,
//     timestamp_formatted: '2:00',
//     chunk_text: 'To deploy...',
//     relevance_score: 0.92
//   }
// ]
```

## Common Patterns

### Personalized Search

```typescript
// Boost videos the student recently viewed
const results = await enhancedSearch(query, {
  boost_viewed_by_student: studentId,
  boost_recent_videos: true,
  boost_popular_videos: true,
});
```

### High-Quality Results Only

```typescript
import { filterByRankScore } from '@/lib/rag';

const results = await enhancedSearch(query);
const highQuality = filterByRankScore(results, 0.8); // Only >0.8 score
```

### Diverse Results

```typescript
import { ensureResultDiversity } from '@/lib/rag';

const results = await enhancedSearch(query, { match_count: 10 });
const diverse = ensureResultDiversity(results, 2); // Max 2 per video
```

### Multi-Turn Conversation

```typescript
import { buildConversationPrompt } from '@/lib/rag';

const conversationContext = {
  messages: [
    { role: 'user', content: 'What is TypeScript?' },
    { role: 'assistant', content: 'TypeScript is...' },
  ],
  newContext: context,
};

const prompt = buildConversationPrompt(conversationContext, 5);
```

### Custom Context Format

```typescript
const context = buildContext(results, {
  format: 'xml',              // markdown | xml | plain
  max_tokens: 4000,           // Smaller context
  include_timestamps: true,
  deduplicate_content: true,  // Remove redundancy
});
```

## Performance Tips

### 1. Cache Wisely

```typescript
// Enable caching (default: true)
const results = await enhancedSearch(query, {
  enable_cache: true,
  cache_ttl_seconds: 300, // 5 minutes
});

// Invalidate on video update
import { invalidateCacheForVideo } from '@/lib/rag';
await invalidateCacheForVideo(videoId);
```

### 2. Optimize for Speed

```typescript
// Quick answers (less context)
const context = buildContext(results, {
  max_tokens: 4000,
  format: 'plain',
  include_timestamps: false,
});
```

### 3. Optimize for Quality

```typescript
// Detailed explanations (more context)
const context = buildContext(results, {
  max_tokens: 12000,
  format: 'markdown',
  deduplicate_content: false,
});
```

## Monitoring

### Search Metrics

```typescript
import { getSearchMetrics } from '@/lib/rag';

const metrics = await getSearchMetrics();
console.log(`Cache hit rate: ${(metrics.cache_hit_rate * 100).toFixed(1)}%`);
```

### Context Stats

```typescript
import { getContextStats } from '@/lib/rag';

const stats = getContextStats(context);
console.log(`Token utilization: ${stats.token_utilization.toFixed(1)}%`);
console.log(`Unique videos: ${stats.unique_videos}`);
```

## Testing

### Run Tests

```bash
# Unit tests
npm test lib/rag/__tests__/search.test.ts

# Performance benchmark
npx tsx lib/rag/__tests__/benchmark.ts

# Setup verification
npx tsx lib/rag/verify-setup.ts
```

### Expected Performance

- Search: <2 seconds
- Context build: <100ms
- Cache hit rate: >60%
- Result quality: >0.7 similarity

## Troubleshooting

### No Results

```typescript
// Lower threshold
const results = await enhancedSearch(query, {
  similarity_threshold: 0.6, // Lower = more results
});
```

### Slow Performance

```typescript
// Check cache
const metrics = await getSearchMetrics();
if (metrics.cache_hit_rate < 0.5) {
  // Consider increasing cache TTL
}
```

### Poor Quality

```typescript
// Higher threshold + more results
const results = await enhancedSearch(query, {
  match_count: 10,
  similarity_threshold: 0.8,
});

// Then filter
const topResults = results.slice(0, 5);
```

## Environment Variables

```bash
# Required for RAG engine
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=           # For query embeddings
ANTHROPIC_API_KEY=        # For Claude API
VERCEL_KV_URL=           # For caching
```

## API Reference

See [README.md](./README.md) for complete documentation.

## Need Help?

1. Check [README.md](./README.md) for detailed docs
2. Run `npx tsx lib/rag/verify-setup.ts` for diagnostics
3. Review [AGENT_1_REPORT.md](./AGENT_1_REPORT.md) for architecture
