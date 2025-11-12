# Chronos - Implementation Plan

**Project:** AI-Powered Video Learning Assistant for Whop Creators
**Timeline:** 4 weeks (28 days) to production-ready MVP
**Strategy:** Agent-driven parallel development

---

## Executive Summary

Chronos is a clean rebuild of a video learning platform, removing 60% of unnecessary code (25,000+ lines) including blockchain systems, Discord bots, and complex gamification. This implementation plan leverages **28 parallel agents across 6 phases** to accelerate development by 3-5x.

**Core MVP Features:**
1. Video upload with automated transcription and vectorization
2. AI chat with RAG (semantic search across videos)
3. Course builder (drag-drop organization)
4. Creator analytics dashboard (8+ interactive charts)
5. Usage limits and tier management
6. Whop OAuth integration

---

## Development Philosophy: Agent Orchestration

### How It Works

**Claude Code = Orchestrator**
- Launches multiple Task agents in a single message
- Each agent works independently on separate features
- All agents report back simultaneously
- Orchestrator reviews and proceeds to next phase

### Example Workflow

```
User: "Start Phase 1"
  ↓
Orchestrator sends 1 message with 4 Task calls
  ↓
Agent 1: Scaffolding    Agent 2: UI Setup    Agent 3: Database    Agent 4: Whop
  ↓                         ↓                    ↓                   ↓
All work in parallel (3-5x faster than sequential)
  ↓
Orchestrator summarizes: "Phase 1 complete. Ready for Phase 2?"
```

### Benefits

- **Speed:** 4 weeks vs. 8 weeks sequential
- **Isolation:** Each agent focuses on one concern
- **Testing:** Independent component validation
- **Quality:** Clear separation of concerns

---

## Phase 1: Project Foundation (Day 1-2)

**Goal:** Set up clean project structure with all foundations ready

### Agent Assignments (4 parallel agents)

#### Agent 1: Project Scaffolding
**Task:** Set up base Next.js structure
- ✅ Clone Whop Next.js template
- ✅ Remove original git history
- ✅ Install base dependencies
- Set up Vercel deployment config
- Create .env.example with all required variables
- Configure TypeScript strict mode
- Set up ESLint and Prettier (via Biome)

**Deliverable:** Clean Next.js 14 project with proper config

---

#### Agent 2: UI Framework Setup
**Task:** Install and configure UI libraries
- ✅ Install Frosted UI (Whop's design system)
- ✅ Install Recharts for analytics
- Configure Tailwind with Frosted theme
- Install Framer Motion for animations
- Set up Lucide React icons
- Create base layout components:
  - `components/layout/Header.tsx`
  - `components/layout/Sidebar.tsx`
  - `components/layout/Footer.tsx`
  - `components/layout/DashboardLayout.tsx`

**Deliverable:** UI framework ready with base components

---

#### Agent 3: Database Architecture
**Task:** Design and implement Supabase schema
- Design 10 core tables (see schema below)
- Create migration files in `supabase/migrations/`
- Set up pgvector extension for embeddings
- Define Row Level Security (RLS) policies
- Create database types for TypeScript
- Set up Supabase client in `lib/db/client.ts`
- Create query helpers in `lib/db/queries.ts`

**Deliverable:** Production-ready database schema

---

#### Agent 4: Whop Integration Foundation
**Task:** Set up Whop OAuth and webhooks
- Implement OAuth flow in `lib/whop/auth.ts`
- Create webhook signature verification
- Build Whop API client wrapper in `lib/whop/api-client.ts`
- Create middleware for auth validation
- Implement membership status checking
- Set up webhook handlers skeleton
- Test OAuth flow end-to-end

**Deliverable:** Working Whop authentication

---

### Phase 1 Success Criteria

- [ ] Clean Next.js project with all deps installed
- [ ] Frosted UI integrated with base layout
- [ ] Supabase database deployed with all tables
- [ ] Whop OAuth flow working
- [ ] No TypeScript or build errors
- [ ] Dev server runs successfully

**Timeline:** 2 days | **Agents:** 4 parallel

---

## Phase 2: Core Video Pipeline (Day 3-7)

**Goal:** End-to-end video processing working (upload → transcription → embeddings)

### Agent Assignments (5 parallel agents)

#### Agent 1: Video Upload UI
**Task:** Build frontend upload experience
- Create `components/video/VideoUploader.tsx`
  - Drag-and-drop file upload
  - Multiple file selection
  - File type validation (mp4, mov, avi, webm)
  - File size validation (max per tier)
  - Upload progress bars
- Create `components/video/VideoPreview.tsx`
- Build `components/video/ProcessingStatus.tsx`
  - Real-time status updates via Supabase subscriptions
  - Progress indicators for each stage
- Add bulk upload support

**Deliverable:** Polished video upload UI

---

#### Agent 2: Video Storage & API
**Task:** Backend upload handling
- Set up Supabase Storage buckets
  - `videos` bucket with public access policies
  - Tier-based storage quotas
- Create `app/api/video/upload/route.ts`
  - Handle multipart file uploads
  - Generate signed URLs
  - Validate file types and sizes
  - Create video records in database
- Build `app/api/video/list/route.ts`
- Add storage quota tracking in `lib/video/storage.ts`
- Implement cleanup for failed uploads

**Deliverable:** Working video upload API

---

#### Agent 3: Transcription Service
**Task:** Audio extraction and transcription
- Integrate OpenAI Whisper API
- Create `lib/video/transcription.ts`
  - Audio extraction from video
  - Call Whisper API
  - Handle long videos (chunking if needed)
  - Store transcript in database
- Build Inngest function for background processing
  - Queue transcription jobs
  - Retry logic for failures (3 retries with exponential backoff)
  - Error notifications
- Track transcription costs per video

**Deliverable:** Automated transcription pipeline

---

#### Agent 4: Chunking & Embedding Engine
**Task:** Convert transcripts to searchable vectors
- Build text chunking algorithm in `lib/video/chunking.ts`
  - 500-1000 word chunks
  - 100-word overlap between chunks
  - Preserve sentence boundaries
  - Include timestamp metadata
- Create OpenAI embedding generator in `lib/video/embeddings.ts`
  - Use ada-002 model (1536 dimensions)
  - Batch processing for efficiency
  - Rate limiting to avoid API throttling
- Store vectors in `video_chunks` table
- Track embedding costs

**Deliverable:** Vector embedding pipeline

---

#### Agent 5: Processing Status Tracker
**Task:** Orchestrate and monitor pipeline
- Create processing state machine in `lib/video/processor.ts`
  - States: pending, transcribing, chunking, embedding, completed, failed
  - Transition logic
- Build real-time status updates
  - Use Supabase subscriptions for live UI updates
  - WebSocket connections for dashboard
- Implement comprehensive error handling
  - Retry failed stages
  - User notifications on failures
  - Admin alerts for critical errors
- Create processing analytics logger
  - Track processing times per stage
  - Identify bottlenecks

**Deliverable:** Complete video processing orchestration

---

### Phase 2 Success Criteria

- [ ] Users can upload videos via drag-drop
- [ ] Videos automatically transcribe (Whisper)
- [ ] Transcripts chunk and generate embeddings
- [ ] Real-time processing status updates
- [ ] Error handling and retries work
- [ ] Processing costs tracked accurately

**Timeline:** 5 days | **Agents:** 5 parallel

---

## Phase 3: AI Chat System (Day 8-12)

**Goal:** Fully functional AI chat with RAG and video citations

### Agent Assignments (4 parallel agents)

#### Agent 1: RAG Engine Core
**Task:** Build vector similarity search
- Implement vector search in `lib/rag/search.ts`
  - pgvector cosine similarity
  - Top-k retrieval (configurable, default 5)
  - Relevance score threshold
  - Filter by creator/course if needed
- Create ranking algorithm
  - Combine similarity score + recency + popularity
  - Boost recently viewed videos
- Build context builder in `lib/rag/context-builder.ts`
  - Format chunks for Claude API
  - Include video metadata (title, timestamp)
  - Deduplication logic
- Optimize query performance
  - Index tuning
  - Query result caching (Vercel KV)

**Deliverable:** Fast, accurate vector search

---

#### Agent 2: Claude API Integration
**Task:** AI chat completion system
- Set up Anthropic SDK in `lib/ai/claude.ts`
- Create chat completion handler
  - Streaming responses for better UX
  - System prompts for educational assistant persona
  - Context injection from RAG results
  - Token usage tracking
- Implement prompt templates in `lib/ai/prompts.ts`
  - Educational assistant system prompt
  - Video citation formatting
  - Follow-up question suggestions
- Add response caching (Vercel KV)
  - Cache common questions
  - Invalidate on new video uploads
- Track Claude API costs per message

**Deliverable:** Claude-powered chat responses

---

#### Agent 3: Chat UI Components
**Task:** Build beautiful chat interface
- Create `components/chat/ChatInterface.tsx`
  - Clean, modern chat UI using Frosted components
  - Auto-scroll to latest message
  - Loading states (typing indicators)
  - Error handling UI
- Build `components/chat/MessageList.tsx`
  - Message bubbles (user vs. assistant)
  - Timestamp display
  - Video citation cards (clickable)
- Create `components/chat/MessageInput.tsx`
  - Text input with autocomplete
  - File attachment support (images for context)
  - Character count
  - Send button with keyboard shortcuts
- Build `components/chat/VideoReferenceCard.tsx`
  - Video thumbnail
  - Timestamp with click-to-play
  - Relevance score indicator
- Create `components/chat/SessionSidebar.tsx`
  - Chat history list
  - Search chat sessions
  - Delete/rename sessions

**Deliverable:** Complete chat UI

---

#### Agent 4: Session & Analytics
**Task:** Manage chat sessions and track usage
- Create session management in `lib/rag/sessions.ts`
  - CRUD operations for sessions
  - Auto-create sessions on first message
  - Lazy session titles (AI-generated from first message)
- Build chat history persistence
  - Store all messages in `chat_messages` table
  - Include video references
  - Support message editing/deletion
- Implement usage tracking for analytics
  - Messages per student/video
  - Most referenced videos
  - Common question topics (keyword extraction)
  - Chat session duration
- Create cost per-chat calculator
  - Claude API tokens
  - OpenAI embedding costs
  - Total per-student costs

**Deliverable:** Session management + analytics

---

### Phase 3 Success Criteria

- [ ] Users can ask questions about videos
- [ ] AI responds with relevant video citations
- [ ] Timestamp links jump to correct video position
- [ ] Chat history persists across sessions
- [ ] Streaming responses work smoothly
- [ ] All chat interactions logged for analytics

**Timeline:** 5 days | **Agents:** 4 parallel

---

## Phase 4: Creator Analytics Dashboard (Day 13-17)

**Goal:** Complete dashboard with 8+ interactive charts and usage metrics

### Agent Assignments (6 parallel agents)

#### Agent 1: Video Analytics
**Task:** Track and visualize video performance
- Build video performance queries in `lib/analytics/video-stats.ts`
  - Total views per video
  - Watch time (average, median, total)
  - Completion rates
  - Chat references count
  - Engagement timeline (views over time)
- Create `components/analytics/VideoStatsChart.tsx` (Recharts)
  - Line chart: Views over time (7d, 30d, 90d filters)
  - Bar chart: Top 10 videos by views
  - Area chart: Watch time distribution
- Build `components/analytics/VideoEngagementHeatmap.tsx`
  - Heat map showing which video sections get most questions
  - Timestamp-based question density
- Implement real-time updates via Supabase subscriptions

**Deliverable:** Video performance analytics

---

#### Agent 2: Student Engagement Analytics
**Task:** Track student activity and retention
- Build student activity queries in `lib/analytics/student-stats.ts`
  - Active students (daily, weekly, monthly)
  - Student retention calculations (cohort analysis)
  - Engagement scores (composite metric)
  - Most engaged students
- Create `components/analytics/EngagementChart.tsx`
  - Line chart: Active users over time
  - Funnel chart: Student journey (signup → first video → first chat → completion)
  - Retention curve (30-day cohorts)
- Build `components/analytics/StudentLeaderboard.tsx`
  - Top students by engagement
  - Sortable by videos watched, chats sent, courses completed
- Add student profile drill-down
  - Individual student analytics page
  - Activity timeline
  - Course progress

**Deliverable:** Student engagement metrics

---

#### Agent 3: Usage & Rate Limits UI
**Task:** Visualize tier limits and usage
- Create `components/analytics/UsageMeter.tsx`
  - Visual progress bars for each metric
  - Color-coded (green → yellow → red as approaching limit)
  - Animated counter (react-countup)
- Build usage displays for:
  - Videos uploaded / tier limit
  - Storage used / storage quota
  - AI chat credits / monthly allowance
  - Active students / tier limit (if applicable)
- Implement `components/analytics/UpgradePrompt.tsx`
  - Show when at 80%+ of any limit
  - Compare current tier vs. upgrade options
  - Direct link to Whop upgrade flow
- Create cost breakdown cards
  - OpenAI costs (transcription + embeddings)
  - Claude API costs (chat)
  - Storage costs
  - Total monthly spend

**Deliverable:** Usage tracking UI

---

#### Agent 4: AI Chat Analytics
**Task:** Track chat usage and performance
- Build chat metrics queries in `lib/analytics/chat-stats.ts`
  - Total messages per day/week/month
  - Messages per student
  - Messages per video
  - Average response time
  - Peak usage times
- Create `components/analytics/ChatActivityChart.tsx`
  - Bar chart: Messages per day
  - Line chart: Active chat users over time
  - Pie chart: Top videos by chat references
- Implement topic extraction (optional)
  - Use Claude to extract common question themes
  - Topic cloud visualization
- Build most-referenced videos widget
  - Top 5 videos students ask about most
  - Click through to video details

**Deliverable:** Chat analytics

---

#### Agent 5: Dashboard Layout & Overview
**Task:** Build main dashboard page
- Create `app/dashboard/creator/overview/page.tsx`
- Build hero stats cards (4 key metrics)
  - Total students (with % change from last period)
  - Total videos uploaded
  - Total chat messages
  - Average engagement score
- Implement animated counters (react-countup)
- Create `components/analytics/MetricCard.tsx`
  - Reusable card component
  - Icon, title, value, trend indicator
  - Sparkline mini-chart (optional)
- Build `components/analytics/TimeRangeFilter.tsx`
  - Toggle: 7 days, 30 days, 90 days, All time
  - Apply to all charts globally
- Create responsive grid system
  - 3-column on desktop
  - 2-column on tablet
  - 1-column on mobile
- Add quick actions section
  - Upload New Video
  - Create Course
  - View Usage

**Deliverable:** Complete dashboard overview

---

#### Agent 6: Data Export & Reporting
**Task:** Enable data export for creators
- Implement CSV export in `lib/analytics/export.ts`
  - Video performance report
  - Student engagement report
  - Chat activity report
- Create `app/api/analytics/export/route.ts`
  - Generate CSV files on demand
  - Date range filtering
  - Creator-specific data only
- Build export UI in `components/analytics/ExportButton.tsx`
  - Dropdown: Select report type
  - Date range picker
  - Download button
- Optional: Add email reports
  - Weekly summary email
  - Monthly analytics digest
  - Scheduled via Inngest

**Deliverable:** Data export functionality

---

### Phase 4 Success Criteria

- [ ] Dashboard shows 8+ interactive charts
- [ ] All charts respond to time range filters
- [ ] Usage meters update in real-time
- [ ] Creators can export data as CSV
- [ ] Mobile-responsive dashboard
- [ ] Fast load times (<3 seconds)

**Timeline:** 5 days | **Agents:** 6 parallel

---

## Phase 5: Course Builder (Day 18-21)

**Goal:** Full course creation and student navigation system

### Agent Assignments (4 parallel agents)

#### Agent 1: Course Data Model & API
**Task:** Backend course management
- Design course schema (already in DB, implement logic)
- Create course CRUD API routes:
  - `POST /api/courses/create` - Create new course
  - `GET /api/courses/[id]` - Get course details
  - `PUT /api/courses/[id]` - Update course
  - `DELETE /api/courses/[id]` - Delete course
  - `POST /api/courses/[id]/modules` - Add module
  - `PUT /api/courses/[id]/modules/[moduleId]` - Update module
- Build video-to-course assignment in `lib/courses/assignments.ts`
  - Assign videos to modules
  - Reorder videos within modules
  - Move videos between modules
- Implement course ordering logic
  - Drag-drop reorder persistence
  - Module ordering
- Add course metadata handling
  - Thumbnails
  - Descriptions
  - Prerequisites
  - Estimated duration

**Deliverable:** Course management API

---

#### Agent 2: Drag-Drop Course Builder UI
**Task:** Visual course organizer
- Install and configure @dnd-kit
- Create `components/courses/CourseBuilder.tsx`
  - Main course builder interface
  - Module list (draggable)
  - Video assignment interface
- Build `components/courses/ModuleEditor.tsx`
  - Add/edit/delete modules
  - Module settings (title, description, order)
- Create `components/courses/VideoAssignmentPanel.tsx`
  - List of available videos
  - Drag videos into modules
  - Remove videos from modules
- Implement drag-drop functionality
  - Reorder modules
  - Reorder videos within modules
  - Move videos between modules
  - Visual drop zones
- Add course settings panel
  - Course title and description
  - Thumbnail upload
  - Visibility settings (published/draft)

**Deliverable:** Interactive course builder

---

#### Agent 3: Student Course Navigation
**Task:** Student-facing course UI
- Create `app/dashboard/student/courses/page.tsx`
  - Course catalog view
  - Grid layout with course cards
  - Filter by topic/difficulty
- Build `app/dashboard/student/courses/[id]/page.tsx`
  - Course overview page
  - Module list with progress indicators
  - Start/continue course CTA
- Create `components/courses/CoursePlayer.tsx`
  - Video player with module navigation
  - "Next Video" button
  - Progress tracking
  - Mark as complete
- Implement video progression tracking
  - Auto-advance to next video (optional)
  - Resume where left off
  - Completion checkmarks
- Build `components/courses/CourseProgress.tsx`
  - Progress bar (% complete)
  - Videos watched / total
  - Time spent in course

**Deliverable:** Student course experience

---

#### Agent 4: Course Analytics
**Task:** Track course performance
- Build course completion tracking in `lib/analytics/course-stats.ts`
  - Completion rate per course
  - Average time to complete
  - Drop-off points (which module students quit)
  - Most popular courses
- Create completion rate charts
  - Funnel: Enrolled → Started → 50% → Completed
  - Completion over time
- Implement per-module engagement
  - Views per module
  - Time spent per module
  - Chat questions per module
- Build `components/analytics/CoursePerformanceWidget.tsx`
  - Add to main analytics dashboard
  - Top performing courses
  - Courses needing improvement
- Add course recommendations
  - Suggest course improvements based on data
  - Identify confusing sections (high chat activity)

**Deliverable:** Course analytics integration

---

### Phase 5 Success Criteria

- [ ] Creators can create courses with modules
- [ ] Drag-drop video assignment works smoothly
- [ ] Students can browse and enroll in courses
- [ ] Video progression tracked accurately
- [ ] Course completion rates visible in analytics
- [ ] Mobile-friendly course navigation

**Timeline:** 4 days | **Agents:** 4 parallel

---

## Phase 6: Polish & Launch (Day 22-28)

**Goal:** Production-ready application with all systems tested

### Agent Assignments (5 parallel agents)

#### Agent 1: Usage Limits & Tiers
**Task:** Implement tier-based restrictions
- Detect Whop subscription tier in `lib/whop/tiers.ts`
  - Free, Starter, Pro, Enterprise (or Whop's tier names)
  - Fetch tier from membership API
- Build rate limiting with Upstash
  - Chat messages per student per day
  - Video uploads per creator per month
  - API request limits
- Create storage quota enforcement
  - Check before upload
  - Reject uploads exceeding quota
  - Display remaining storage
- Add AI credit limits
  - Track credits per tier
  - Deduct on each chat message
  - Warn when approaching limit
- Implement upgrade flows
  - Redirect to Whop subscription page
  - Pass user context for smooth upgrade
  - Sync new tier immediately via webhook

**Deliverable:** Tier management system

---

#### Agent 2: Error Handling & Monitoring
**Task:** Production-grade error handling
- Set up Sentry in `app/global-error.tsx`
  - Capture all unhandled errors
  - Client-side and server-side
  - Source maps for debugging
- Implement React error boundaries
  - Wrap major sections (dashboard, chat, courses)
  - Fallback UI for errors
  - Error reporting to Sentry
- Create fallback UI states
  - Skeleton loaders for async content
  - Empty states (no videos, no courses)
  - Offline states
- Add retry logic everywhere
  - Failed API calls (3 retries with exponential backoff)
  - Failed video processing
  - Failed embeddings generation
- Build status page (optional)
  - System health dashboard
  - API status
  - Recent incidents

**Deliverable:** Production error handling

---

#### Agent 3: Mobile Optimization
**Task:** Ensure mobile experience is excellent
- Optimize dashboard for mobile
  - Responsive charts (Recharts handles this mostly)
  - Touch-friendly controls
  - Collapsible sidebar
- Test all components on mobile
  - iPhone SE (smallest)
  - iPhone 14 Pro
  - Android (Galaxy S22)
  - iPad
- Improve touch interactions
  - Larger tap targets (min 44px)
  - Swipe gestures where appropriate
  - Haptic feedback (optional)
- Optimize video player for mobile
  - Portrait and landscape
  - Picture-in-picture support
  - Mobile-friendly controls
- Test with real devices
  - BrowserStack or similar
  - Fix any mobile-specific bugs

**Deliverable:** Mobile-optimized app

---

#### Agent 4: Whop Webhook Integration
**Task:** Complete webhook handlers
- Implement `membership.created` handler
  - Create student record
  - Send welcome email (optional)
  - Grant course access
  - Log event for analytics
- Build `membership.expired` handler
  - Revoke student access
  - Preserve data (don't delete)
  - Send expiration notification
  - Log for analytics
- Add `payment.succeeded` tracking
  - Log revenue for creator
  - Update subscription tier
  - Sync limits immediately
- Test webhook signature verification
  - Ensure all webhooks validate signatures
  - Reject invalid signatures
  - Log suspicious requests
- Create webhook event logger
  - Store all webhook events
  - Admin panel to view events (optional)
  - Replay events for debugging

**Deliverable:** Production webhook handling

---

#### Agent 5: Performance & Testing
**Task:** Optimize and validate everything
- Run Lighthouse audits
  - Target: 90+ performance score
  - Optimize images (Next.js Image component)
  - Minimize JavaScript bundle
  - Code splitting
- Optimize bundle size
  - Analyze with `@next/bundle-analyzer`
  - Remove unused dependencies
  - Tree-shake libraries
  - Use dynamic imports
- Test video processing pipeline
  - Upload 10 test videos
  - Verify all stages complete
  - Check embedding quality
  - Validate costs
- Load test RAG endpoints
  - Simulate 100 concurrent users
  - Measure response times
  - Identify bottlenecks
  - Optimize slow queries
- Security audit
  - SQL injection tests (parameterized queries)
  - XSS tests (sanitize inputs)
  - CSRF protection
  - Rate limiting verification
  - Secrets not exposed in client

**Deliverable:** Production-ready application

---

### Phase 6 Success Criteria

- [ ] Tier-based limits enforced correctly
- [ ] All errors captured in Sentry
- [ ] Mobile experience excellent on all devices
- [ ] Webhooks tested and working
- [ ] Lighthouse score 90+
- [ ] Security audit passed
- [ ] Load tests successful
- [ ] Ready for production deployment

**Timeline:** 7 days | **Agents:** 5 parallel

---

## Database Schema Details

### 1. creators
```sql
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whop_company_id TEXT UNIQUE NOT NULL,
  whop_user_id TEXT NOT NULL,
  email TEXT,
  company_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, starter, pro, enterprise
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whop_user_id TEXT UNIQUE NOT NULL,
  whop_membership_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. videos
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL, -- Supabase Storage URL
  thumbnail_url TEXT,
  duration INTEGER, -- seconds
  transcript TEXT,
  status TEXT DEFAULT 'pending', -- pending, transcribing, chunking, embedding, completed, failed
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_creator ON videos(creator_id);
CREATE INDEX idx_videos_status ON videos(status);
```

### 4. video_chunks
```sql
CREATE TABLE video_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002
  start_time FLOAT, -- seconds
  end_time FLOAT,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_video ON video_chunks(video_id);
CREATE INDEX idx_chunks_embedding ON video_chunks USING ivfflat (embedding vector_cosine_ops);
```

### 5. courses
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_creator ON courses(creator_id);
```

### 6. course_modules
```sql
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  video_ids UUID[], -- Array of video IDs in order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON course_modules(course_id);
```

### 7. chat_sessions
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON chat_sessions(student_id);
CREATE INDEX idx_sessions_creator ON chat_sessions(creator_id);
```

### 8. chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  video_references JSONB DEFAULT '[]', -- [{video_id, timestamp, relevance_score}]
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);
```

### 9. video_analytics
```sql
CREATE TABLE video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0, -- seconds
  avg_watch_time INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  chat_references INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, date)
);

CREATE INDEX idx_analytics_video_date ON video_analytics(video_id, date);
```

### 10. usage_metrics
```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  videos_uploaded INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  ai_chat_credits_used INTEGER DEFAULT 0,
  transcription_minutes INTEGER DEFAULT 0,
  openai_cost_cents INTEGER DEFAULT 0,
  anthropic_cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, date)
);

CREATE INDEX idx_usage_creator_date ON usage_metrics(creator_id, date);
```

---

## Technology Stack Details

### Core Framework
- **Next.js 14** - App Router with Server Components
- **React 18** - UI library
- **TypeScript** - Type safety

### UI & Styling
- **Frosted UI** - Whop's design system (based on Radix)
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Charts and data visualization
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **react-countup** - Animated number counters

### Data & Backend
- **Supabase** - PostgreSQL database
- **pgvector** - Vector embeddings storage
- **@supabase/supabase-js** - Client library
- **@supabase/ssr** - Server-side rendering support

### AI & ML
- **@anthropic-ai/sdk** - Claude API for chat
- **OpenAI API** - Whisper (transcription) + embeddings
- **Vector similarity search** - RAG implementation

### Authentication & Authorization
- **@whop/api** - Whop SDK
- **@whop/react** - React hooks for Whop

### Infrastructure
- **Inngest** - Background job processing
- **@vercel/kv** - Redis caching (Vercel KV)
- **@upstash/ratelimit** - Rate limiting
- **@sentry/nextjs** - Error tracking
- **Vercel** - Hosting and deployment

### Course Builder
- **@dnd-kit/core** - Drag-and-drop core
- **@dnd-kit/sortable** - Sortable lists

### Utilities
- **zod** - Schema validation
- **date-fns** - Date manipulation

---

## Success Metrics

### Development Metrics
- **Timeline:** 28 days to MVP
- **Code Quality:** 0 TypeScript errors, 0 build warnings
- **Test Coverage:** 70%+ on critical paths
- **Lighthouse Score:** 90+ on all pages

### Technical Metrics
- **Chat Response Time:** <5 seconds (p95)
- **Video Processing:** <5 minutes per hour of video
- **Dashboard Load:** <3 seconds
- **Vector Search:** <2 seconds

### Business Metrics (Post-Launch)
- **Activation:** 80% of creators upload 5+ videos
- **Engagement:** 10+ chat messages per student/week
- **Retention:** 60% course completion rate
- **Quality:** 85%+ thumbs up on AI responses

---

## Risk Mitigation

### Technical Risks

**Risk:** Video processing pipeline fails for long videos (>2 hours)
**Mitigation:** Implement chunked transcription, retry logic, manual review queue

**Risk:** Vector search quality is poor
**Mitigation:** A/B test chunk sizes, overlap amounts, ranking algorithms

**Risk:** Claude API costs exceed budget
**Mitigation:** Aggressive caching, prompt optimization, tier limits

**Risk:** Supabase hits scalability limits
**Mitigation:** Connection pooling, query optimization, consider Neon as alternative

### Development Risks

**Risk:** Agents complete work with bugs
**Mitigation:** Comprehensive testing phase, peer review, integration tests

**Risk:** Phase delays cascade
**Mitigation:** Buffer time in phases 5-6, prioritize core features

---

## Deployment Strategy

### Environment Setup

1. **Development** - Local with Supabase local instance
2. **Staging** - Vercel preview deployments + Supabase staging project
3. **Production** - Vercel production + Supabase production

### Launch Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase production database migrated
- [ ] Whop app registered and OAuth configured
- [ ] Webhooks configured and tested
- [ ] Sentry error tracking active
- [ ] Domain configured (if custom domain)
- [ ] SSL certificates valid
- [ ] Rate limiting configured
- [ ] Tier limits configured per Whop plan
- [ ] Test transactions completed
- [ ] Monitoring dashboards set up

---

## Post-Launch Roadmap

### Phase 7: Iteration (Week 5-8)
- User feedback integration
- Bug fixes from real usage
- Performance optimizations
- Analytics improvements

### Phase 8: Advanced Features (Month 2-3)
- AI quiz generation (from original scope)
- Learning calendar (from original scope)
- Advanced course analytics
- Student collaboration features

### Phase 9: Scale (Month 4-6)
- Multi-language support
- Advanced AI features (practice problems, summaries)
- Creator collaboration (team accounts)
- White-label options for enterprise

---

## Appendix: Salvaged Components from Old Project

These components are well-written and should be migrated:

### UI Components (`components/ui/`)
- Button, Input, Card, Modal, Dropdown, Tooltip
- Badge, Avatar, Tabs, Skeleton, ProgressBar

### Video Components
- `VideoUploader.tsx`
- `VideoPlayer.tsx`
- `VideoList.tsx`
- `ProcessingStatus.tsx`

### Chat Components
- `ChatInterface.tsx`
- `MessageList.tsx`
- `MessageInput.tsx`
- `VideoReferenceCard.tsx`
- `SessionSidebar.tsx`

### Layout Components
- `Header.tsx`
- `Sidebar.tsx`
- `Footer.tsx`
- `MobileMenu.tsx`

### Whop Integration
- `lib/whop/auth.ts`
- `lib/whop/api-client.ts`
- `lib/whop/webhooks.ts`
- `lib/whop/membership.ts`

---

## Questions & Support

For questions during implementation, reference:
- `docs/OLD_PROJECT_AUDIT.md` - What we learned from the original project
- `CLAUDE.md` - Project guidelines and patterns
- Whop Developer Docs: https://docs.whop.com
- Supabase Vector Guide: https://supabase.com/docs/guides/ai/vector-embeddings

---

**Last Updated:** 2025-11-09
**Version:** 1.0
**Status:** Ready for Phase 1 execution
