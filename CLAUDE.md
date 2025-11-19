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

See `docs/mcp/UI_MCP_GUIDE.md` for detailed usage instructions.

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

# Start Next.js dev server
npm run dev

# OPTIONAL: Start Inngest Dev Server (for background job debugging)
# NOTE: Currently YouTube import has broken frontend so this doesn't matter
npx inngest-cli dev -u http://localhost:3007/api/inngest

# Inngest Dashboard: http://localhost:8288

# Build
npm run build

# Production
npm run start

# Type checking
npm run type-check

# Linting (uses Biome)
npm run lint

# Utility Scripts (for debugging broken YouTube feature)
npx tsx scripts/trigger-embeddings.ts    # Manually trigger embeddings for stuck videos
npx tsx scripts/check-database.ts        # Check video statuses and database state
```

**WARNING:** YouTube embedding feature has broken frontend (CourseBuilder UI). Backend processing works but videos don't display. System is NOT usable. See `docs/YOUTUBE_EMBEDDING_IMPLEMENTATION_STATUS.md`.

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

## Video Integration Architecture

### Supported Video Sources

Chronos supports 4 video import methods with automatic transcript extraction:

1. **YouTube** - FREE transcript via youtubei.js API
   - Cost: $0 (completely free)
   - Import time: 2-5 seconds
   - Storage: No storage needed (embed only)
   - Best for: Public educational content, tutorials

2. **Loom** - FREE transcript via Loom API
   - Cost: $0 (completely free)
   - Import time: 2-5 seconds
   - Storage: No storage needed (embed only)
   - Best for: Screen recordings, quick tutorials

3. **Whop** - Import from existing Whop courses (Mux/YouTube/Loom)
   - Cost: $0.005/min for Mux transcription (YouTube/Loom embeds are free)
   - Import time: 5-10 seconds
   - Storage: Hosted by Whop/Mux
   - Best for: Private member content, existing Whop courses

4. **Direct Upload** - Upload any video file with Whisper transcription
   - Cost: $0.006/min (Whisper) + $0.021/GB/month (storage)
   - Import time: 2-5 minutes per hour of video
   - Storage: Supabase Storage with quotas
   - Best for: Maximum flexibility, internal content

### Video Players

Location: `components/video/`

- **MuxVideoPlayer.tsx** - HLS streaming for Mux-hosted videos
  - Features: Adaptive bitrate, analytics tracking, custom controls

- **LoomPlayer.tsx** - Iframe embed for Loom videos
  - Features: Native Loom player, responsive, analytics integration

- **VideoPlayer.tsx** (YouTube) - react-youtube for YouTube embeds
  - Features: YouTube iframe API, progress tracking, responsive

- **HTML5 Player** - Native player for uploaded videos
  - Features: Standard controls, Supabase Storage integration

All players include:
- Watch session tracking
- Progress milestone events (10%, 25%, 50%, 75%, 90%, completion)
- View count tracking
- Engagement analytics

### Video Import Interface

**Component:** `VideoSourceSelector`
**Location:** `components/video/VideoSourceSelector.tsx`

Unified 4-tab interface for all video imports:
- Tab 1: YouTube - URL validation, metadata preview, instant import
- Tab 2: Loom - URL validation, Loom API metadata, instant import
- Tab 3: Whop - Browse products, select lessons, bulk import
- Tab 4: Upload - Drag-drop, chunked upload, progress tracking

**Features:**
- Real-time import progress
- Preview before import
- Error handling and recovery
- Analytics integration
- Storage quota enforcement

### Analytics Dashboard

**Location:** `/dashboard/creator/analytics/videos`

**Features:**
- 8 Recharts visualizations
- Cost breakdown by source
- Engagement metrics
- Storage usage tracking
- CSV export
- Date range filtering

**Charts:**
1. Metric Cards (4) - Views, watch time, completion, video count
2. Views Over Time - Line chart with daily breakdown
3. Completion Rates - Horizontal bar chart, top 10 videos
4. Cost Breakdown - Pie chart by source (FREE vs PAID)
5. Storage Usage - Area chart with quota warnings
6. Student Engagement - Heatmap (7 days × 6 time blocks)
7. Top Videos - Sortable table with search
8. Export Button - CSV download

### Database Schema

**New Tables (Phase 1-3):**

1. **module_lessons** - Course structure
   - Links modules to videos
   - Lesson ordering
   - Creator ownership

2. **video_analytics_events** - Granular tracking
   - Event types: play, pause, seek, ended
   - Timestamp tracking
   - Session association

3. **video_watch_sessions** - Session management
   - Start/end time
   - Total watch time
   - Furthest point reached
   - Completion status

**Enhanced Tables:**

4. **videos** - Added columns for multi-source support
   - `source_type`: 'youtube' | 'loom' | 'whop' | 'upload'
   - `youtube_video_id`: YouTube video ID
   - `loom_video_id`: Loom video ID
   - `mux_asset_id`: Mux asset ID
   - `mux_playback_id`: Mux playback ID
   - `embed_type`: 'youtube' | 'loom' | 'mux'

### API Endpoints

**Course Management:**
- `POST /api/courses` - Create course
- `GET /api/courses/[id]/modules` - List modules
- `POST /api/courses/[id]/modules` - Create module
- `POST /api/modules/[id]/lessons` - Create lesson
- `DELETE /api/modules/[id]/lessons/[lessonId]` - Delete lesson

**Video Import:**
- `POST /api/video/youtube/import` - Import YouTube video
- `POST /api/video/loom/import` - Import Loom video
- `GET /api/video/loom/metadata` - Preview Loom video
- `POST /api/video/whop/import` - Import Whop lesson
- `POST /api/video/upload` - Upload file

**Analytics:**
- `GET /api/analytics/videos/dashboard` - Dashboard data (8 queries)
- `GET /api/analytics/videos/[id]` - Video-specific analytics
- `POST /api/analytics/video-event` - Track event
- `GET /api/analytics/usage/creator/[id]` - Usage stats

### Storage Quotas

**Tier-based limits:**

| Plan | Storage | Video Limit | Upload Limit/Month |
|------|---------|-------------|-------------------|
| Basic | 1GB | 50 videos | 20 uploads |
| Pro | 10GB | 500 videos | 100 uploads |
| Enterprise | 100GB | Unlimited | Unlimited |

**Quota Enforcement:**
- Real-time usage tracking
- Warnings at 75%, 90%
- Upload rejection at 100%
- Dashboard visualization
- Upgrade prompts

### Cost Optimization

**Recommendations:**
1. Use YouTube when possible (100% free)
2. Use Loom for screencasts (100% free)
3. Use Whop for private content (minimal cost)
4. Only upload when necessary (highest cost)

**Cost Tracking:**
- Per-video cost calculation
- Source breakdown in analytics
- Total cost reporting
- Savings vs all-upload approach

---

## Documentation Structure

**IMPORTANT:** Documentation has been reorganized (November 18, 2025) for better navigation and clarity.

### Quick Start for Documentation

**Primary entry points:**
1. **[docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)** ⭐ - Current project status, production readiness (62/80 - Beta ready)
2. **[docs/README.md](./docs/README.md)** - Complete documentation navigation hub
3. **[docs/MASTER_PLAN.md](./docs/MASTER_PLAN.md)** - Video integration master plan (Phases 1-4 complete)

### Documentation Organization

**Root Directory:**
- `CLAUDE.md` - This file (AI assistant context)
- `README.md` - Project README
- **All other docs moved to `/docs`** (37 files reorganized)

**Documentation Structure:**
```
docs/
├── PROJECT_STATUS.md          ⭐ START HERE - Comprehensive status
├── README.md                  ⭐ Documentation navigation hub
├── MASTER_PLAN.md             Video integration plan
├── agent-reports/
│   ├── agents/                15 individual agent reports
│   ├── phases/                4 phase summaries
│   └── waves/                 Integration waves (Nov 18)
├── architecture/              System design & database
├── api/                       API documentation & endpoints
├── features/                  Feature-specific docs
│   ├── videos/               Video system documentation
│   ├── courses/              Course builder docs
│   ├── analytics/            Analytics dashboard docs
│   └── chat/                 AI chat system docs
├── database/                  Database setup & migrations
├── testing/                   Test reports & QA
├── guides/
│   ├── setup/                Setup & configuration
│   └── development/          Development guides
├── integrations/              Whop, video services
├── mcp/                       MCP server configs
├── deployment/                Deployment guides
├── security/                  Security documentation
└── archive/                   Outdated/legacy docs
```

### Current Project Status (November 18, 2025)

**Production Readiness:** 62/80 (78%) - Beta Ready
**Critical Blocker:** CHRON-001 (student pages timeout) - In progress
**Test Coverage:** 32.65% (123 tests passing)
**Build Status:** ✅ Passing (8.1s)
**Bundle Size:** 840KB (optimized from 1.2MB)

**Recent Achievements (5-Agent Integration - Nov 18):**
- ✅ Bundle optimization (30% reduction)
- ✅ 123 tests passing (100% success rate)
- ✅ Memory leaks eliminated (70MB/hour → 0)
- ✅ WCAG compliance: 85% (from 18%)
- ✅ Production logging infrastructure
- ✅ Zero integration conflicts

See **[docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)** for complete details.

### Finding Documentation

**For specific topics, check:**

**Project Status & Planning:**
- Current status → `docs/PROJECT_STATUS.md`
- Master plans → `docs/MASTER_PLAN.md`, `docs/architecture/IMPLEMENTATION_PLAN.md`
- Integration reports → `docs/agent-reports/waves/`

**Development:**
- API reference → `docs/api/QUICK_REFERENCE.md`
- Setup guides → `docs/guides/setup/`
- Feature docs → `docs/features/`
- Database → `docs/database/`

**Testing & QA:**
- Test overview → `docs/testing/README.md`
- Bug tracking → `docs/testing/BUG_TRIAGE_LIST.md`
- Integration verification → `docs/agent-reports/waves/integration-verification-2025-11-18.md`

**Agent Reports:**
- Individual agents → `docs/agent-reports/agents/`
- Phase summaries → `docs/agent-reports/phases/`
- Integration waves → `docs/agent-reports/waves/`

**Everything else:** See `docs/README.md` for complete navigation.

---

## References

- Whop Developer Docs: https://docs.whop.com
- Claude API: https://docs.anthropic.com
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Supabase Vector Guide: https://supabase.com/docs/guides/ai/vector-embeddings
- Frosted UI: https://storybook.whop.dev
- Next.js App Router: https://nextjs.org/docs/app