# Chat Session Management & Analytics

Comprehensive session management, analytics, and cost tracking for Chronos AI chat.

## Quick Start

### Create and Manage Sessions

```typescript
import { getOrCreateSession, generateAndSetTitle } from '@/lib/rag';

// Get or create session (auto-creates if none exists or last is >24h old)
const session = await getOrCreateSession(
  studentId,
  creatorId,
  [videoId1, videoId2] // Optional video context
);

// Generate title after first message
const title = await generateAndSetTitle(
  session.id,
  'How do I implement authentication?'
);
// Returns: "Questions about authentication"
```

### Store Messages

```typescript
import { createMessage } from '@/lib/rag';

// Store user message
await createMessage({
  session_id: sessionId,
  role: 'user',
  content: 'How do I set up OAuth?',
  token_count: 150,
});

// Store assistant response with video references
await createMessage({
  session_id: sessionId,
  role: 'assistant',
  content: 'Here are the steps...',
  token_count: 850,
  model: 'claude-3-5-haiku-20241022',
  video_references: [
    {
      video_id: 'uuid',
      video_title: 'OAuth Setup Tutorial',
      timestamp: 120,
      chunk_text: 'First, configure your OAuth provider...',
      similarity: 0.92,
    },
  ],
});
```

### Get Analytics

```typescript
import { getSessionAnalytics, getCreatorChatAnalytics } from '@/lib/rag';

// Session-level analytics
const stats = await getSessionAnalytics(sessionId);
// {
//   duration_minutes: 15.5,
//   message_count: 12,
//   total_cost: 0.0425,
//   most_referenced_videos: [...]
// }

// Creator-level analytics
const creatorStats = await getCreatorChatAnalytics(creatorId, 'month');
// {
//   total_sessions: 145,
//   total_messages: 2340,
//   total_cost: 15.67,
//   common_topics: [{ keyword: 'authentication', count: 89 }],
//   peak_usage_hours: [...]
// }
```

### Calculate Costs

```typescript
import {
  calculateCompleteCost,
  getCostOptimizationSuggestions,
  formatCost,
} from '@/lib/rag';

const cost = calculateCompleteCost({
  input_tokens: 500,
  output_tokens: 800,
  embedding_queries: 1,
});
console.log(formatCost(cost.total_cost)); // "$0.0065"

const suggestions = getCostOptimizationSuggestions(cost, 100);
```

## API Routes

### Sessions API

```bash
# List sessions
GET /api/chat/sessions?student_id=xxx&limit=20

# Create session
POST /api/chat/sessions
{
  "student_id": "uuid",
  "creator_id": "uuid"
}

# Update session
PATCH /api/chat/sessions?id=xxx
{ "title": "New Title" }

# Archive session
DELETE /api/chat/sessions?id=xxx
```

### Session Details

```bash
# Get session with messages
GET /api/chat/sessions/[id]?messages=true

# Get session analytics
GET /api/chat/sessions/[id]?analytics=true
```

### Analytics

```bash
# Get creator analytics
GET /api/chat/analytics?creator_id=xxx&period=month&usage=true&cost_projection=true
```

### Export

```bash
# Export as JSON
GET /api/chat/export/[id]?format=json

# Export as Markdown
GET /api/chat/export/[id]?format=markdown
```

## Features

### Session Management
- Auto-create sessions on first message
- Lazy title generation from first message
- Session search and filtering
- Soft delete (archive)
- Video context tracking

### Message Persistence
- Store all messages with video references
- Thread management
- Message editing/deletion
- Export as JSON or Markdown

### Analytics
- Messages per student/video
- Most referenced videos
- Common topics (keyword extraction)
- Session duration calculation
- Engagement metrics
- Peak usage hours

### Cost Tracking
- Claude API costs (input + output tokens)
- OpenAI embedding costs
- Per-chat, per-student aggregation
- Monthly cost projections
- Optimization suggestions

## Pricing (January 2025)

**Claude 3.5 Haiku**
- Input: $1 per 1M tokens
- Output: $5 per 1M tokens

**Claude 3.5 Sonnet**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**OpenAI Embeddings**
- text-embedding-3-small: $0.02 per 1M tokens

## Files

```
lib/rag/
├── types.ts              # TypeScript types
├── sessions.ts           # Session CRUD
├── messages.ts           # Message management
├── analytics.ts          # Analytics
├── cost-calculator.ts    # Cost tracking
├── title-generator.ts    # AI title generation
└── index.ts             # Exports
```

## Best Practices

1. Use `getOrCreateSession()` for automatic session handling
2. Generate titles after first message
3. Store token counts for accurate cost tracking
4. Include video references for analytics
5. Archive old sessions instead of deleting
6. Monitor costs weekly
7. Review optimization suggestions monthly
