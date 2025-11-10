# Chunking & Embedding Engine

Complete documentation for the transcript chunking and vector embedding system in Chronos.

## Overview

The chunking and embedding engine transforms video transcripts into searchable vector embeddings for RAG (Retrieval Augmented Generation) chat. This enables semantic search across video content with timestamp citations.

## Architecture

```
Video Transcript
    ↓
┌─────────────────┐
│ 1. Chunking     │  Split into 500-1000 word segments
│    (chunking.ts)│  with 100-word overlap
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. Embedding    │  Generate 1536-dim vectors
│ (embeddings.ts) │  using OpenAI ada-002
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. Storage      │  Store in video_chunks table
│  (Supabase)     │  with pgvector index
└────────┬────────┘
         ↓
┌─────────────────┐
│ 4. Search       │  Cosine similarity search
│ (vector-search) │  for RAG context
└─────────────────┘
```

## Components

### 1. Chunking Algorithm (`lib/video/chunking.ts`)

**Purpose:** Split transcripts into optimal-sized chunks for embedding while preserving semantic coherence.

**Features:**
- Configurable word count range (default: 500-1000 words)
- Overlapping chunks for context continuity (default: 100 words)
- Sentence boundary preservation
- Timestamp metadata retention
- Validation and quality checks

**Usage:**

```typescript
import { chunkTranscript, getChunkingStats } from '@/lib/video';

// From transcript segments (with timestamps)
const chunks = chunkTranscript(transcriptSegments, {
  min_words: 500,
  max_words: 1000,
  overlap_words: 100,
  preserve_sentences: true,
});

// Get statistics
const stats = getChunkingStats(chunks);
console.log(`Created ${stats.total_chunks} chunks, avg ${stats.avg_words_per_chunk} words each`);
```

**Output Format:**

```typescript
interface TranscriptChunk {
  chunk_index: number;          // 0-based index
  chunk_text: string;           // The actual text content
  start_time_seconds: number;   // Video timestamp start
  end_time_seconds: number;     // Video timestamp end
  word_count: number;           // Number of words in chunk
  metadata: {
    has_overlap: boolean;       // Whether chunk includes overlap
    overlap_word_count?: number;// Words from previous chunk
    original_segment_count: number; // Number of transcript segments
  };
}
```

### 2. Embedding Generation (`lib/video/embeddings.ts`)

**Purpose:** Generate vector embeddings for text chunks using OpenAI's API.

**Features:**
- Batch processing (20 chunks per batch)
- Automatic retry with exponential backoff
- Rate limiting to avoid API throttling
- Cost tracking and estimation
- Embedding validation (1536 dimensions)

**Usage:**

```typescript
import { generateEmbeddings, estimateEmbeddingCost } from '@/lib/video';

// Estimate cost before processing
const estimate = estimateEmbeddingCost(totalTextLength);
console.log(`Estimated cost: $${estimate.estimated_cost_usd}`);

// Generate embeddings
const result = await generateEmbeddings(chunks, {
  batch_size: 20,
  max_retries: 3,
  retry_delay_ms: 1000,
  model: 'text-embedding-ada-002', // 1536 dimensions
});

console.log(`Generated ${result.embeddings.length} embeddings`);
console.log(`Total cost: $${result.total_cost_usd.toFixed(4)}`);
console.log(`Processing time: ${result.processing_time_ms}ms`);
```

**Cost Calculation:**
- Model: `text-embedding-ada-002`
- Pricing: $0.0001 per 1K tokens
- Average: ~4 characters per token
- Example: 10,000 words ≈ 12,500 tokens ≈ $0.00125

### 3. Vector Search (`lib/video/vector-search.ts`)

**Purpose:** Search video chunks using semantic similarity for RAG context.

**Features:**
- Cosine similarity search via pgvector
- Configurable similarity threshold
- Video ID filtering
- Automatic video metadata enrichment
- RAG context building utilities

**Usage:**

```typescript
import { searchVideoChunks, buildRAGContext } from '@/lib/video';

// Search across all videos
const results = await searchVideoChunks('How does routing work?', {
  match_count: 5,
  similarity_threshold: 0.7,
  include_video_metadata: true,
});

// Build context for Claude API
const context = buildRAGContext(results, 5);

// Search within specific video
const videoResults = await searchWithinVideo(
  videoId,
  'authentication',
  { match_count: 3 }
);
```

**Search Result Format:**

```typescript
interface VectorSearchResult {
  chunk_id: string;
  video_id: string;
  video_title?: string;
  chunk_text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  similarity: number; // 0-1, higher = more similar
  metadata?: {
    video_url?: string;
    video_thumbnail?: string;
    creator_id?: string;
  };
}
```

### 4. Inngest Background Job (`inngest/generate-embeddings.ts`)

**Purpose:** Process embeddings asynchronously when transcription completes.

**Pipeline:**
1. Validate video and transcript exist
2. Update status to "processing"
3. Chunk transcript into segments
4. Store chunks in database (without embeddings)
5. Update status to "embedding"
6. Generate embeddings in batches
7. Update chunks with embedding vectors
8. Track costs in usage_metrics
9. Update status to "completed"

**Event Trigger:**

```typescript
// Triggered when transcription completes
await inngest.send({
  name: 'video/transcription.completed',
  data: {
    video_id: videoId,
    creator_id: creatorId,
    transcript: transcriptData,
  },
});
```

**Error Handling:**
- Automatic retries (max 2)
- Failed state updates with error details
- Retry count tracking
- Cost tracking even on failure

## Database Schema

### video_chunks Table

```sql
CREATE TABLE video_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- pgvector extension
  start_time_seconds NUMERIC(10,2) NOT NULL,
  end_time_seconds NUMERIC(10,2) NOT NULL,
  word_count INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_video_chunk UNIQUE (video_id, chunk_index)
);

-- Vector similarity search index
CREATE INDEX video_chunks_embedding_idx
  ON video_chunks
  USING ivfflat (embedding vector_cosine_ops);

-- Fast chunk lookup by video
CREATE INDEX video_chunks_video_id_idx
  ON video_chunks (video_id);
```

### search_video_chunks Function

```sql
CREATE OR REPLACE FUNCTION search_video_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.7,
  filter_video_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  video_id UUID,
  chunk_text TEXT,
  start_time_seconds NUMERIC,
  end_time_seconds NUMERIC,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id AS chunk_id,
    video_id,
    chunk_text,
    start_time_seconds,
    end_time_seconds,
    1 - (embedding <=> query_embedding) AS similarity
  FROM video_chunks
  WHERE
    embedding IS NOT NULL
    AND (
      filter_video_ids IS NULL
      OR video_id = ANY(filter_video_ids)
    )
    AND 1 - (embedding <=> query_embedding) > similarity_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## Performance Optimization

### Chunking
- **Sentence Splitting:** Smart regex that handles abbreviations (Dr., Mr., etc.)
- **Word Counting:** Simple whitespace split for speed
- **Overlap Calculation:** Efficient slicing from end of previous chunk

### Embedding Generation
- **Batch Processing:** 20 chunks per API call (reduces latency)
- **Parallel Batches:** Process multiple batches concurrently
- **Rate Limiting:** Configurable requests/minute (default: 60)
- **Retry Logic:** Exponential backoff (1s, 2s, 4s, etc.)

### Vector Search
- **pgvector Index:** IVFFlat for fast approximate nearest neighbor
- **Similarity Threshold:** Pre-filter before sorting (default: 0.7)
- **Result Limit:** Only fetch top-k matches (default: 5)

## Cost Management

### Embedding Costs
- **text-embedding-ada-002:** $0.0001 per 1K tokens
- **Average Video (30 min):** ~7,500 words = ~10K tokens = $0.001
- **10 Videos/Day:** ~$0.01/day = $0.30/month

### Storage Costs
- **Vector Size:** 1536 dimensions × 4 bytes = 6 KB per embedding
- **100 Chunks/Video:** ~600 KB per video
- **1000 Videos:** ~600 MB total

### Rate Limits
- **OpenAI Tier 1:** 3,000 RPM (requests per minute)
- **Conservative Default:** 60 RPM (safe for all tiers)
- **Adjust via:** `requests_per_minute` parameter

## Testing

### Unit Tests

```bash
# Run chunking and embedding tests
npm run test scripts/test/test-chunking-embeddings.ts
```

### Test Coverage
1. ✅ Chunking with various word count configurations
2. ✅ Sentence boundary preservation
3. ✅ Overlap calculation accuracy
4. ✅ Chunk validation and warnings
5. ✅ Embedding generation (requires OPENAI_API_KEY)
6. ✅ Embedding dimension validation
7. ✅ Cost estimation accuracy
8. ✅ RAG context building

### Manual Testing

```typescript
// Test chunking
const chunks = chunkTranscript(transcript, {
  min_words: 500,
  max_words: 1000,
  overlap_words: 100,
});

console.log(getChunkingStats(chunks));

// Test embeddings (requires API key)
const result = await generateEmbeddings(chunks);
console.log(`Cost: $${result.total_cost_usd.toFixed(4)}`);

// Test search
const results = await testVectorSearch('test query');
console.log(`Found ${results.results_count} matches`);
```

## Integration with RAG Chat

### Building Context for Claude

```typescript
import { searchVideoChunks, buildRAGContext } from '@/lib/video';

// 1. Get user's question
const userQuestion = "How does Next.js handle API routes?";

// 2. Search for relevant chunks
const results = await searchVideoChunks(userQuestion, {
  match_count: 5,
  similarity_threshold: 0.7,
  filter_video_ids: currentCourseVideoIds, // Optional: limit to current course
});

// 3. Build context for Claude
const context = buildRAGContext(results, 5);

// 4. Send to Claude API
const response = await claude.messages.create({
  model: 'claude-3-5-haiku-20241022',
  messages: [
    {
      role: 'user',
      content: `Using the following video transcript excerpts, answer the question.

${context}

Question: ${userQuestion}

Provide a clear answer and cite the video timestamps where relevant information was found.`,
    },
  ],
});
```

### Citation Format

The system automatically formats citations with clickable timestamps:

```
[Next.js Fundamentals @ 1:35] Next.js allows you to create API endpoints...
[Advanced Routing @ 3:22] API routes are server-side only and never bundled...
```

## Troubleshooting

### Common Issues

**1. Chunks too small/large**
```typescript
// Adjust word count ranges
chunkTranscript(transcript, {
  min_words: 300,  // Smaller minimum
  max_words: 1500, // Larger maximum
});
```

**2. Poor search results**
```typescript
// Lower similarity threshold
searchVideoChunks(query, {
  similarity_threshold: 0.5, // From 0.7
  match_count: 10,           // Get more results
});
```

**3. OpenAI rate limits**
```typescript
// Reduce batch size and add rate limiting
batchEmbeddingsWithRateLimit(chunks, {
  batch_size: 10,              // From 20
  requests_per_minute: 30,     // From 60
});
```

**4. Embedding validation fails**
- Check OpenAI API key is valid
- Verify model is 'text-embedding-ada-002'
- Ensure vectors are 1536 dimensions

## Future Enhancements

### Short Term
- [ ] Streaming embeddings for faster UX
- [ ] Chunk caching to avoid reprocessing
- [ ] Better sentence boundary detection
- [ ] Support for multiple languages

### Long Term
- [ ] Hybrid search (vector + keyword)
- [ ] Chunk importance scoring
- [ ] Adaptive chunk sizing based on content
- [ ] Multi-modal embeddings (text + images)

## References

- **OpenAI Embeddings Guide:** https://platform.openai.com/docs/guides/embeddings
- **pgvector Documentation:** https://github.com/pgvector/pgvector
- **Supabase Vector Guide:** https://supabase.com/docs/guides/ai/vector-embeddings
- **RAG Best Practices:** https://docs.anthropic.com/claude/docs/retrieval-augmented-generation

## Support

For issues or questions:
1. Check the test script: `scripts/test/test-chunking-embeddings.ts`
2. Review error logs in Inngest dashboard
3. Verify database indexes are created
4. Check OpenAI API usage and limits
