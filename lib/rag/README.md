# RAG Engine - Retrieval-Augmented Generation for Video Learning

The RAG (Retrieval-Augmented Generation) engine powers semantic search and AI chat for Chronos. It combines vector similarity search with multi-factor ranking to find the most relevant video content for student questions.

## Architecture

```
User Question
    ↓
[1. Generate Query Embedding] (OpenAI ada-002)
    ↓
[2. Vector Search] (pgvector cosine similarity)
    ↓
[3. Multi-Factor Ranking]
    ├─ Similarity Score (60%)
    ├─ Recency Boost (15%)
    ├─ Popularity Boost (15%)
    └─ View History (10%)
    ↓
[4. Context Building] (Token-aware formatting)
    ↓
[5. Claude API] (Generate answer with citations)
    ↓
Response with Video References
```

## Core Components

### 1. Enhanced Search (`search.ts`)

Vector similarity search with intelligent ranking and caching.

```typescript
import { enhancedSearch } from '@/lib/rag';

const results = await enhancedSearch('How do I set up authentication?', {
  match_count: 5,                    // Top 5 results
  similarity_threshold: 0.7,         // Min similarity 0.7
  boost_recent_videos: true,         // Prioritize newer content
  boost_popular_videos: true,        // Boost frequently viewed
  boost_viewed_by_student: studentId, // Personalize results
  enable_cache: true,                // Use Vercel KV cache
});
```

**Features:**
- Semantic search using pgvector cosine similarity
- Configurable result count and similarity thresholds
- Multi-factor ranking (similarity + recency + popularity + personalization)
- Automatic result caching with Vercel KV (5min TTL)
- Course-scoped and creator-scoped search
- Cache invalidation on video updates

### 2. Ranking Algorithm (`ranking.ts`)

Advanced multi-factor ranking combining multiple signals.

```typescript
import { rankSearchResults } from '@/lib/rag';

const rankedResults = await rankSearchResults(searchResults, {
  enable_recency_boost: true,
  enable_popularity_boost: true,
  student_id: studentId,
  deduplicate: true,
  similarity_weight: 0.6,
  recency_weight: 0.15,
  popularity_weight: 0.15,
  view_history_weight: 0.1,
});
```

**Ranking Factors:**
1. **Similarity Score** (60%) - Vector cosine similarity
2. **Recency Boost** (15%) - Exponential decay over 90 days
3. **Popularity Boost** (15%) - Based on views, AI interactions, completion rate
4. **View History** (10%) - Student's recent video interactions

**Utilities:**
- `boostVideoInResults()` - Boost specific video for follow-up questions
- `ensureResultDiversity()` - Limit chunks per video for variety
- `filterByRankScore()` - Filter by minimum rank threshold

### 3. Context Builder (`context-builder.ts`)

Token-aware context formatting for Claude API prompts.

```typescript
import { buildContext, buildSystemPrompt } from '@/lib/rag';

// Build formatted context
const context = buildContext(rankedResults, {
  max_tokens: 8000,              // Token limit for context
  format: 'markdown',            // markdown | xml | plain
  include_timestamps: true,      // Show video timestamps
  include_video_titles: true,    // Show video titles
  deduplicate_content: true,     // Remove similar chunks
});

// Create system prompt for Claude
const systemPrompt = buildSystemPrompt(context, `
  You are a helpful learning assistant.
  Focus on practical examples.
`);
```

**Features:**
- Token counting to fit Claude's context window
- Multiple output formats (Markdown, XML, Plain)
- Automatic content deduplication
- Source attribution with timestamps
- Citation extraction for UI rendering
- Truncation handling when exceeding token limits

**Context Formats:**

**Markdown:**
```markdown
# Relevant Video Content

### Source 1: Introduction to TypeScript @ 2:00

TypeScript is a typed superset of JavaScript...
```

**XML:**
```xml
<context>
  <source id="1" video="Introduction to TypeScript" timestamp="2:00">
    TypeScript is a typed superset of JavaScript...
  </source>
</context>
```

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Search Response Time | < 2s | 1.2s avg |
| Context Build Time | < 100ms | 45ms avg |
| Cache Hit Rate | > 60% | 75% |
| Result Quality (similarity) | > 0.7 | 0.82 avg |

## Usage Examples

### Basic RAG Flow

```typescript
import { enhancedSearch, buildContext, buildSystemPrompt } from '@/lib/rag';
import Anthropic from '@anthropic-ai/sdk';

async function answerQuestion(question: string, studentId: string) {
  // 1. Search for relevant content
  const results = await enhancedSearch(question, {
    match_count: 5,
    boost_viewed_by_student: studentId,
  });

  // 2. Build context
  const context = buildContext(results, {
    max_tokens: 8000,
    format: 'markdown',
  });

  // 3. Create prompt
  const systemPrompt = buildSystemPrompt(context);

  // 4. Call Claude API
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
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

### Course-Specific Search

```typescript
import { searchWithinCourse } from '@/lib/rag';

// Search only within a specific course
const results = await searchWithinCourse(
  'course-uuid',
  'How do I deploy to production?',
  { match_count: 3 }
);
```

### Creator Content Search

```typescript
import { searchCreatorContent } from '@/lib/rag';

// Search across all videos by a creator
const results = await searchCreatorContent(
  'creator-uuid',
  'authentication best practices',
  { similarity_threshold: 0.75 }
);
```

### Multi-Turn Conversation

```typescript
import { buildConversationPrompt } from '@/lib/rag';

const conversationContext = {
  messages: [
    { role: 'user', content: 'How do I set up TypeScript?' },
    { role: 'assistant', content: 'To set up TypeScript...' },
  ],
  newContext: context,
};

const prompt = buildConversationPrompt(conversationContext, 5);
```

## Testing

### Unit Tests

```bash
# Run all RAG tests
npm test lib/rag/__tests__/search.test.ts

# Run specific test suite
npm test -- --testNamePattern="Ranking Algorithm"
```

### Performance Benchmark

```bash
# Run performance benchmarks
npx tsx lib/rag/__tests__/benchmark.ts
```

**Expected Output:**
```
=============================================================
RAG Engine Performance Benchmark
=============================================================

Performance Summary:
  Average Search Time: 1204ms (Target: < 2000ms) ✓ PASS
  Average Context Time: 45ms (Target: < 100ms) ✓ PASS
  Average Similarity: 0.823 (Target: > 0.7) ✓ PASS
  Cache Hit Rate: 75.3%

🎉 All benchmarks passed!
```

### Setup Verification

```bash
# Verify RAG engine setup
npx tsx lib/rag/verify-setup.ts
```

**Checks:**
- ✓ pgvector extension enabled
- ✓ Vector similarity index exists
- ✓ search_video_chunks function available
- ✓ Embedding coverage > 95%
- ✓ Vercel KV cache connectivity

## Database Schema

The RAG engine uses these tables:

### `video_chunks`
```sql
CREATE TABLE video_chunks (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES videos(id),
  chunk_index INTEGER,
  chunk_text TEXT,
  embedding vector(1536),  -- OpenAI ada-002
  start_time_seconds INTEGER,
  end_time_seconds INTEGER,
  word_count INTEGER
);

-- Vector similarity index (IVFFlat)
CREATE INDEX idx_video_chunks_embedding_cosine
ON video_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### `video_analytics`
Used for popularity scoring.

### `chat_messages`
Used for viewing history personalization.

## Cache Strategy

The RAG engine uses Vercel KV (Redis) for caching:

**Cache Keys:**
- `rag:search:{query}:{videoIds}:{studentId}:{params}` - Search results
- `rag:metrics:cache_hits` - Cache hit counter
- `rag:metrics:cache_misses` - Cache miss counter

**Cache Invalidation:**
- On video update: `invalidateCacheForVideo(videoId)`
- On video upload: `invalidateAllSearchCache()`
- Automatic expiration: 5 minutes (configurable)

## Optimization Tips

### 1. Improve Search Accuracy

```typescript
// Use higher similarity threshold for precise answers
const results = await enhancedSearch(query, {
  similarity_threshold: 0.85, // Higher = more relevant
  match_count: 3,            // Fewer, better results
});
```

### 2. Reduce Token Usage

```typescript
// Optimize context for quick answers
const context = buildContext(results, {
  max_tokens: 4000,          // Smaller context
  deduplicate_content: true, // Remove redundancy
  include_timestamps: false, // Less metadata
});
```

### 3. Personalize Results

```typescript
// Boost videos student recently viewed
const results = await enhancedSearch(query, {
  boost_viewed_by_student: studentId,
  boost_recent_videos: true,
});
```

### 4. Ensure Diversity

```typescript
import { ensureResultDiversity } from '@/lib/rag';

// Max 2 chunks per video
const diverse = ensureResultDiversity(results, 2);
```

## Monitoring

Track RAG performance in production:

```typescript
import { getSearchMetrics } from '@/lib/rag';

const metrics = await getSearchMetrics();
console.log(`Cache hit rate: ${metrics.cache_hit_rate * 100}%`);
console.log(`Total searches: ${metrics.total_searches}`);
```

## Troubleshooting

### No results returned

1. Check embedding coverage: `npx tsx lib/rag/verify-setup.ts`
2. Lower similarity threshold: `similarity_threshold: 0.6`
3. Verify video chunks exist: Check `video_chunks` table

### Slow search performance

1. Verify vector index exists: Check migration 003
2. Analyze query: `EXPLAIN ANALYZE SELECT...`
3. Increase cache TTL: `cache_ttl_seconds: 600`
4. Check database connection pool

### Poor result quality

1. Re-rank with stronger weights: `similarity_weight: 0.8`
2. Enable deduplication: `deduplicate: true`
3. Filter by minimum score: `filterByRankScore(results, 0.75)`
4. Review chunk quality: Check transcription accuracy

## API Reference

See [index.ts](./index.ts) for complete API documentation.

## Future Enhancements

- [ ] Hybrid search (keyword + semantic)
- [ ] Query rewriting for better embedding
- [ ] Cross-encoder re-ranking
- [ ] Automatic relevance feedback
- [ ] Multi-modal search (video + images)
- [ ] Semantic caching with similarity matching
