# Wave 3: CourseBuilder Integration - Testing Guide

**Component:** CourseBuilder with LessonCard
**Date:** 2025-11-13
**Tester:** QA Team / Developer
**Estimated Time:** 30-45 minutes

---

## Prerequisites

### Environment Setup

1. **Start Development Server**
   ```bash
   cd D:\APS\Projects\whop\chronos
   npm run dev
   ```

2. **Access CourseBuilder**
   - Navigate to: `http://localhost:3000/dashboard/creator/courses`
   - Click on any existing course to enter CourseBuilder
   - OR create a new course and add chapters/lessons

3. **Required Test Data**
   - At least 1 course with 2+ chapters
   - Mix of video sources (YouTube, Loom, Mux, Upload)
   - Some lessons with thumbnails, some without
   - Lessons with varying durations (short and long)

---

## Test Cases

### 1. Visual Rendering Tests

#### 1.1 LessonCard Displays Correctly

**Steps:**
1. Open CourseBuilder with existing lessons
2. Expand a chapter with lessons

**Expected Results:**
- ✅ Each lesson shows as a card (not text-only)
- ✅ Thumbnails are 80x45px (16:9 aspect ratio)
- ✅ Thumbnails load correctly
- ✅ Cards are evenly spaced (8px gap)
- ✅ Cards fit within sidebar (256px width)

**Screenshots Needed:**
- Full sidebar view with multiple lessons
- Close-up of single LessonCard

---

#### 1.2 Source Type Badges

**Steps:**
1. Find lessons from different sources:
   - YouTube video
   - Loom video
   - Mux video
   - Uploaded video

**Expected Results:**

| Source | Badge Color | Icon | Position |
|--------|-------------|------|----------|
| YouTube | Red (`bg-red-3 border-red-6`) | YouTube icon | Top-left |
| Loom | Purple (`bg-purple-3 border-purple-6`) | Radio icon | Top-left |
| Mux | Blue (`bg-blue-3 border-blue-6`) | Video icon | Top-left |
| Upload | Green (`bg-green-3 border-green-6`) | Upload icon | Top-left |

**Screenshots Needed:**
- One of each source type badge

---

#### 1.3 Duration Badge

**Steps:**
1. Check duration badge on various lessons

**Expected Results:**
- ✅ Badge positioned bottom-right corner
- ✅ Black overlay background (`bg-black/80`)
- ✅ White text
- ✅ Format: "M:SS" for < 10 minutes (e.g., "3:45")
- ✅ Format: "MM:SS" for >= 10 minutes (e.g., "12:30")
- ✅ Format: "H:MM:SS" for >= 1 hour (e.g., "1:23:45")

**Test Data:**

| Duration (seconds) | Expected Display |
|-------------------|------------------|
| 45 | "0:45" |
| 225 | "3:45" |
| 750 | "12:30" |
| 3665 | "1:01:05" |

---

#### 1.4 Title Display

**Steps:**
1. Check titles of varying lengths

**Expected Results:**
- ✅ Short titles (< 20 chars) display fully
- ✅ Long titles (> 40 chars) truncate with ellipsis
- ✅ Maximum 2 lines (`line-clamp-2`)
- ✅ Text color: `text-gray-12` (default)
- ✅ Text color: `text-blue-11` (when selected)

**Test Titles:**
- "Introduction" (short)
- "Advanced Trading Strategies for Beginners" (medium)
- "The Complete Guide to Technical Analysis and Chart Patterns for Day Trading" (long)

---

### 2. Interaction Tests

#### 2.1 Lesson Selection

**Steps:**
1. Click on a LessonCard
2. Observe selection state
3. Click another LessonCard

**Expected Results:**
- ✅ Clicked card shows blue ring (`ring-2 ring-blue-9`)
- ✅ Title text turns blue (`text-blue-11`)
- ✅ Shadow increases
- ✅ Main content area updates with lesson details
- ✅ Previous selection clears
- ✅ Only one card selected at a time

**Edge Cases:**
- Clicking already selected card (should stay selected)
- Rapidly clicking multiple cards (should update smoothly)

---

#### 2.2 Hover Effects

**Steps:**
1. Hover over a LessonCard (without clicking)
2. Observe visual changes
3. Move cursor away

**Expected Results:**
- ✅ Card scales up slightly (`scale-[1.02]`)
- ✅ Shadow increases (`shadow-lg`)
- ✅ Delete button appears (top-right corner)
- ✅ Smooth transition (200ms)
- ✅ Effects reverse when cursor leaves

**Accessibility Check:**
- ✅ Hover effects don't interfere with reading
- ✅ Delete button doesn't cover important content

---

#### 2.3 Delete Button

**Steps:**
1. Hover over a LessonCard
2. Click the delete button (Trash icon)
3. Confirm deletion

**Expected Results:**
- ✅ Delete button appears only on hover
- ✅ Button positioned top-right corner
- ✅ Red background (`bg-red-3`)
- ✅ Red border (`border-red-6`)
- ✅ Clicking delete does NOT select the card
- ✅ Confirmation dialog appears
- ✅ Lesson removed after confirmation
- ✅ UI updates immediately

**Edge Cases:**
- Deleting last lesson in chapter (should show empty state)
- Deleting selected lesson (selection should clear)

---

#### 2.4 Keyboard Navigation

**Steps:**
1. Use Tab key to navigate to LessonCard
2. Press Enter or Space to select
3. Observe focus indicators

**Expected Results:**
- ✅ LessonCard receives keyboard focus
- ✅ Blue focus ring appears (`focus:ring-2 focus:ring-blue-9`)
- ✅ Enter key selects lesson
- ✅ Space key selects lesson
- ✅ Tab moves to next focusable element

**Accessibility:**
- ✅ Screen reader announces lesson title
- ✅ ARIA labels present (`aria-pressed`, `aria-label`)

---

### 3. Edge Case Tests

#### 3.1 Missing Thumbnail

**Steps:**
1. Find or create a lesson without a thumbnail
2. Observe LessonCard rendering

**Expected Results:**
- ✅ Gray placeholder background (`bg-gray-3`)
- ✅ VideoIcon displayed in center
- ✅ Icon size: 20x20px (`h-5 w-5`)
- ✅ Icon color: `text-gray-8`
- ✅ No broken image icon

**Test:** Upload a new video that hasn't processed thumbnails yet

---

#### 3.2 Zero Duration

**Steps:**
1. Find or create a lesson with duration = 0
2. Check duration badge

**Expected Results:**
- ✅ Badge shows "0:00"
- ✅ Badge still visible (not hidden)
- ✅ No errors in console

**Test:** Newly uploaded video before processing completes

---

#### 3.3 Missing Source Type

**Steps:**
1. Find an old lesson without `source_type` field
2. Check source badge

**Expected Results:**
- ✅ Defaults to 'upload' source type
- ✅ Green badge with Upload icon
- ✅ No errors in console

**Test:** Use database to remove `source_type` from a lesson

---

#### 3.4 Very Long Title

**Steps:**
1. Create a lesson with title > 100 characters
2. Observe text truncation

**Expected Results:**
- ✅ Text truncates after 2 lines
- ✅ Ellipsis (...) appears at end
- ✅ Full title visible on hover (via `title` attribute)
- ✅ No text overflow outside card

**Test Title:**
```
"The Ultimate Comprehensive Guide to Advanced Trading Strategies, Technical Analysis, Chart Patterns, Risk Management, and Portfolio Optimization for Day Traders and Swing Traders"
```

---

#### 3.5 Empty Chapter

**Steps:**
1. Expand a chapter with no lessons
2. Observe empty state

**Expected Results:**
- ✅ "No lessons in this chapter" message
- ✅ "Add lesson" button visible
- ✅ Button styled correctly (`text-blue-11`)
- ✅ Clicking button opens add lesson dialog

---

### 4. Functionality Tests

#### 4.1 Add New Lesson

**Steps:**
1. Click "Add lesson" button
2. Select video source (URL, Library, or Upload)
3. Complete video selection/upload
4. Observe new LessonCard creation

**Expected Results:**
- ✅ New LessonCard appears in lesson list
- ✅ Card displays correct thumbnail
- ✅ Source badge matches video source
- ✅ Duration badge shows correct time
- ✅ New lesson is automatically selected
- ✅ Main content area updates

**Test All Sources:**
- YouTube import → Red badge
- Loom import → Purple badge
- Whop import (Mux) → Blue badge
- File upload → Green badge

---

#### 4.2 Delete Lesson

**Steps:**
1. Hover over a LessonCard
2. Click delete button
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ "Are you sure?" message
- ✅ Lesson removed after confirmation
- ✅ Card disappears from list
- ✅ Remaining lessons stay in order
- ✅ No errors in console

**Edge Cases:**
- Delete first lesson in chapter
- Delete last lesson in chapter
- Delete middle lesson
- Delete currently selected lesson

---

#### 4.3 Chapter Management

**Steps:**
1. Add a new chapter
2. Add lessons to new chapter
3. Expand/collapse chapters
4. Delete a chapter

**Expected Results:**
- ✅ New chapter creates empty lesson list
- ✅ Lessons added to new chapter display as LessonCards
- ✅ Collapsing chapter hides lessons
- ✅ Expanding chapter shows lessons
- ✅ Deleting chapter removes all lessons

---

### 5. Responsive Design Tests

#### 5.1 Sidebar Width

**Steps:**
1. Observe sidebar at default width (256px)
2. Check if cards fit properly

**Expected Results:**
- ✅ Cards don't overflow sidebar
- ✅ 80px thumbnail + padding fits comfortably
- ✅ No horizontal scrolling
- ✅ Margins consistent

---

#### 5.2 Card Spacing

**Steps:**
1. Measure vertical spacing between cards

**Expected Results:**
- ✅ 8px gap between cards (`space-y-2`)
- ✅ Consistent spacing throughout list
- ✅ No overlapping cards

---

### 6. Performance Tests

#### 6.1 Large Lesson List

**Steps:**
1. Create a chapter with 20+ lessons
2. Scroll through lesson list
3. Expand/collapse chapter

**Expected Results:**
- ✅ Smooth scrolling (60fps)
- ✅ No lag when expanding/collapsing
- ✅ Thumbnails load lazily (only visible ones)
- ✅ No memory leaks
- ✅ CPU usage remains low

**Tool:** Browser DevTools Performance tab

---

#### 6.2 Rapid Interactions

**Steps:**
1. Rapidly click multiple lessons
2. Quickly hover over multiple cards
3. Spam click delete button (then cancel)

**Expected Results:**
- ✅ UI remains responsive
- ✅ No visual glitches
- ✅ No console errors
- ✅ State updates correctly

---

### 7. Browser Compatibility Tests

#### Test Matrix

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ⬜ Not tested |
| Firefox | Latest | ⬜ Not tested |
| Safari | Latest | ⬜ Not tested |
| Edge | Latest | ⬜ Not tested |

**For Each Browser:**
1. Load CourseBuilder
2. Test lesson selection
3. Test hover effects
4. Test delete functionality
5. Check visual consistency

---

### 8. Accessibility Tests

#### 8.1 Screen Reader

**Tool:** NVDA (Windows) or VoiceOver (Mac)

**Steps:**
1. Navigate to lesson list with screen reader
2. Tab through lessons
3. Select a lesson

**Expected Announcements:**
- ✅ "Button, Select lesson: [Lesson Title]"
- ✅ "Pressed" state when selected
- ✅ "Delete lesson" for delete button

---

#### 8.2 Keyboard Navigation

**Steps:**
1. Use only keyboard (no mouse)
2. Navigate entire CourseBuilder
3. Select lessons
4. Delete lessons

**Expected Results:**
- ✅ All interactive elements reachable
- ✅ Clear focus indicators
- ✅ Logical tab order
- ✅ Enter/Space keys work for selection

---

#### 8.3 Color Contrast

**Tool:** Browser DevTools Accessibility Audit

**Expected Results:**
- ✅ All text meets WCAG AA standards
- ✅ Badge icons visible and clear
- ✅ Focus indicators meet contrast requirements

---

### 9. Data Integrity Tests

#### 9.1 API Response Validation

**Steps:**
1. Open Browser DevTools Network tab
2. Load CourseBuilder
3. Inspect `/api/modules/[id]/lessons` response

**Expected Fields:**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "...",
        "title": "...",
        "video": {
          "thumbnail_url": "...",
          "duration_seconds": 123,
          "source_type": "youtube"
        }
      }
    ]
  }
}
```

**Verify:**
- ✅ `thumbnail_url` mapped correctly
- ✅ `duration_seconds` mapped correctly
- ✅ `source_type` mapped correctly

---

#### 9.2 State Persistence

**Steps:**
1. Select a lesson
2. Refresh page
3. Navigate away and back

**Expected Results:**
- ✅ Lesson data persists in database
- ✅ Lesson order preserved
- ✅ Thumbnails reload correctly

---

### 10. Error Handling Tests

#### 10.1 Thumbnail Load Failure

**Steps:**
1. Use DevTools to block thumbnail URL
2. Observe LessonCard behavior

**Expected Results:**
- ✅ Placeholder image shows
- ✅ No broken image icon
- ✅ No console errors (or graceful error)

---

#### 10.2 API Failure

**Steps:**
1. Use DevTools to simulate network failure
2. Try to load lessons

**Expected Results:**
- ✅ Error message displayed
- ✅ "Failed to load course data" message
- ✅ No UI crash
- ✅ Retry option available (refresh)

---

#### 10.3 Invalid Data

**Steps:**
1. Manually corrupt lesson data (via database)
2. Load CourseBuilder

**Expected Results:**
- ✅ Graceful degradation
- ✅ Fallback values used (e.g., `duration: 0`)
- ✅ No app crash

---

## Regression Tests

### Verify Existing Functionality Still Works

- ✅ Add chapter
- ✅ Delete chapter
- ✅ Rename chapter
- ✅ Expand/collapse chapters
- ✅ Add lesson (all 3 methods)
- ✅ Delete lesson
- ✅ View lesson details
- ✅ Navigate between lessons
- ✅ Back to course list

---

## Console Error Check

**Throughout ALL Tests:**

1. Keep Browser DevTools Console open
2. Monitor for errors, warnings, or logs

**Expected:**
- ✅ No React errors
- ✅ No TypeScript errors
- ✅ No 404 requests
- ✅ No uncaught exceptions

**Allowed:**
- ⚠️ Warnings about missing thumbnails (informational)
- ⚠️ API rate limit warnings (if applicable)

---

## Performance Benchmarks

### Load Time

**Metric:** Time to render 20 lessons

- **Target:** < 500ms
- **Acceptable:** < 1000ms
- **Unacceptable:** > 2000ms

**Tool:** Browser DevTools Performance tab

---

### Memory Usage

**Metric:** Heap size increase after loading 50 lessons

- **Target:** < 5MB
- **Acceptable:** < 10MB
- **Unacceptable:** > 20MB

**Tool:** Browser DevTools Memory tab

---

## Bug Reporting Template

If you find a bug, use this template:

```markdown
## Bug Report

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Paste any console errors]

**Environment:**
- Browser: [Chrome 120, Firefox 121, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Screen Size: [1920x1080, 1366x768, etc.]

**Additional Context:**
[Any other relevant information]
```

---

## Sign-Off Checklist

### Visual Tests ✅
- [ ] LessonCard renders correctly
- [ ] Source badges display with correct colors
- [ ] Duration badges show correct format
- [ ] Titles truncate properly

### Interaction Tests ✅
- [ ] Lesson selection works
- [ ] Hover effects smooth and clear
- [ ] Delete button functions correctly
- [ ] Keyboard navigation works

### Edge Cases ✅
- [ ] Missing thumbnails handled gracefully
- [ ] Zero duration displays correctly
- [ ] Missing source_type defaults to 'upload'
- [ ] Very long titles truncate properly
- [ ] Empty chapters show empty state

### Functionality Tests ✅
- [ ] Add new lesson creates LessonCard
- [ ] Delete lesson removes LessonCard
- [ ] Chapter management still works

### Performance Tests ✅
- [ ] Large lesson lists perform well
- [ ] Rapid interactions remain smooth

### Accessibility Tests ✅
- [ ] Screen reader compatibility
- [ ] Keyboard navigation complete
- [ ] Color contrast meets standards

### Regression Tests ✅
- [ ] All existing features work
- [ ] No console errors
- [ ] No TypeScript errors

---

## Test Results Summary

**Tester Name:** _________________
**Date:** _________________
**Environment:** _________________

**Overall Status:** ⬜ Pass | ⬜ Pass with minor issues | ⬜ Fail

**Total Tests:** _____ / _____
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Critical Issues Found:** _____
**Non-Critical Issues Found:** _____

**Notes:**
________________________________
________________________________
________________________________

**Recommendation:** ⬜ Approve for production | ⬜ Needs fixes | ⬜ Major rework required

---

## Next Steps

After all tests pass:

1. ✅ Merge feature branch to main
2. ✅ Deploy to staging environment
3. ✅ User acceptance testing
4. ✅ Deploy to production

---

**Testing Guide Prepared By:** CourseBuilder Integration Agent
**Date:** 2025-11-13
**Version:** 1.0

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
