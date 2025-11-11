# Chronos AI Landing Page - Implementation Plan

**Version:** 1.0
**Date:** 2025-11-10
**Status:** Planning Complete - Ready for Execution
**Live Reference:** https://chronos-ai.app/

---

## 🎯 Project Objective

Build a landing page matching the live site's layout and content structure, but styled with **Frosted UI design system** components and patterns. The page will serve as the primary conversion funnel for Whop creators.

---

## 📋 Requirements Summary

### Design Requirements
- **Match live site layout** (https://chronos-ai.app/)
- **Use Frosted UI components** (buttons, cards, inputs)
- **Dark theme** with purple-to-blue gradients
- **Responsive design** (mobile-first approach)
- **Smooth animations** using Framer Motion
- **Lucide icons** for visual elements

### Technical Requirements
- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS + Frosted UI v0.0.1-canary.85
- **Fonts:** Geist Sans & Geist Mono (already configured)
- **Testing:** Playwright MCP for browser testing
- **Performance:** < 3 seconds load time

---

## 🏗️ Architecture Overview

### Component Structure

```
app/
└── page.tsx                              # Landing page assembly

components/
└── landing/
    ├── LandingNav.tsx                   # Navigation header
    ├── HeroSection.tsx                  # Hero with headline & CTAs
    ├── VideoDemo.tsx                    # Video player with chapters
    ├── InteractiveFAQ.tsx               # AI chat demo (adapted from ChatInterface)
    ├── FeatureGrid.tsx                  # 4 feature cards
    ├── CTASection.tsx                   # Final conversion section
    └── Footer.tsx                       # Modified from existing

docs/landing-page/
├── LANDING_PAGE_PLAN.md                 # This file
├── TASK_TRACKER.md                      # Live task tracking
└── agents/
    ├── agent-01-landing-nav.md
    ├── agent-02-hero-section.md
    ├── agent-03-video-demo.md
    ├── agent-04-cta-section.md
    ├── agent-05-feature-grid.md
    ├── agent-06-interactive-faq.md
    ├── agent-07-footer.md
    ├── agent-08-page-integration.md
    └── agent-09-seo-metadata.md
```

---

## 🎨 Design System Specifications

### Color Palette
- **Background:** Dark theme (#0a0a0a, #111)
- **Primary Gradient:** Purple to Blue (#8b5cf6 → #3b82f6)
- **Accent:** Orange (#ff6b35 for CTAs)
- **Text:** White (#fff) and Gray (#9ca3af)
- **Borders:** Frosted glass effect with subtle borders

### Typography
- **Headings:** Geist Sans (font-weight: 700-900)
- **Body:** Geist Sans (font-weight: 400-500)
- **Monospace:** Geist Mono (for timestamps, code)
- **Font Sizes:**
  - Hero H1: 3.5rem (desktop), 2.5rem (mobile)
  - Section H2: 2.5rem (desktop), 2rem (mobile)
  - Body: 1rem (16px base)

### Spacing System
- **Section Padding:** py-24 (desktop), py-16 (mobile)
- **Container Max Width:** 1280px
- **Grid Gaps:** gap-8 (desktop), gap-6 (mobile)

### Component Variants
- **Buttons:** Primary (orange), Secondary (outline), Ghost
- **Cards:** Elevated with backdrop blur, border, shadow
- **Inputs:** Dark with border focus states

---

## 📦 Component Specifications

### 1. LandingNav (Agent 1)
**File:** `components/landing/LandingNav.tsx`

**Features:**
- Sticky navigation with backdrop blur
- Chronos logo (left) + "Sign in with Whop" button (right)
- Responsive mobile menu (hamburger icon)
- Smooth scroll to sections

**Design:**
```tsx
// Desktop: flex justify-between
// Logo: Chronos icon + "CHRONOS AI" text
// Button: Frosted UI primary button with Whop branding
// Mobile: Hamburger menu, full-screen overlay
```

**Testing Requirements:**
- [ ] Sticky scroll behavior
- [ ] Mobile menu toggle
- [ ] Button hover states
- [ ] Logo click scrolls to top

---

### 2. HeroSection (Agent 2)
**File:** `components/landing/HeroSection.tsx`

**Features:**
- Centered hero layout
- Headline: "Reclaim Your Time. Chronos Is Your AI Teaching Assistant."
- Subheadline with Chronos mythology metaphor
- Dual CTAs: "Sign in with Whop" + "Watch Demo"
- Animated gradient background

**Design:**
```tsx
// Layout: Centered vertical stack
// Headline: text-6xl font-black with gradient
// Subheadline: text-xl text-gray-400
// CTAs: Flex row with gap-4
// Background: Animated gradient with Framer Motion
```

**Testing Requirements:**
- [ ] Headline gradient animation
- [ ] CTA buttons clickable
- [ ] Responsive text sizing
- [ ] Background animation smooth

---

### 3. VideoDemo (Agent 3)
**File:** `components/landing/VideoDemo.tsx`

**Features:**
- Embedded YouTube video player
- Video: "How To Make $100,000 Per Month With Whop"
- Chapter timestamps with click-to-seek
- Video metadata display

**Design:**
```tsx
// Layout: Grid with video (left) and chapters (right)
// Video: 16:9 aspect ratio, rounded corners
// Chapters: List with timestamps (0:00•2:30 format)
// Hover: Chapter highlight effect
```

**Testing Requirements:**
- [ ] Video plays correctly
- [ ] Chapter clicks seek to timestamp
- [ ] Responsive layout (stack on mobile)
- [ ] Aspect ratio maintained

---

### 4. FeatureGrid (Agent 5)
**File:** `components/landing/FeatureGrid.tsx`

**Features:**
- 4 feature cards in 2x2 grid
- Each card: icon, headline, description
- Cards from live site:
  1. "Stop Selling Your Hours to Student Support"
  2. "Let the God of Time Manage Your Course"
  3. "Your Courses Work 24/7 Without You"
  4. "Turn Passive Hours Into Profit"

**Design:**
```tsx
// Grid: grid-cols-1 md:grid-cols-2 gap-6
// Card: Frosted UI Card with icon (Lucide), heading, body text
// Icons: Clock, Zap, TrendingUp, DollarSign (Lucide)
// Hover: Subtle scale and shadow transition
```

**Testing Requirements:**
- [ ] Grid responsive layout
- [ ] Card hover animations
- [ ] Icons display correctly
- [ ] Text readability

---

### 5. InteractiveFAQ (Agent 6)
**File:** `components/landing/InteractiveFAQ.tsx`

**Features:**
- "Ask ChronosAI" interface
- Adapted from existing `ChatInterface.tsx`
- Pre-populated demo Q&A
- Chronos icon in responses
- Example Q: "How long does it take to set up a Whop account?"

**Design:**
```tsx
// Layout: Chat interface with input and messages
// Messages: User (right aligned), AI (left aligned with icon)
// Input: Frosted UI input with send button
// Demo Mode: Show pre-populated conversation
```

**Testing Requirements:**
- [ ] Chat interface displays correctly
- [ ] Demo messages visible
- [ ] Input field styled correctly
- [ ] Responsive on mobile

---

### 6. CTASection (Agent 4)
**File:** `components/landing/CTASection.tsx`

**Features:**
- Final conversion section
- Headline: "Ready to Transform Your Content?"
- Subheadline with value proposition
- Primary CTA: "Sign in with Whop"

**Design:**
```tsx
// Layout: Centered vertical stack with gradient background
// Headline: text-5xl font-bold
// CTA: Large Frosted UI primary button
// Background: Purple-to-blue gradient
```

**Testing Requirements:**
- [ ] CTA button prominent
- [ ] Gradient background smooth
- [ ] Button hover effects
- [ ] Responsive layout

---

### 7. Footer (Agent 7)
**File:** `components/landing/Footer.tsx` (modified from existing)

**Features:**
- Modify existing `components/layout/Footer.tsx` for landing page
- Keep existing links and structure
- Add landing page specific styling

**Testing Requirements:**
- [ ] Footer displays correctly
- [ ] Links functional
- [ ] Responsive layout
- [ ] Dark theme consistent

---

### 8. Page Integration (Agent 8)
**File:** `app/page.tsx`

**Features:**
- Assemble all landing page components
- Add Framer Motion scroll animations
- Implement smooth scrolling
- Add page-level layout

**Design:**
```tsx
// Structure:
// <LandingNav />
// <HeroSection />
// <FeatureGrid />
// <VideoDemo />
// <InteractiveFAQ />
// <CTASection />
// <Footer />
```

**Testing Requirements:**
- [ ] All sections render in order
- [ ] Scroll animations smooth
- [ ] No layout shifts
- [ ] Performance < 3 seconds load

---

### 9. SEO Metadata (Agent 9)
**File:** `app/layout.tsx`

**Features:**
- Update metadata for SEO
- Add Open Graph tags
- Add Twitter Card tags
- Configure favicon

**Metadata:**
```typescript
title: "Chronos AI - Your AI Teaching Assistant | Transform Video Courses"
description: "Save 10+ hours/week in student support. AI-powered chat, automated transcription, and comprehensive analytics for Whop creators."
keywords: "AI teaching assistant, video learning, Whop creators, course automation, student support"
```

**Testing Requirements:**
- [ ] Meta tags present in HTML
- [ ] Open Graph preview correct
- [ ] Favicon displays
- [ ] Title shows in browser tab

---

## 🚀 Parallel Agent Execution Strategy

### Phase 1: Foundation Components (4 agents - simultaneous)
**Launch Time:** T+0

- **Agent 1:** LandingNav (30 min)
- **Agent 2:** HeroSection (30 min)
- **Agent 3:** VideoDemo (45 min)
- **Agent 4:** CTASection (20 min)

### Phase 2: Content Sections (3 agents - simultaneous)
**Launch Time:** T+45 (after Phase 1 completion)

- **Agent 5:** FeatureGrid (30 min)
- **Agent 6:** InteractiveFAQ (40 min)
- **Agent 7:** Footer (15 min)

### Phase 3: Integration & Testing (2 agents - simultaneous)
**Launch Time:** T+90 (after Phase 2 completion)

- **Agent 8:** Page Integration (30 min)
- **Agent 9:** SEO Metadata (15 min)

**Total Estimated Time:** 2 hours (vs 6+ hours sequential)

---

## 🧪 Testing Strategy

### Playwright MCP Testing (ui.mcp.json)

Each agent must verify their component using Playwright before marking as complete:

**Test Checklist:**
- [ ] Component renders without errors
- [ ] Responsive breakpoints (375px, 768px, 1440px)
- [ ] Dark theme consistency
- [ ] Interactive elements functional (buttons, links, inputs)
- [ ] Animations smooth and performant
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

**Playwright Test Commands:**
```bash
# Start dev server
npm run dev

# Navigate to landing page
playwright_navigate({ url: "http://localhost:3000" })

# Take screenshots at breakpoints
playwright_screenshot({ name: "landing-mobile", width: 375, height: 667 })
playwright_screenshot({ name: "landing-tablet", width: 768, height: 1024 })
playwright_screenshot({ name: "landing-desktop", width: 1440, height: 900 })

# Test interactions
playwright_click({ selector: "[data-testid='cta-button']" })
playwright_fill({ selector: "input", value: "Test query" })
```

---

## 📊 Task States & Workflow

### State Definitions

| State | Symbol | Description |
|-------|--------|-------------|
| Pending | 📋 | Task not started |
| In Progress | 🔄 | Agent actively working |
| Completed | ✅ | Built & tested with Playwright |
| Integrated | 🚀 | User tested & deployed to live site |

### State Transitions

```
📋 Pending
    ↓ (agent starts)
🔄 In Progress
    ↓ (component built + Playwright tests pass)
✅ Completed
    ↓ (user tests manually + verifies on live site)
🚀 Integrated
```

### Completion Criteria

**✅ Completed Requirements:**
1. Component code written
2. Frosted UI components used
3. Responsive design implemented
4. Playwright tests pass (all breakpoints)
5. No console errors
6. Agent documentation updated

**🚀 Integrated Requirements:**
1. User manually tested component
2. Verified on staging/live environment
3. No visual regressions
4. Performance meets requirements
5. User approves functionality

---

## 📁 Asset Requirements

### Images
- Chronos logo: `public/images/chronos_icon.png` ✅ (exists)
- Chronos icon variants: 512px, 128px ✅ (exists)
- Favicon: `public/images/chronos_FAV.png` ✅ (exists)

### Videos
- YouTube video ID: Extract from live site
- Video title: "How To Make $100,000 Per Month With Whop"
- Duration: 24:00
- Chapters: Need to extract from live site

### Content Copy
- Extract all copy from live site: https://chronos-ai.app/
- Store in component files or constants file

---

## 🔧 Configuration Files

### Required Updates

**tailwind.config.ts:**
- Verify Frosted UI plugin configured
- Add custom animations if needed
- Extend color palette with brand colors

**next.config.mjs:**
- Add YouTube domain to image domains
- Configure environment variables

**.env.local:**
```bash
NEXT_PUBLIC_YOUTUBE_API_KEY=<if needed>
```

---

## ✅ Pre-Launch Checklist

### Before Agent Execution
- [x] Documentation structure created
- [x] TASK_TRACKER.md initialized
- [x] Agent documentation templates created
- [ ] Dev server running (`npm run dev`)
- [ ] Playwright MCP configured (ui.mcp.json)

### After Agent Execution
- [ ] All 9 agents completed
- [ ] All Playwright tests passed
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Lighthouse score > 90
- [ ] User manually tested
- [ ] Ready for deployment

---

## 🚨 Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent dependency conflicts | Medium | Phase execution ensures proper order |
| Playwright tests timeout | Low | Increase timeout limits, retry failed tests |
| Component styling inconsistencies | Medium | Establish Frosted UI patterns early |
| Video embedding issues | Low | Use proven YouTube iframe API |
| Performance regressions | Medium | Monitor bundle size, use lazy loading |

---

## 📞 Support & Resources

### Documentation
- Frosted UI Storybook: https://storybook.whop.dev
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion/

### Internal References
- CLAUDE.md: Project guidelines
- IMPLEMENTATION_PLAN.md: Master blueprint
- OLD_PROJECT_AUDIT.md: Lessons learned

---

## 🎉 Success Criteria

**Landing page is complete when:**
1. ✅ All 9 agents completed and tested
2. ✅ All components use Frosted UI design system
3. ✅ Responsive design verified at all breakpoints
4. ✅ Playwright tests passing for all components
5. ✅ Performance metrics met (< 3s load time)
6. ✅ User manually tested and approved
7. 🚀 Deployed to production at https://chronos-ai.app/

---

**Document Maintained By:** Orchestrator Agent
**Last Updated:** 2025-11-10
**Next Review:** After Phase 1 completion
