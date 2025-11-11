# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chronos** - An AI-powered video learning assistant for Whop creators in education and coaching. The app transforms passive video courses into interactive, personalized learning experiences with AI chat, automated transcription, and comprehensive analytics.

**Core Value:** Save creators 10+ hours/week in student support while increasing course completion rates from 15% to 60%+

**Target Market:** Educational creators on Whop (trading education 40%, e-commerce coaching 20%, real estate 15%, fitness 10%, AI training 15%)

## Tech Stack

- **Framework:** Next.js 14 (App Router), React, TypeScript
- **UI:** Frosted UI (Whop's design system) + Tailwind CSS
- **Charts:** Recharts for analytics and data visualization
- **Database:** Supabase PostgreSQL with pgvector for vector embeddings
- **AI:** Claude 3.5 Haiku (RAG chat), OpenAI (Whisper + embeddings)
- **Storage:** Supabase Storage for videos
- **Auth:** Whop OAuth
- **Jobs:** Inngest for background video processing
- **Cache:** Vercel KV (Redis)
- **Rate Limiting:** Upstash
- **Deployment:** Vercel
- **Monitoring:** Sentry

## MCP Servers & CLI Tools

**CRITICAL: Always use MCP servers when available for their respective services.**

### Connected MCP Servers

1. **Whop MCP Server** (mcp__whop__*)
   - **MANDATORY** for ALL Whop-related operations
   - Use for product management, memberships, users, company info
   - Use for searching/listing/validating Whop resources
   - Never use raw API calls when MCP server tools are available
   - Examples: `mcp__whop__list_products`, `mcp__whop__get_membership`, `mcp__whop__validate_membership`

2. **Supabase MCP Server** (mcp__supabase__*)
   - Use for database operations, migrations, SQL execution
   - Use for project management, type generation, advisors
   - Use for Edge Functions deployment
   - Examples: `mcp__supabase__execute_sql`, `mcp__supabase__apply_migration`, `mcp__supabase__list_tables`

### Available CLIs

- **Whop CLI** - For Whop app management and testing
- **Supabase CLI** - For local development and migrations
- **Vercel CLI** - For deployment and environment management

### UI MCP Configuration (ui.mcp.json)

**CRITICAL: Use UI MCP config for ALL UI building, designing, and layout work.**

```bash
claude --mcp-config ui.mcp.json
```

**Available UI MCP Servers:**

1. **Playwright** ⭐ **MANDATORY for UI development** - Multi-browser testing (Chrome, Firefox, Safari)
2. **Sequential Thinking** - Enhanced reasoning for UI architecture decisions
3. **Memory** - Persist UI patterns and design decisions

**When to use UI MCP config:**
- **Building UI components** (MANDATORY - use Playwright while coding)
- **Designing layouts** (test responsive behavior as you build)
- **Component architecture** (plan with Sequential Thinking)
- Component testing and visual QA
- Cross-browser compatibility testing
- Accessibility audits
- Responsive design verification
- Performance testing (Lighthouse scores)

**Workflow for UI Development:**
1. Start with `ui.mcp.json` configuration
2. Build component code
3. Use Playwright to test immediately in browser
4. Verify responsive breakpoints (375px, 768px, 1440px)
5. Check accessibility while developing
6. Only consider component complete after browser testing

See `docs/UI_MCP_GUIDE.md` for detailed usage instructions.

### Integration Rules

1. **For ANY Whop integration work**: MUST use Whop MCP server tools
2. **For database operations**: Prefer Supabase MCP server over raw SQL
3. **For questions about Whop**: Use MCP server to fetch real data
4. **For building Whop features**: Reference MCP server capabilities first
5. **For UI building, designing, and layout**: Use `ui.mcp.json` configuration with Playwright MCP
   - **MANDATORY**: Use Playwright MCP while building UI components
   - Test components as you build them (don't wait until after)
   - Verify responsive behavior in real browsers
   - Check accessibility during development
6. **For UI testing and QA**: Use `ui.mcp.json` configuration

## Core Features (Streamlined MVP)

1. **AI Chat with RAG** - Semantic search across video transcripts with timestamp citations
2. **Video Processing Pipeline** - Bulk upload → transcription → chunking → vector embeddings
3. **Course Builder** - Drag-drop course organization with modules
4. **Creator Analytics Dashboard** - Video performance, student engagement, usage metrics with interactive charts
5. **Usage Limits** - Tier-based rate limiting and quotas per Whop plan
6. **Whop Integration** - OAuth, membership sync, webhook handlers

**This is a clean rebuild. We removed:**
- ❌ Blockchain/Token systems
- ❌ Discord integration
- ❌ Study buddy matching
- ❌ AI quiz generation (future)
- ❌ Learning calendar (future)

## Development Workflow: Parallel Agent Execution

**PRIMARY DEVELOPMENT PATTERN**: Use Claude Code's Task tool with multiple agents running in parallel whenever features are independent.

**UI DEVELOPMENT REQUIREMENT**: Always use `ui.mcp.json` configuration when building UI components. Use Playwright MCP to test components in real browsers as you develop them.

### Agent Orchestration Strategy

Claude Code acts as the orchestrator. When building features:
1. I send **1 message with multiple Task tool calls**
2. Each Task launches a specialized agent
3. All agents work simultaneously
4. I review all results and summarize progress

**For UI agents**: Each agent MUST use Playwright MCP to verify their components work in real browsers before reporting completion.

### When to Use Parallel Agents

Use parallel agents for:
- Setting up project infrastructure (dependencies, configs, database schemas)
- Building independent UI components
- Creating separate API endpoints
- Implementing different pipeline stages (upload, transcription, chunking, embedding)
- Building analytics dashboard widgets
- Any tasks without direct dependencies

### Example: Phase 1 Setup

Instead of sequential:
1. Clone template
2. Then install UI framework
3. Then set up database
4. Then configure Whop

Do parallel:
**Launch 4 agents in 1 message:**
- Agent 1: Project scaffolding
- Agent 2: UI framework setup
- Agent 3: Database architecture
- Agent 4: Whop integration

### Benefits

- **3-5x faster development** - Parallel execution vs sequential
- **Better code isolation** - Each agent focuses on one concern
- **Independent testing** - Test components separately
- **Clearer separation** - Natural module boundaries

## Project Structure

```
chronos/
├── app/
│   ├── api/
│   │   ├── whop/              # OAuth + webhooks
│   │   ├── video/             # Upload + processing
│   │   ├── chat/              # RAG chat endpoint
│   │   ├── courses/           # Course management
│   │   └── analytics/         # Analytics queries
│   ├── dashboard/
│   │   ├── creator/
│   │   │   ├── overview/      # Main analytics dashboard
│   │   │   ├── videos/        # Video management + stats
│   │   │   ├── students/      # Student insights
│   │   │   ├── courses/       # Course builder
│   │   │   └── settings/      # Usage limits, billing
│   │   └── student/
│   │       ├── courses/       # Course catalog
│   │       └── chat/          # AI chat interface
│   └── page.tsx               # Landing page
├── components/
│   ├── video/                 # Upload, player, list
│   ├── chat/                  # Chat interface
│   ├── courses/               # Course builder
│   ├── analytics/             # Charts & metrics
│   └── ui/                    # Frosted UI + custom
├── lib/
│   ├── whop/                  # Whop SDK integration
│   ├── rag/                   # Chat + vector search
│   ├── video/                 # Processing pipeline
│   ├── analytics/             # Analytics logic
│   └── db/                    # Supabase queries
├── docs/
│   ├── IMPLEMENTATION_PLAN.md # Master blueprint
│   └── OLD_PROJECT_AUDIT.md   # Lessons learned
├── supabase/
│   └── migrations/            # 3-5 migrations max
└── CLAUDE.md                  # This file
```

## Database Schema (Supabase PostgreSQL)

### Core Tables (10 total)

1. **creators** - Whop company_id, subscription_tier, settings
2. **students** - Whop user_id, email, preferences
3. **videos** - Title, URL, transcript, status, creator_id
4. **video_chunks** - Chunk text, embedding (vector 1536), video_id, timestamps
5. **courses** - Title, description, creator_id, ordering
6. **course_modules** - Module name, course_id, video assignments
7. **chat_sessions** - Student_id, creator_id, title, created_at
8. **chat_messages** - Session_id, role, content, video_references
9. **video_analytics** - Video_id, views, watch_time, completion_rate, date
10. **usage_metrics** - Creator_id, storage_used, ai_credits_used, tier_limits

### Vector Search

```sql
-- Enable pgvector extension
CREATE EXTENSION vector;

-- Vector similarity search index
CREATE INDEX ON video_chunks USING ivfflat (embedding vector_cosine_ops);
```

## Key Implementation Patterns

### Whop Authentication

All protected routes validate Whop OAuth tokens:

```typescript
// lib/whop/auth.ts
export async function validateWhopUser(token: string) {
  const user = await whopAuth.verifyUser(token);
  const membership = await whopAuth.validateMembership(user.membershipId);

  if (!user || !membership.isActive) {
    throw new Error('Unauthorized');
  }

  return { user, membership };
}
```

### Video Processing Pipeline

1. Upload video to Supabase Storage
2. Extract audio and transcribe (OpenAI Whisper)
3. Chunk transcript into 500-1000 word segments with overlap
4. Generate embeddings via OpenAI API (ada-002)
5. Store in `video_chunks` table with pgvector
6. Update video status to "processed"

**Use Inngest for background processing** - don't block API requests

### RAG Chat Flow

1. User query → generate embedding (OpenAI)
2. Vector similarity search in `video_chunks` (pgvector)
3. Retrieve top 3-5 relevant chunks with video metadata
4. Build context for Claude API
5. Generate response citing video timestamps
6. Return response with clickable video references
7. Log interaction for analytics

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Type checking
npm run type-check

# Linting (uses Biome)
npm run lint
```

## Environment Variables

```bash
# Whop
WHOP_API_KEY=
WHOP_CLIENT_ID=
WHOP_CLIENT_SECRET=
WHOP_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Infrastructure
VERCEL_KV_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

## Whop Integration Requirements

### Webhook Events to Handle

- `membership.created` → Provision student access
- `membership.expired` → Revoke student access
- `payment.succeeded` → Log for analytics

### Security Checklist

- ✅ Verify Whop webhook signatures on all webhook endpoints
- ✅ Validate membership status before serving content
- ✅ Rate limiting: 100 requests/minute per user
- ✅ SQL injection prevention (use parameterized queries)
- ✅ Store all secrets in environment variables only
- ✅ Use Row Level Security (RLS) in Supabase

## Performance Requirements

- Chat response time: < 5 seconds (95th percentile)
- Video processing: < 5 minutes per hour of video
- Dashboard load time: < 3 seconds
- Search results: < 2 seconds
- Support 1000+ concurrent users

## Testing Strategy

Focus testing on:
- Whop OAuth flow and token validation
- Webhook signature verification
- Video processing pipeline (upload → embeddings)
- RAG search accuracy and response quality
- Rate limiting enforcement
- Mobile responsiveness

## Monitoring & Error Handling

- Use Sentry for error tracking on all API routes
- Log all critical operations (video processing, AI calls, payments)
- Track performance metrics (response times, processing duration)
- Alert on failures (transcription errors, AI API errors, webhook failures)
- Graceful degradation if AI API down (show cached responses)

## Cost Optimization

- Cache AI embeddings to avoid reprocessing
- Implement rate limiting to prevent abuse
- Use efficient prompting for Claude API calls
- Batch embedding generation when possible
- Monitor AI API usage and set alerts

## Git Commit Footer Convention

All commits in this repository should end with:

```
Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
```

This replaces the standard Claude Code footer and properly attributes development work.

## References

- Whop Developer Docs: https://docs.whop.com
- Claude API: https://docs.anthropic.com
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Supabase Vector Guide: https://supabase.com/docs/guides/ai/vector-embeddings
- Frosted UI: https://storybook.whop.dev
- Next.js App Router: https://nextjs.org/docs/app