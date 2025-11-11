# Chronos AI Landing Page - Component Map

**Visual structure of the landing page**

## Page Structure

```
app/page.tsx
├── LandingNav (sticky header)
├── HeroSection (full-screen hero)
├── FeatureGrid (2x2 grid)
├── VideoDemo (video + chapters)
├── InteractiveFAQ (chat demo)
├── CTASection (final conversion)
└── Footer (dark footer)
```

## Component Details

### 1. LandingNav
- **File:** `components/landing/LandingNav.tsx`
- **Position:** Fixed at top (z-50)
- **Height:** 64px (h-16)
- **Behavior:** Sticky with backdrop blur on scroll
- **Mobile:** Hamburger menu overlay
- **Key Features:**
  - Chronos logo with smooth scroll to top
  - "Sign in with Whop" button
  - Animated mobile menu

### 2. HeroSection
- **File:** `components/landing/HeroSection.tsx`
- **Height:** Full viewport (min-h-screen)
- **Animation:** Gradient background pulse
- **CTAs:** 2 buttons (Sign in + Watch Demo)
- **Key Features:**
  - Gradient headline text
  - Chronos mythology messaging
  - Dual action buttons
  - Trust badge

### 3. FeatureGrid
- **File:** `components/landing/FeatureGrid.tsx`
- **Layout:** 2x2 grid (desktop), stack (mobile)
- **Cards:** 4 feature cards with icons
- **Background:** bg-gray-2
- **Key Features:**
  - Clock, Zap, TrendingUp, Sparkles icons
  - Hover scale animations
  - Gradient icon backgrounds

### 4. VideoDemo
- **File:** `components/landing/VideoDemo.tsx`
- **Layout:** 2-column (desktop), stack (mobile)
- **Video:** 16:9 aspect ratio YouTube iframe
- **Chapters:** 8 clickable timestamps
- **Key Features:**
  - YouTube embed
  - Chapter navigation
  - Click-to-seek functionality
  - Video metadata display

### 5. InteractiveFAQ
- **File:** `components/landing/InteractiveFAQ.tsx`
- **Layout:** Chat interface
- **Messages:** 4 pre-populated (2 Q + 2 A)
- **Mode:** Demo only (no API calls)
- **Key Features:**
  - Chronos icon in AI responses
  - User/assistant message styling
  - Disabled input with CTA message

### 6. CTASection
- **File:** `components/landing/CTASection.tsx`
- **Background:** Gradient overlay with animation
- **CTA:** Large "Sign in with Whop" button
- **Badges:** 3 trust indicators
- **Key Features:**
  - Sparkles icon
  - Animated gradient background
  - Trust indicators (free, no CC, 5 min)

### 7. Footer
- **File:** `components/landing/Footer.tsx`
- **Columns:** Brand | Product | Support | Legal
- **Social:** Twitter, GitHub, Email
- **Theme:** Dark (bg-gray-2)
- **Key Features:**
  - Chronos branding
  - Link columns
  - Social icons
  - Whop attribution

---

## Responsive Breakpoints

### Mobile (< 768px)
- Stack all components vertically
- Full-width cards
- Hamburger menu
- Single-column layout

### Tablet (768px - 1440px)
- 2-column layouts appear
- Feature grid shows 2x2
- Video + chapters side-by-side
- Expanded navigation

### Desktop (> 1440px)
- Max-width containers (1280px)
- Optimal spacing and padding
- All columns visible
- Full desktop experience

---

## Color System (Frosted UI Dark Theme)

### Background
- `bg-gray-1` - Darkest (page background)
- `bg-gray-2` - Dark (section backgrounds)
- `bg-gray-3` - Medium dark (cards)

### Text
- `text-gray-12` - Brightest (headings)
- `text-gray-11` - Bright (body text)
- `text-gray-10` - Medium (secondary text)

### Borders
- `border-gray-6` - Subtle borders
- `border-gray-7` - Medium borders

### Gradients
- `from-purple-9 to-blue-9` - Primary gradient
- `from-blue-9 to-cyan-9` - Feature accent
- `from-cyan-9 to-teal-9` - Feature accent
- `from-teal-9 to-purple-9` - Feature accent

---

## Animation System

### Framer Motion Usage

**LandingNav:**
- Slide down animation on mount
- Backdrop blur on scroll
- Mobile menu fade in/out

**HeroSection:**
- Fade in with stagger
- Background gradient pulse
- CTA button hover effects

**All Sections:**
- Fade in when in viewport
- Slide up animation (y: 20)
- Stagger delays for multiple items

**FeatureGrid:**
- Card hover scale (1.02)
- Stagger card animations
- Shadow transitions

**InteractiveFAQ:**
- Message pop-in animation
- Stagger message appearance

---

## Data Flow

### User Actions

**"Sign in with Whop" (multiple CTAs):**
```
Button Click → window.location.href = '/api/whop/oauth'
```

**"Watch Demo" button:**
```
Button Click → Smooth scroll to #demo section
```

**Chapter click:**
```
Click → Update iframe src with timestamp
```

**Logo click:**
```
Click → Smooth scroll to top
```

---

## Integration Points

### Whop OAuth
- `/api/whop/oauth` endpoint
- Used by all "Sign in" buttons

### Video Demo
- YouTube iframe API
- Chapter timestamp seeking

### SEO
- Meta tags in `app/layout.tsx`
- Open Graph tags
- Twitter Cards

---

## File Structure

```
app/
├── page.tsx                    # Main landing page
├── layout.tsx                  # SEO metadata
└── globals.css                 # Global styles

components/landing/
├── LandingNav.tsx              # Navigation
├── HeroSection.tsx             # Hero
├── FeatureGrid.tsx             # Features
├── VideoDemo.tsx               # Video
├── InteractiveFAQ.tsx          # Chat demo
├── CTASection.tsx              # Final CTA
└── Footer.tsx                  # Footer

docs/landing-page/
├── LANDING_PAGE_PLAN.md        # Original plan
├── TASK_TRACKER.md             # Task tracking
├── COMPLETION_REPORT.md        # Final report
└── COMPONENT_MAP.md            # This file
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete
