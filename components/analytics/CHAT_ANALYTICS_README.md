# Chat Analytics Dashboard

AI chat analytics components to help Chronos creators understand how students interact with their AI assistant.

## Components

### 1. ChatVolumeChart
**Location:** `components/analytics/ChatVolumeChart.tsx`

Area/Line chart showing chat message volume over time.

**Props:**
- `creatorId: string` - Creator ID to fetch data for
- `timeRange?: TimeRange` - Time range for data (7d, 30d, 90d, all) - default: '30d'

**Features:**
- Dual Y-axis: Message count (left), Response time (right)
- Stacked areas for student messages and AI responses
- Line overlay for average response time
- Summary cards below chart

**Usage:**
```tsx
<ChatVolumeChart creatorId="creator-123" timeRange="30d" />
```

---

### 2. PopularQuestionsTable
**Location:** `components/analytics/PopularQuestionsTable.tsx`

Table showing most frequently asked questions, clustered by similarity.

**Props:**
- `creatorId: string` - Creator ID
- `topN?: number` - Number of top questions to show - default: 20

**Features:**
- Question clustering using Levenshtein distance (70% similarity threshold)
- Expandable variations for each question cluster
- Search/filter functionality
- Export to CSV
- Shows count, avg response time, and referenced videos

**Usage:**
```tsx
<PopularQuestionsTable creatorId="creator-123" topN={20} />
```

---

### 3. ResponseQualityChart
**Location:** `components/analytics/ResponseQualityChart.tsx`

Bar chart showing AI response quality metrics with target benchmarks.

**Props:**
- `creatorId: string` - Creator ID
- `dateRange?: string` - Date range - default: '30d'

**Metrics:**
- Average response length (words) - Target: 150
- Citation rate (%) - Target: 80%
- Follow-up rate (%) - Target: 60%
- Satisfaction score (%) - Target: 85%

**Color Coding:**
- Green: ≥90% of target (Excellent)
- Amber: ≥70% of target (Good)
- Red: <70% of target (Needs Improvement)

**Usage:**
```tsx
<ResponseQualityChart creatorId="creator-123" dateRange="30d" />
```

---

### 4. VideoReferenceHeatmap
**Location:** `components/analytics/VideoReferenceHeatmap.tsx`

Heatmap showing which videos are referenced most frequently in AI responses.

**Props:**
- `creatorId: string` - Creator ID

**Features:**
- Frequency bins: Daily, Weekly, Monthly
- Color intensity based on reference count (5 levels)
- Click video to see example chat contexts (coming soon)
- Helps identify most valuable content

**Usage:**
```tsx
<VideoReferenceHeatmap creatorId="creator-123" />
```

---

### 5. StudentChatActivity
**Location:** `components/analytics/StudentChatActivity.tsx`

List view showing per-student chat activity and engagement.

**Props:**
- `creatorId: string` - Creator ID
- `sortBy?: SortBy` - Sort order - default: 'messages'

**Features:**
- Sort by: messages, sessions, lastActive
- Search by email
- Columns: Student, Total Messages, Sessions, Last Active, Avg Session Length
- Click student to view full chat history
- Identifies power users and inactive students

**Usage:**
```tsx
<StudentChatActivity creatorId="creator-123" sortBy="messages" />
```

---

### 6. ChatCostTracker
**Location:** `components/analytics/ChatCostTracker.tsx`

Cost analytics for AI API usage with budget tracking.

**Props:**
- `creatorId: string` - Creator ID
- `timeRange?: TimeRange` - Time range - default: '30d'
- `budgetThreshold?: number` - Monthly budget in USD - default: 100

**Features:**
- Budget alerts (warning at 80%, error at 100%)
- Daily cost trend line chart
- Model breakdown pie chart (Haiku vs Sonnet)
- Metrics: Total cost, per-message, per-student
- Cost projections

**Usage:**
```tsx
<ChatCostTracker
  creatorId="creator-123"
  timeRange="30d"
  budgetThreshold={100}
/>
```

---

### 7. SessionInsightsCard
**Location:** `components/analytics/SessionInsightsCard.tsx`

Aggregate session metrics card showing chat session quality.

**Props:**
- `creatorId: string` - Creator ID

**Metrics:**
- Total sessions this month
- Avg messages per session
- Avg session duration
- Session completion rate
- Trend indicators (vs last period)

**Quality Scoring:**
- Excellent: ≥80% completion rate
- Good: ≥60% completion rate
- Needs Improvement: <60% completion rate

**Usage:**
```tsx
<SessionInsightsCard creatorId="creator-123" />
```

---

## API Endpoints

### Main Analytics Endpoint
**GET** `/api/analytics/chat`

Query parameters:
- `creatorId: string` (required)
- `timeRange: '7d' | '30d' | '90d' | 'all'` - default: '30d'
- `metric: 'volume' | 'quality' | 'sessions' | 'video-references' | 'student-activity'`
- `sortBy: 'messages' | 'sessions' | 'lastActive'` (for student-activity)

Returns data based on metric type.

---

### Popular Questions
**GET** `/api/analytics/chat/popular-questions`

Query parameters:
- `creatorId: string` (required)
- `limit: number` - default: 20
- `timeRange: '7d' | '30d' | '90d' | 'all'` - default: '30d'

Returns clustered popular questions.

---

### Cost Analytics
**GET** `/api/analytics/chat/cost`

Query parameters:
- `creatorId: string` (required)
- `timeRange: '7d' | '30d' | '90d' | 'all'` - default: '30d'

Returns cost breakdown and projections.

**POST** `/api/analytics/chat/cost`

Update cost data after AI API calls.

Body:
```json
{
  "messageId": "msg-123",
  "inputTokens": 500,
  "outputTokens": 1200,
  "model": "claude-3-5-haiku-20241022",
  "responseTimeMs": 2500
}
```

---

## Analytics Library

**Location:** `lib/analytics/chat.ts`

Core functions for chat analytics calculations:

### `calculateResponseQuality(messages: ChatMessage[]): QualityMetrics`
Calculates AI response quality metrics from chat messages.

### `clusterSimilarQuestions(questions: string[]): QuestionCluster[]`
Clusters similar questions using Levenshtein distance (70% threshold).

### `calculateAICost(messages: ChatMessage[]): CostBreakdown`
Calculates AI API costs from token usage and model pricing.

### `detectSessionBoundaries(messages: ChatMessage[]): Session[]`
Detects chat sessions from messages (30-minute inactivity = new session).

### `hasVideoReference(message: ChatMessage): boolean`
Checks if message contains video references/citations.

### `extractVideoReferences(message: ChatMessage): string[]`
Extracts video IDs from AI message content.

### `calculateTrend(current: number, previous: number): { trend, percentage }`
Calculates trend direction and percentage change.

---

## Database Schema

**Migration:** `supabase/migrations/20250110000001_add_chat_analytics_columns.sql`

### New Columns (chat_messages table)
- `input_tokens: INTEGER` - Input tokens sent to AI
- `output_tokens: INTEGER` - Output tokens generated by AI
- `model: VARCHAR(50)` - AI model used (default: claude-3-5-haiku-20241022)
- `cost_usd: DECIMAL(10,6)` - Cost in USD for this AI call
- `response_time_ms: INTEGER` - Response generation time in ms
- `has_video_reference: BOOLEAN` - Whether message contains video refs
- `video_references: TEXT[]` - Array of video IDs referenced

### Indexes
- `idx_chat_messages_creator_date` - For analytics queries by creator
- `idx_chat_messages_student_session` - For session analysis
- `idx_chat_messages_role_creator` - For AI message queries
- `idx_chat_messages_video_refs` - GIN index for video reference searches
- `idx_chat_messages_cost` - For cost analytics

### Views
- `chat_cost_analytics` - Aggregated daily cost metrics
- `chat_session_analytics` - Session-level analytics

### Triggers
- `trigger_update_has_video_reference` - Auto-updates has_video_reference flag

---

## Cost Calculation

AI pricing (per million tokens):

| Model | Input | Output |
|-------|-------|--------|
| Haiku | $0.80 | $4.00 |
| Sonnet | $3.00 | $15.00 |

Cost formula:
```
cost_usd = (input_tokens * input_price + output_tokens * output_price) / 1,000,000
```

---

## Session Detection

Sessions are detected using 30-minute inactivity threshold:
- Messages within 30 minutes = same session
- Gap > 30 minutes = new session

Session completion:
- Completed: Last message is from assistant
- Abandoned: Last message is from user

---

## Question Clustering

Questions are clustered using Levenshtein distance algorithm:
- Similarity threshold: 70%
- Normalization: lowercase, remove punctuation
- Each cluster has a representative question
- Variations are stored for context

Example:
```
Representative: "How do I start trading?"
Variations:
  - "How to begin trading?"
  - "Starting with trading"
  - "What's the first step in trading?"
Count: 45
```

---

## Integration Example

```tsx
import {
  ChatVolumeChart,
  PopularQuestionsTable,
  ResponseQualityChart,
  VideoReferenceHeatmap,
  StudentChatActivity,
  ChatCostTracker,
  SessionInsightsCard
} from '@/components/analytics';

export default function ChatAnalyticsDashboard({ creatorId }: { creatorId: string }) {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatVolumeChart creatorId={creatorId} timeRange="30d" />
        <SessionInsightsCard creatorId={creatorId} />
      </div>

      {/* Quality Metrics */}
      <ResponseQualityChart creatorId={creatorId} />

      {/* Content Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularQuestionsTable creatorId={creatorId} topN={20} />
        <VideoReferenceHeatmap creatorId={creatorId} />
      </div>

      {/* Student & Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentChatActivity creatorId={creatorId} sortBy="messages" />
        <ChatCostTracker creatorId={creatorId} budgetThreshold={100} />
      </div>
    </div>
  );
}
```

---

## Performance Considerations

- All components fetch data independently (can be cached at API level)
- Database indexes optimize common queries
- Views pre-aggregate complex calculations
- Consider implementing Redis caching for high-traffic creators
- Use `offset` and `limit` for pagination in large datasets

---

## Future Enhancements

1. **Semantic Question Clustering** - Use embeddings for better clustering
2. **Real-time Analytics** - WebSocket updates for live data
3. **Advanced Filters** - Filter by student, date range, video
4. **Export Formats** - PDF reports, CSV exports for all components
5. **Satisfaction Tracking** - Thumbs up/down on AI responses
6. **A/B Testing** - Compare different AI models/prompts
7. **Anomaly Detection** - Alert on unusual patterns
8. **Predictive Analytics** - Forecast costs and usage

---

## Testing

Example test cases:
```typescript
// Test question clustering
test('clusters similar questions', () => {
  const questions = [
    "How do I start?",
    "How to begin?",
    "What is trading?",
  ];
  const clusters = clusterSimilarQuestions(questions);
  expect(clusters).toHaveLength(2);
  expect(clusters[0].variations).toHaveLength(2);
});

// Test cost calculation
test('calculates AI cost correctly', () => {
  const messages: ChatMessage[] = [
    {
      role: 'assistant',
      model: 'claude-3-5-haiku-20241022',
      input_tokens: 1000,
      output_tokens: 2000,
      // ... other fields
    },
  ];
  const cost = calculateAICost(messages);
  expect(cost.total).toBeCloseTo(0.0088); // (1000*0.8 + 2000*4.0)/1M
});
```

---

## License
MIT
