# Wave 2 - Agent 4: Usage Page (API Monitoring & Billing)

**Agent:** Agent 4
**Wave:** Wave 2 - Page Development
**Status:** 🔵 Pending
**Start Time:** Not started
**End Time:** Not started
**Duration:** TBD

---

## 📋 Assigned Tasks

**Primary Goal:** Transform Settings page into comprehensive Usage & Billing dashboard with transparent API monitoring

**CRITICAL FIX:** Change page title from "Settings" to "Usage" or "Usage & Billing"

**Philosophy:** Very open and transparent for developer monitoring during early stages. Helps track costs and optimize usage.

### 1. API Usage Monitoring - Anthropic (Claude Haiku 4.5)

**Section Title:** "AI Chat API Usage (Anthropic)"

**Current Period Usage:**
- API calls this month (count)
- Total tokens used (input + output)
  - Input tokens (separate display)
  - Output tokens (separate display)
- **Cost calculation display** (real-time)
  - Cost this month ($)
  - Average cost per session ($)
  - Average cost per message ($)
- Usage meter (visual gauge)
  - Show current usage vs. tier limit
  - Color coding: Green → Yellow → Orange → Red (as approaching limit)

**Detailed Breakdown:**
- Table of recent API calls
  - Timestamp
  - Chat session ID
  - Tokens used (input/output)
  - Cost ($)
  - Model used (Claude Haiku 4.5)
- Cost per session breakdown
- Historical cost chart (line graph over time)

**Tier Limits Display:**
- Current plan tier (Free/Starter/Pro/Enterprise)
- AI credits included in plan
- AI credits used
- AI credits remaining
- Reset date (monthly)

**Pricing Information:**
- Claude Haiku 4.5 pricing display:
  - Input: $0.25 per 1M tokens
  - Output: $1.25 per 1M tokens
- Calculator: Estimate cost for X sessions

---

### 2. Storage & Database Monitoring - Supabase

**Section Title:** "Storage & Database Usage (Supabase)"

**Storage Usage:**
- **Total Storage Consumed**
  - Usage meter (visual gauge)
  - GB used / GB limit
  - Percentage used
  - **Cost estimation** ($ per GB)

- **Video Storage Breakdown**
  - Number of videos stored
  - Total video storage (GB)
  - Average video size (MB)
  - Largest videos (top 5)

- **Database Size**
  - Total database size (MB/GB)
  - Growth rate (MB per week)
  - Estimated time to limit

**Vector Database (pgvector):**
- **Embeddings Stored**
  - Number of video chunk embeddings
  - Total embedding storage (MB)
  - **Cost estimation**

- **Access Frequency**
  - Vector searches per day/week/month
  - Average search time (ms)
  - **Cost per 1000 searches**

**Query Volume Tracking:**
- Database queries this month
- Average queries per day
- Peak query times
- Slow queries (> 1s)

**Supabase Tier Info:**
- Current plan (Free/Pro)
- Storage limit
- Bandwidth limit
- Database size limit
- API requests included
- Upgrade prompt if approaching limits

**Real-time Cost Tracking:**
- Estimated monthly Supabase cost ($)
- Breakdown by service:
  - Storage cost
  - Database cost
  - Bandwidth cost
  - API requests cost

---

### 3. Embedding & Vectorization - OpenAI (Ada-002)

**Section Title:** "Embeddings API Usage (OpenAI)"

**Embedding Generation:**
- Total embeddings created this month
- Transcripts processed (count)
- Video chunks vectorized (count)
- **Token usage** for embeddings
  - Model: text-embedding-ada-002
  - Tokens processed
  - **Cost calculation** ($0.02 per 1M tokens... wait, need to verify current pricing)

**Cost Breakdown:**
- Embedding API calls
- Total tokens processed
- **Cost this month** ($)
- Average cost per video transcription
- Average cost per 1000 chunks

**Processing Stats:**
- Videos processed this month
- Average processing time per video
- Queue status (pending transcriptions)
- Failed processing attempts

**Historical Data:**
- Embedding costs over time (chart)
- Processing volume trends

---

### 4. Visual Requirements (Cool Meters & Graphics)

**Usage Meters/Gauges:**
- Circular progress gauges for percentages
- Horizontal bar meters with color gradients
- Animated filling effects
- Real-time updates (or near-real-time)

**Color Coding:**
- 0-50%: Green (safe)
- 50-75%: Yellow (moderate)
- 75-90%: Orange (high)
- 90-100%: Red (critical)

**Charts & Visualizations:**
- Line charts for cost trends over time
- Bar charts for comparing different API costs
- Pie chart for cost distribution (Anthropic vs Supabase vs OpenAI)
- Stacked area chart for cumulative costs

**Graphics Suggestions:**
- Use Recharts for charts
- Use Frosted UI Progress component for meters
- Custom gauge components for circular meters
- Consider `react-circular-progressbar` or similar for cool gauge effects
- Animated counters for large numbers (count-up effect)

---

### 5. Tier Limits & Comparison

**Current Plan Display:**
- Plan name (Free/Starter/Pro/Enterprise)
- Monthly cost
- What's included:
  - Storage limit (GB)
  - AI credits
  - Video processing limit
  - Student limit
  - Features included

**Usage vs. Limits Table:**
| Resource | Used | Limit | Percentage | Status |
|----------|------|-------|------------|--------|
| Storage | 5 GB | 10 GB | 50% | 🟢 Good |
| AI Credits | 750 | 1000 | 75% | 🟠 High |
| Videos | 25 | 50 | 50% | 🟢 Good |

**Plan Comparison Table:**
- Show all available tiers
- Highlight current plan
- "Upgrade" button for higher tiers
- Feature comparison matrix

---

### 6. Cost Optimization Recommendations

**Smart Suggestions:**
- "You're using mostly Haiku (cheap) - great choice!"
- "Consider upgrading to Pro for 50% more storage"
- "High embedding costs detected - batch processing could help"
- "AI credit usage spiking - investigate chat bot loops"

**Cost Projections:**
- Estimated cost end of month (based on current usage)
- Projected overage charges if any
- Savings recommendations

---

### 7. Developer Tools (Optional)

**API Keys Management:**
- View API keys (masked)
- Regenerate keys
- Usage by key

**Webhooks:**
- Configured webhooks
- Webhook logs
- Test webhook endpoint

**Rate Limiting:**
- Current rate limits
- Recent rate limit hits
- Adjust limits (if allowed)

---

## 📁 Files to Modify

- `app/dashboard/creator/usage/page.tsx`
  - [ ] **CRITICAL:** Change title from "Settings" to "Usage"
  - [ ] Remove or redesign current settings content
  - [ ] Implement 3 main API monitoring sections
  - [ ] Add visual meters and charts
  - [ ] Add tier limits display
  - [ ] Add cost projections
  - [ ] Responsive design
  - [ ] Real-time or periodic data refresh

---

## 🎨 Frosted UI Components to Use

- `Card` - Section containers
- `Progress` - Usage meters
- `Badge` - Status indicators
- `Button` - Upgrade, refresh actions
- `Table` - API call logs, limits table
- `Tabs` - Switch between different API services
- `Tooltip` - Explain metrics
- `Alert` - Warnings when approaching limits
- `Skeleton` - Loading states
- Design tokens: `--gray-*`, `--accent-*`, color scales

### Additional Libraries for Visualizations
- **Recharts** - Charts (already installed)
- **react-circular-progressbar** - Circular gauges (may need to install)
- **framer-motion** - Animations (optional, already installed)
- **countup.js** or similar - Animated number counters

---

## 🧪 Playwright Tests Required (MANDATORY)

### Test 1: Usage Page Loads
- [ ] Navigate to /dashboard/creator/usage
- [ ] Verify title says "Usage" not "Settings"
- [ ] Verify all 3 API sections visible
- [ ] No console errors
- **Result:** PENDING

### Test 2: Anthropic Section
- [ ] Verify API call count displays
- [ ] Verify token usage displays
- [ ] Verify cost calculation shows
- [ ] Check usage meter renders
- [ ] Verify color coding (green/yellow/orange/red)
- **Result:** PENDING

### Test 3: Supabase Section
- [ ] Verify storage meter displays
- [ ] Verify storage breakdown shows
- [ ] Verify vector DB stats show
- [ ] Check query volume displays
- [ ] Verify cost estimation
- **Result:** PENDING

### Test 4: OpenAI Section
- [ ] Verify embedding count displays
- [ ] Verify token usage shows
- [ ] Verify cost breakdown displays
- [ ] Check processing stats
- **Result:** PENDING

### Test 5: Charts Render
- [ ] Verify cost trend charts display
- [ ] Verify pie chart for cost distribution
- [ ] Hover over data points
- [ ] Check tooltips show correctly
- **Result:** PENDING

### Test 6: Usage Meters Visual
- [ ] Check circular gauges render
- [ ] Check horizontal bars render
- [ ] Verify color coding matches usage level
- [ ] Check animations work
- **Result:** PENDING

### Test 7: Tier Limits Table
- [ ] Verify limits table displays
- [ ] Check all resources listed
- [ ] Verify percentage calculations correct
- [ ] Check status indicators
- **Result:** PENDING

### Test 8: Plan Comparison
- [ ] Verify plan comparison table shows
- [ ] Check current plan highlighted
- [ ] Test "Upgrade" button
- **Result:** PENDING

### Test 9: Real-time Updates
- [ ] Verify data refreshes periodically
- [ ] Or verify manual refresh button works
- [ ] Check loading states during refresh
- **Result:** PENDING

### Test 10: Responsive Design
- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1440px (desktop)
- [ ] Meters adapt to screen size
- [ ] Tables scroll horizontally on mobile
- **Result:** PENDING

---

## 📸 Screenshots (MANDATORY - Use Playwright MCP!)

**Naming Convention:** `wave-2-agent-4-usage-[feature]-[viewport].png`

Screenshots to capture:
- [ ] Full usage dashboard - desktop
- [ ] Anthropic section - desktop
- [ ] Supabase section - desktop
- [ ] OpenAI section - desktop
- [ ] Usage meters - close-up
- [ ] Cost trend charts - desktop
- [ ] Tier limits table - desktop
- [ ] Plan comparison - desktop
- [ ] Mobile view (375px) - full page
- [ ] Loading state with skeletons

---

## 🚨 Issues Encountered

*Document any issues here as they arise*

---

## 🔗 Dependencies

- **Anthropic API usage tracking** - `usage_metrics` table or Anthropic API dashboard
- **Supabase metrics** - Supabase dashboard API or database queries
- **OpenAI usage tracking** - OpenAI API usage endpoint
- **Cost calculation functions** - `lib/rag/cost-calculator.ts` (already exists!)
- **Recharts** - For charts (already installed)
- **Tier/plan data** - From Whop or app config
- **Real-time data** - May need WebSocket or polling

---

## ✅ Completion Checklist

- [ ] Page title changed to "Usage"
- [ ] All 3 API monitoring sections implemented
- [ ] Anthropic cost tracking working
- [ ] Supabase storage monitoring working
- [ ] OpenAI embedding cost tracking working
- [ ] Visual meters and gauges implemented
- [ ] Charts displaying cost trends
- [ ] Tier limits table functional
- [ ] Plan comparison working
- [ ] Cost projections displaying
- [ ] All components use Frosted UI
- [ ] Responsive design verified
- [ ] All Playwright tests passing
- [ ] Screenshots saved
- [ ] Real-time or periodic refresh working
- [ ] No console errors
- [ ] Code follows project patterns
- [ ] Ready for integration testing

---

## 📝 Implementation Notes

### Before Starting
- Review existing `lib/rag/cost-calculator.ts` functions
- Check `usage_metrics` table schema in database
- Research Anthropic API for usage data retrieval
- Check Supabase API for project metrics
- Verify OpenAI API usage endpoints
- Plan data refresh strategy (real-time vs. periodic)

### API Pricing (Current - Verify!)
**Anthropic Claude Haiku 4.5:**
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens

**OpenAI text-embedding-ada-002:**
- $0.02 per 1M tokens (VERIFY - pricing may have changed)

**Supabase:**
- Free tier: 500 MB storage, 2 GB bandwidth, 500 MB database
- Pro tier: $25/month base + usage overages
- Storage: $0.021 per GB/month

### Data Fetching Strategy
- **Real-time:** WebSocket or Server-Sent Events for live updates
- **Periodic:** Fetch every 5-10 minutes with SWR or React Query
- **On-demand:** Manual refresh button
- Cache API usage data for performance

### Calculation Logic
Use existing `lib/rag/cost-calculator.ts`:
```typescript
import { calculateChatCost, calculateEmbeddingCost } from '@/lib/rag/cost-calculator';

// Calculate Anthropic costs
const anthropicCost = calculateChatCost(inputTokens, outputTokens, 'claude-3-5-haiku-20241022');

// Calculate OpenAI embedding costs
const embeddingCost = calculateEmbeddingCost(tokensProcessed);
```

### During Implementation
- **USE PLAYWRIGHT MCP** - Test meters and charts as you build
- Start with one API section at a time
- Use mock data initially for faster iteration
- Test calculations with known values
- Verify color coding thresholds
- Check performance with large datasets

### After Completion
- Full usage dashboard walkthrough
- Verify all calculations are accurate
- Test with different usage levels (low, medium, high, over limit)
- Check responsiveness of charts and meters
- Performance audit
- Mobile testing on actual device

---

## 🎯 Success Criteria

✅ Page title says "Usage" not "Settings"
✅ All 3 API services monitored (Anthropic, Supabase, OpenAI)
✅ Cost calculations are accurate and transparent
✅ Visual meters and gauges look great
✅ Charts show cost trends clearly
✅ Tier limits clearly displayed with status indicators
✅ Plan comparison helps users understand options
✅ Responsive on all screen sizes
✅ Data refreshes automatically or on-demand
✅ All Playwright tests passing with browser verification
✅ Provides developer-friendly transparency
✅ Helps creators understand and optimize costs

---

## 💡 MCP Server Recommendations

**For Advanced Monitoring (Optional):**
- **Vercel MCP** - If deployed on Vercel, can get deployment metrics
- **Supabase MCP** - Already have it! Can use for project stats
- **Anthropic MCP** - If available, for usage dashboards
- **Generic monitoring MCP** - Like Datadog, New Relic if needed

**Note:** Start without additional MCPs, add only if needed for better monitoring.
