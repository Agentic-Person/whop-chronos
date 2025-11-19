# Accessibility Testing Guide

**Project:** Chronos AI
**Purpose:** Step-by-step guide for testing accessibility compliance
**Target:** WCAG 2.1 Level AA

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Keyboard Navigation Testing](#keyboard-navigation-testing)
3. [Screen Reader Testing](#screen-reader-testing)
4. [Visual Testing](#visual-testing)
5. [Automated Testing](#automated-testing)
6. [Common Issues and Fixes](#common-issues-and-fixes)

---

## Quick Start

### Prerequisites

**Install Testing Tools:**

1. **Screen Reader (Choose one)**
   - **Windows:** NVDA (free) - https://www.nvaccess.org/download/
   - **Mac:** VoiceOver (built-in) - Enable with Cmd+F5
   - **Linux:** Orca (free) - Pre-installed on most distros

2. **Browser Extensions**
   - axe DevTools: [Chrome](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)
   - WAVE: [Chrome](https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/)

3. **Command Line Tool (Optional)**
   ```bash
   npm install -g pa11y pa11y-ci
   ```

### 5-Minute Accessibility Check

Run this quick test before every deployment:

```bash
# 1. Start development server
npm run dev

# 2. Run automated scan
pa11y http://localhost:3007 --standard WCAG2AA

# 3. Check key pages
pa11y http://localhost:3007/dashboard/creator/overview
pa11y http://localhost:3007/dashboard/student/courses

# 4. Manual keyboard test (see section below)

# 5. Quick screen reader test (see section below)
```

---

## Keyboard Navigation Testing

### Why This Matters

~15% of users navigate without a mouse due to:
- Motor disabilities
- Keyboard-first workflows (developers, power users)
- Broken or unavailable mouse
- Touch device users with external keyboards

### Basic Keyboard Testing (10 minutes)

**Test Every Page:**

#### 1. Skip Link Test
```
Actions:
1. Load page
2. Press Tab once
3. Verify skip link appears
4. Press Enter
5. Verify focus jumps to main content

Expected Result:
✅ Skip link visible with blue background
✅ Pressing Enter skips navigation
✅ Focus indicator on main content area
```

#### 2. Full Page Navigation
```
Actions:
1. Press Tab repeatedly through entire page
2. Watch focus indicator (blue outline)
3. Verify all interactive elements receive focus
4. Check focus order is logical (top-to-bottom, left-to-right)

Expected Result:
✅ Every button, link, input is reachable
✅ Focus indicator clearly visible
✅ No keyboard traps (can't get stuck)
✅ Order makes sense
```

#### 3. Modal Focus Management
```
Actions:
1. Open any modal with keyboard (Tab + Enter)
2. Press Tab multiple times
3. Try to tab outside modal
4. Press Escape

Expected Result:
✅ Modal opens when activated
✅ Focus trapped inside modal
✅ Can't tab out of modal
✅ Escape closes modal
✅ Focus returns to trigger button
```

#### 4. Form Interaction
```
Actions:
1. Tab to first form field
2. Type in each field
3. Use arrow keys in dropdowns/radios
4. Press Enter to submit

Expected Result:
✅ Can enter all fields
✅ Can select radio/checkbox options
✅ Can navigate dropdowns
✅ Form submits on Enter
```

### Video Player Keyboard Testing (5 minutes)

**Test Video Controls:**

```
Test Playback:
1. Navigate to video player
2. Press Space - Should play/pause
3. Press K - Should play/pause
4. Press ? - Keyboard shortcuts modal appears

Test Navigation:
1. Press ← (left arrow) - Seek backward 5s
2. Press → (right arrow) - Seek forward 5s
3. Press J - Seek backward 10s
4. Press L - Seek forward 10s
5. Press 0-9 - Jump to 0-90%
6. Press Home - Jump to start
7. Press End - Jump to end

Test Volume:
1. Press ↑ (up arrow) - Volume increases
2. Press ↓ (down arrow) - Volume decreases
3. Press M - Mutes/unmutes

Test Other:
1. Press F - Fullscreen toggle
2. Press C - Toggle captions (if available)
3. Press Esc - Exit fullscreen

Expected Results:
✅ All shortcuts work
✅ Visual feedback for each action
✅ No conflicts with browser shortcuts
✅ Works even when video not focused
```

### Common Keyboard Issues

**❌ Problem: Can't see focus indicator**
```
Fix: Check app/globals.css has focus-visible styles
Verify: Blue outline appears on Tab
```

**❌ Problem: Keyboard trapped in modal**
```
Fix: Ensure Modal component uses FocusTrap
Verify: Escape key closes modal
```

**❌ Problem: Skip link doesn't work**
```
Fix: Add id="main-content" to main element
Fix: Ensure SkipLink href matches id
Verify: Clicking skip link jumps to content
```

---

## Screen Reader Testing

### NVDA (Windows) Quick Start

**Enable NVDA:**
```
1. Download from https://www.nvaccess.org/download/
2. Install and run
3. NVDA will start speaking immediately
4. Use Ctrl to stop speaking
```

**Basic Commands:**
```
Ctrl           - Stop reading
Insert+Down    - Read all (from cursor)
Insert+T       - Read window title
Insert+F7      - List of elements
H              - Next heading
K              - Next link
B              - Next button
F              - Next form field
```

### VoiceOver (Mac) Quick Start

**Enable VoiceOver:**
```
Cmd+F5         - Toggle VoiceOver
Ctrl+Option    - VoiceOver modifier key (VO)
```

**Basic Commands:**
```
VO+A           - Start reading
VO+Right Arrow - Next item
VO+Space       - Activate item
VO+H           - Next heading
VO+U           - Web rotor (elements list)
```

### Screen Reader Testing Checklist

#### Homepage Test (5 minutes)
```
1. Start screen reader
2. Navigate to homepage
3. Listen to page title - Is it descriptive?
4. Press H repeatedly - Are headings in order (h1, h2, h3)?
5. Press L repeatedly - Do links make sense out of context?
6. Press B repeatedly - Are button labels clear?
7. Press F repeatedly - Do form fields have labels?

Expected Results:
✅ Page title announced
✅ All headings present and in order
✅ Links describe their destination
✅ Buttons describe their action
✅ Form labels associated with inputs
```

#### Skip Link Test
```
1. Load page
2. Press Tab
3. Listen to announcement

Expected:
✅ Screen reader says "Skip to main content, link"
✅ Pressing Enter jumps to main content
✅ Announces "main" landmark or heading
```

#### Modal Test
```
1. Navigate to modal trigger button
2. Activate button (Space or Enter)
3. Listen to announcement
4. Navigate within modal
5. Close modal

Expected Results:
✅ Modal opening announced: "Dialog, Edit Profile"
✅ Modal title announced
✅ Can navigate all modal content
✅ Escape key closes modal
✅ Announces modal closed
✅ Focus returns to trigger
```

#### Image Test
```
1. Navigate to any page with images
2. Listen to image descriptions

Expected Results:
✅ All images have alt text
✅ Decorative images skipped (alt="")
✅ Functional images describe purpose
✅ Complex images have detailed descriptions
```

### Screen Reader Testing Script

**Save this as test-sr.md and run through it:**

```markdown
# Screen Reader Test Script

Page: _______________
Date: _______________
Tool: NVDA / VoiceOver / JAWS

## Test Results

### Page Structure
- [ ] Page title is descriptive
- [ ] Headings in logical order (h1 → h2 → h3)
- [ ] Landmarks present (header, nav, main, footer)
- [ ] Skip link announced and works

### Content
- [ ] All images have alt text
- [ ] Links describe destination
- [ ] Buttons describe action
- [ ] No "click here" or "read more" without context

### Forms
- [ ] All inputs have labels
- [ ] Error messages announced
- [ ] Required fields indicated
- [ ] Helpful instructions provided

### Interactive Elements
- [ ] Modals announced when opened
- [ ] Focus trapped in modals
- [ ] Videos have accessible controls
- [ ] Dropdowns work with arrow keys

### Issues Found
1. _________________________________
2. _________________________________
3. _________________________________
```

---

## Visual Testing

### Color Contrast Testing

**Use WebAIM Contrast Checker:**
https://webaim.org/resources/contrastchecker/

**Minimum Ratios (WCAG AA):**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

**Quick Visual Test:**
```
1. Screenshot each page
2. Upload to https://color.adobe.com/create/color-contrast-analyzer
3. Check all text meets minimum contrast
4. Fix any failures
```

### Focus Indicator Testing

**Visual Checklist:**
```
Test each element type:
- [ ] Links - Blue outline visible
- [ ] Buttons - Blue outline visible
- [ ] Inputs - Blue border/outline visible
- [ ] Cards - Blue outline visible
- [ ] Custom components - Blue outline visible

Verify:
- [ ] Outline at least 2px thick
- [ ] Contrasts with background (3:1 minimum)
- [ ] Not hidden by other elements
- [ ] Visible in light AND dark mode
```

### Zoom and Reflow Testing

**Test at different zoom levels:**
```
1. Set browser zoom to 100%
2. Verify content readable
3. Zoom to 150%
4. Check for text overlap or cut-off
5. Zoom to 200% (WCAG requirement)
6. Verify all content still accessible
7. Zoom to 400% (extreme test)
8. Check nothing breaks

Expected Results:
✅ No content loss at any zoom level
✅ No horizontal scrolling (except data tables)
✅ Text reflows naturally
✅ All buttons still clickable
```

### Responsive Design Testing

**Test on multiple devices:**
```
Desktop (1920x1080):
- [ ] All content visible
- [ ] No awkward spacing
- [ ] Images not pixelated

Tablet (768x1024):
- [ ] Navigation collapses appropriately
- [ ] Images resize correctly
- [ ] Forms still usable

Mobile (375x667):
- [ ] Touch targets at least 44x44px
- [ ] Text readable without zoom
- [ ] No horizontal scroll
- [ ] Skip link still accessible
```

---

## Automated Testing

### Using axe DevTools (Recommended)

**Install and Run:**
```
1. Install Chrome/Firefox extension
2. Open DevTools (F12)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review results
```

**Interpreting Results:**
- **Critical:** Must fix immediately
- **Serious:** Should fix before release
- **Moderate:** Fix when possible
- **Minor:** Nice to have

**Common axe Issues:**
```
❌ "Buttons must have discernible text"
   Fix: Add aria-label or visible text

❌ "Links must have discernible text"
   Fix: Add meaningful link text

❌ "Form elements must have labels"
   Fix: Add <label> or aria-label

❌ "Images must have alt text"
   Fix: Add alt="" (decorative) or descriptive alt

❌ "Document must have one main landmark"
   Fix: Wrap content in <main id="main-content">
```

### Using WAVE Extension

**Install and Run:**
```
1. Install browser extension
2. Click WAVE icon in toolbar
3. Review results on page
4. Fix errors (red icons)
5. Review alerts (yellow icons)
6. Verify features (green icons)
```

**WAVE Icons:**
- 🔴 Red: Errors (must fix)
- 🟡 Yellow: Alerts (review)
- 🟢 Green: Features (good!)
- 🔵 Blue: Structural elements
- ⚪ Gray: Contrast issues

### Using Pa11y (Command Line)

**Installation:**
```bash
npm install -g pa11y pa11y-ci
```

**Basic Usage:**
```bash
# Test single page
pa11y http://localhost:3007

# Test with specific standard
pa11y --standard WCAG2AA http://localhost:3007

# Test multiple pages
pa11y-ci --sitemap http://localhost:3007/sitemap.xml

# Output to JSON
pa11y --reporter json http://localhost:3007 > results.json
```

**Create pa11y config:**

`pa11y.json`:
```json
{
  "standard": "WCAG2AA",
  "ignore": [
    "warning",
    "notice"
  ],
  "chromeLaunchConfig": {
    "args": ["--no-sandbox"]
  },
  "urls": [
    "http://localhost:3007",
    "http://localhost:3007/dashboard/creator/overview",
    "http://localhost:3007/dashboard/student/courses"
  ]
}
```

Run with:
```bash
pa11y-ci --config pa11y.json
```

### Lighthouse Accessibility Audit

**Run in Chrome DevTools:**
```
1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Accessibility" only (faster)
4. Click "Generate report"
5. Review score and recommendations
```

**Target Scores:**
- 90-100: Excellent
- 80-89: Good
- 70-79: Needs improvement
- 0-69: Poor

**Common Lighthouse Failures:**
```
❌ "Background and foreground colors do not have sufficient contrast"
   Fix: Increase color contrast to 4.5:1 minimum

❌ "Form elements do not have associated labels"
   Fix: Add proper <label> tags or aria-labelledby

❌ "[user-scalable="no"] is used or [maximum-scale] is less than 5"
   Fix: Remove viewport restrictions

❌ "Links do not have a discernible name"
   Fix: Add text or aria-label to links
```

---

## Common Issues and Fixes

### Issue: Skip Link Not Working

**Problem:**
```typescript
// Missing target element
<SkipLink href="#main-content">Skip to main content</SkipLink>
// But no element with id="main-content"
```

**Fix:**
```typescript
<SkipLink href="#main-content">Skip to main content</SkipLink>
<!-- ... -->
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

**Verify:**
1. Tab once on page load
2. Skip link appears
3. Press Enter
4. Main content receives focus (outline appears)

---

### Issue: Modal Focus Not Trapped

**Problem:**
```typescript
// No focus trap
<div className="modal">
  <button onClick={onClose}>Close</button>
  {children}
</div>
```

**Fix:**
```typescript
import { Modal } from '@/components/ui/Modal';

<Modal isOpen={isOpen} onClose={onClose} title="Modal Title">
  {children}
</Modal>
```

**Verify:**
1. Open modal with keyboard
2. Press Tab multiple times
3. Focus should cycle within modal only
4. Press Escape to close

---

### Issue: No Focus Indicator

**Problem:**
```css
/* Missing in globals.css */
```

**Fix:**
```css
/* Add to app/globals.css */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

**Verify:**
1. Press Tab through page
2. Blue outline appears on each element
3. Visible in light and dark mode

---

### Issue: Button Has No Accessible Name

**Problem:**
```typescript
<button onClick={handleClick}>
  <X className="w-5 h-5" />
</button>
```

**Fix:**
```typescript
<button onClick={handleClick} aria-label="Close modal">
  <X className="w-5 h-5" />
</button>
```

**Verify:**
1. Use screen reader
2. Navigate to button
3. Hears "Close modal, button"

---

### Issue: Form Input Missing Label

**Problem:**
```typescript
<input type="text" placeholder="Enter name" />
```

**Fix:**
```typescript
<label htmlFor="name">Name</label>
<input type="text" id="name" placeholder="Enter name" />

// OR with aria-label
<input
  type="text"
  aria-label="Name"
  placeholder="Enter name"
/>
```

**Verify:**
1. Use screen reader
2. Navigate to input
3. Hears label before input type

---

## Testing Workflow

### Before Every Commit

```bash
# 1. Run automated tests
pa11y http://localhost:3007 --standard WCAG2AA

# 2. Quick keyboard test
# - Tab through page
# - Verify focus indicators
# - Test any new interactive elements

# 3. Fix any critical issues
# - Address all pa11y errors
# - Ensure keyboard access works
```

### Before Every Pull Request

```bash
# 1. Full automated scan
npm run test:a11y  # Or pa11y-ci

# 2. Manual keyboard testing
# - Test all changed pages
# - Verify skip links work
# - Test modals if changed

# 3. Screen reader spot check
# - Test main user flow
# - Verify new content accessible
```

### Before Every Release

```bash
# 1. Comprehensive automated testing
pa11y-ci --config pa11y.json
lighthouse --only-categories=accessibility --view

# 2. Full manual testing
# - Keyboard navigation (all pages)
# - Screen reader testing (critical paths)
# - Visual testing (contrast, zoom)

# 3. Accessibility audit
# - Run axe DevTools on all pages
# - Document remaining issues
# - Plan fixes for next sprint
```

---

## Resources

### Documentation
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Tools
- axe DevTools: https://www.deque.com/axe/devtools/
- WAVE: https://wave.webaim.org/
- Pa11y: https://pa11y.org/
- Lighthouse: https://developers.google.com/web/tools/lighthouse

### Learning
- WebAIM: https://webaim.org/
- A11y Project: https://www.a11yproject.com/
- Inclusive Components: https://inclusive-components.design/

---

## Questions?

For accessibility questions or to report issues:
1. Check this guide first
2. Search WCAG 2.1 documentation
3. Test with automated tools
4. Create issue with "a11y" label

---

**Last Updated:** November 18, 2025
**Version:** 1.0
**Maintained by:** Accessibility Team
