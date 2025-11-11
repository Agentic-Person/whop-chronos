# Chronos Dashboard Overhaul - Master Plan

**Project:** Creator Dashboard Complete Rebuild
**Start Date:** 2025-01-10
**Status:** In Progress - Wave 0
**Orchestrator:** Active

---

## 🎯 Project Goals

Transform the Chronos creator dashboard from a basic analytics view into a comprehensive course management and analytics platform using Whop's Frosted UI design system.

### Scope: Creator Dashboard Only
- **In Scope:** 5 creator pages (Overview, Courses, Analytics, Usage, Chat)
- **Out of Scope:** Student dashboard (Phase 2)
- **Testing:** Hardcoded test creator ID (no auth changes)

---

## 🏗️ Dashboard Structure

### Current State (Before)
- Overview: Basic analytics with custom components
- Videos: Simple grid, no upload functionality
- Students: Static mock data
- Chat: Static UI only
- Settings: Non-functional form

### Target State (After)
- **Overview:** High-level dashboard ("cliff notes" of all metrics)
- **Courses:** Full course builder with video upload and chapter/lesson organization
- **Analytics:** Deep dive into video performance and student engagement metrics
- **Usage:** Tier limits, billing, rate limiting display
- **Chat:** Polished AI assistant for creator's video library

---

## 📐 Architecture Decisions

### Navigation Structure
5 tabs in creator dashboard:
1. Overview (Dashboard icon) - `/dashboard/creator/overview`
2. Courses (Book icon) - `/dashboard/creator/courses`
3. Analytics (BarChart icon) - `/dashboard/creator/analytics`
4. Usage (Activity icon) - `/dashboard/creator/usage`
5. Chat (MessageSquare icon) - `/dashboard/creator/chat`

**Removed:** Students page (not needed for creator workflow)

### Design System
- **Primary:** Frosted UI (`frosted-ui` package, Radix-based)
- **Reference:** https://storybook.whop.dev + https://github.com/whopio/frosted-ui
- **Charts:** Recharts with Frosted UI color tokens
- **Testing:** Playwright MCP for browser testing as we build

### Key Design Patterns
- Use Frosted UI components exclusively (no custom Tailwind buttons/forms)
- Use Frosted UI design tokens (--gray-1 through --gray-12, etc.)
- Responsive breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)
- Consistent loading states with Frosted UI Skeleton/Spinner
- Consistent empty states with helpful CTAs

---

## 📋 Task Tracking System

### Task States
- **🔵 Pending** - Not started yet
- **🟡 In Progress** - Agent actively working
- **🟢 Complete** - Agent finished + Playwright tests passing
- **✅ Integrated** - User tested + integrated into Whop platform

### Progress Tracking
See `TASK_TRACKER.md` for real-time task states and progress percentage.

---

## 🌊 Wave Structure

### Wave 0: Documentation & Tracking Setup
**Duration:** 5-10 minutes
**Orchestrator Agent Only**

Tasks:
- Create folder structure ✅
- Create CHRONOS_DASHBOARD_OVERHAUL.md (this file) ✅
- Create TASK_TRACKER.md
- Create README.md
- Initialize all agent documentation files

### Wave 1: Foundation (3 Parallel Agents)
**Duration:** 30-45 minutes

Agents:
1. Navigation & Route Cleanup (DashboardNav, delete Students, create Analytics placeholder)
2. Fix Analytics Components (DateRangePicker, RefreshButton, ExportButton with Frosted UI)
3. Playwright Testing Setup (test infrastructure and base suites)

### Wave 2: Page Development (5 Parallel Agents)
**Duration:** 2-3 hours

Agents:
1. Polish Overview Page (make it the "cliff notes" dashboard)
2. Build Courses Page (match design reference with chapter/lesson tree)
3. Build Analytics Page (charts, tables, video performance metrics)
4. Build Usage Page (tier limits, usage meters, comparison table)
5. Polish Chat Page (update with Frosted UI components)

### Wave 3: Testing & Polish (3 Parallel Agents)
**Duration:** 1 hour

Agents:
1. Comprehensive Playwright Testing (all pages, all breakpoints, cross-browser)
2. Accessibility Audit (keyboard nav, ARIA, focus, contrast, screen reader)
3. Final Polish & Bug Fixes (fix all issues from agents 1 & 2)

---

## 📊 Success Criteria

### Functional Requirements
✅ 5 creator pages working perfectly
✅ Overview = High-level dashboard (cliff notes)
✅ Analytics = Deep video/student metrics
✅ Courses page matches design reference (`snips/Sample courses page layout for content creator.jpg`)
✅ Usage page shows tier limits clearly
✅ Chat page polished with Frosted UI
✅ All API integrations working
✅ Navigation consistent across all pages

### Technical Requirements
✅ All components use Frosted UI (no custom Tailwind buttons/forms)
✅ Design tokens used consistently (--gray-*, --accent-*)
✅ Responsive on mobile (375px), tablet (768px), desktop (1440px)
✅ Playwright tests passing for all pages
✅ Accessibility audit passed (WCAG AA)
✅ Error handling and loading states
✅ Empty states for all lists/tables

### Testing Requirements
✅ Playwright MCP tests for each component
✅ Responsive breakpoint testing
✅ Cross-browser testing (Chrome, Firefox, Safari)
✅ Keyboard navigation works
✅ Screen reader compatible

---

## 📁 Documentation Structure

```
docs/dashboard-overhaul/
├── CHRONOS_DASHBOARD_OVERHAUL.md     # This file - master plan
├── TASK_TRACKER.md                   # Real-time task tracking
├── README.md                          # How to use documentation
├── wave-1/
│   ├── agent-1-navigation.md         # Navigation & route cleanup
│   ├── agent-2-analytics-components.md
│   └── agent-3-playwright-setup.md
├── wave-2/
│   ├── agent-1-overview-page.md
│   ├── agent-2-courses-page.md
│   ├── agent-3-analytics-page.md
│   ├── agent-4-usage-page.md
│   └── agent-5-chat-page.md
├── wave-3/
│   ├── agent-1-playwright-testing.md
│   ├── agent-2-accessibility-audit.md
│   └── agent-3-final-polish.md
└── screenshots/
    └── (Playwright test screenshots)
```

---

## 🎯 Orchestrator Agent Responsibilities

### Before Each Wave:
- Create wave folder structure
- Initialize agent documentation files
- Update TASK_TRACKER.md with wave tasks
- Brief agents on their assignments

### During Each Wave:
- Monitor agent progress in real-time
- Update task states in TASK_TRACKER.md
- Coordinate handoffs between agents
- Flag blockers or dependencies
- Ensure agents document their work

### After Each Wave:
- Verify all agents completed tasks
- Confirm Playwright tests passing
- Update TASK_TRACKER.md
- Prepare summary for user review
- Wait for user to mark tasks as "Integrated"

### Throughout:
- Maintain this master plan document
- Track overall progress percentage
- Log issues and blockers
- Coordinate between waves

---

## 📚 Design References

### Provided Design Files
Located in `snips/` directory:

1. **Sample courses page layout for content creator.jpg**
   - Two-panel layout: collapsible chapter/lesson tree on left, video upload/settings on right
   - Chapter structure with expandable lessons
   - Drag handles for reordering
   - "Add new chapter" button
   - File attachments and drip feeding settings

2. **Video page layout and design With AI Chat.jpg**
   - Student view: course list left, video player center, AI chat below video
   - "Chronos Intelligent Chat" interface
   - Sample questions and chat input
   - Navigation tabs: Dashboard, Videos, Usage, Creator

3. **Landing page.jpg**
   - Hero section with video showcase
   - AI chat demo
   - "Sign In with Whop" CTA

### Frosted UI Resources
- **Storybook:** https://storybook.whop.dev
- **GitHub:** https://github.com/whopio/frosted-ui
- **Package:** `frosted-ui@0.0.1-canary.85`
- **Related:** `@whop/react@0.3.0`

---

## ⏱️ Timeline Estimate

- **Wave 0:** 5-10 minutes (Orchestrator)
- **Wave 1:** 30-45 minutes (3 parallel agents)
- **Wave 2:** 2-3 hours (5 parallel agents)
- **Wave 3:** 1 hour (3 parallel agents)

**Total Development Time:** 3.5-4.5 hours

**User Integration Testing:** TBD (after Wave 3 complete)

---

## 🚀 Deployment Notes

- Server running on port 3007
- Hardcoded test creator ID: `00000000-0000-0000-0000-000000000001`
- Whop auth bypassed for testing
- Real Whop OAuth integration = Phase 2

---

## 📝 Notes

- This is Creator Dashboard only - Student Dashboard is Phase 2
- All agents must use Playwright MCP to test as they build
- No commits until user approves each wave
- Documentation is critical - agents must document all work
- User marks tasks as "Integrated" after personal testing in Whop environment

---

## 🔗 Related Documentation

- Project root: `CLAUDE.md`
- Implementation plan: `docs/IMPLEMENTATION_PLAN.md`
- Old project audit: `docs/OLD_PROJECT_AUDIT.md`
- Task tracker: `docs/dashboard-overhaul/TASK_TRACKER.md`

---

**Last Updated:** 2025-01-10 - Wave 0 in progress
**Next Step:** Complete Wave 0 documentation setup, then launch Wave 1
