# FROSTED UI MIGRATION - FIXES CHECKLIST

**Date:** 2025-11-19
**File:** `/app/dashboard/student/courses/[id]/lesson/page.tsx`
**Violations:** 3
**Estimated Time:** 5 minutes
**Difficulty:** EASY

---

## FIX SUMMARY

| # | Line | Component | Type | Priority |
|---|------|-----------|------|----------|
| 1 | 391 | Header Bar | bg-white → bg-gray-a1 | HIGH |
| 2 | 436 | Metadata Panel | bg-white → Card/bg-gray-a1 | HIGH |
| 3 | 450 | Chat Section | bg-white → bg-gray-1 | HIGH |

---

## FIX #1: Header Bar (Line 391)

### Location
File: `/app/dashboard/student/courses/[id]/lesson/page.tsx`
Line: 391

### Current Code
```tsx
<div className="bg-white border-b border-gray-6 px-4 py-3 flex-shrink-0">
  <div className="flex items-center gap-3">
    <Button
      onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
      variant="ghost"
      size="sm"
      icon={<ArrowLeft className="h-4 w-4" />}
      iconPosition="left"
    >
      Back to Course
    </Button>
  </div>
</div>
```

### Corrected Code
```tsx
<div className="bg-gray-a1 border-b border-gray-a4 px-4 py-3 flex-shrink-0">
  <div className="flex items-center gap-3">
    <Button
      onClick={() => router.push(`/dashboard/student/courses/${courseId}`)}
      variant="ghost"
      size="sm"
      icon={<ArrowLeft className="h-4 w-4" />}
      iconPosition="left"
    >
      Back to Course
    </Button>
  </div>
</div>
```

### Changes
```diff
- className="bg-white border-b border-gray-6 px-4 py-3 flex-shrink-0"
+ className="bg-gray-a1 border-b border-gray-a4 px-4 py-3 flex-shrink-0"
```

### Visual Impact
- **Before:** White background creates jarring contrast
- **After:** Subtle gray surface integrates with dark theme

### Testing
- [ ] Visual check: Header looks consistent with theme
- [ ] Contrast check: Text still readable
- [ ] Responsive: Works on mobile/tablet/desktop

---

## FIX #2: Metadata Panel (Line 436)

### Location
File: `/app/dashboard/student/courses/[id]/lesson/page.tsx`
Line: 436

### Current Code
```tsx
<div className="hidden lg:block lg:w-80 flex-shrink-0">
  <div className="bg-white rounded-lg p-4 border border-gray-6 h-full overflow-y-auto">
    <VideoMetadataPanel
      video={{
        id: video.id,
        title: video.title,
        duration_seconds: video.duration_seconds || 0,
      }}
      progress={progress || undefined}
    />
  </div>
</div>
```

### Corrected Code - Option A (Using Card - RECOMMENDED)

```tsx
<div className="hidden lg:block lg:w-80 flex-shrink-0">
  <Card size="3" className="h-full overflow-y-auto">
    <VideoMetadataPanel
      video={{
        id: video.id,
        title: video.title,
        duration_seconds: video.duration_seconds || 0,
      }}
      progress={progress || undefined}
    />
  </Card>
</div>
```

**Note:** Ensure Card is imported at top:
```tsx
import { Card } from 'frosted-ui'; // Add this if not already imported
```

### Corrected Code - Option B (Using Color Tokens)

```tsx
<div className="hidden lg:block lg:w-80 flex-shrink-0">
  <div className="bg-gray-a1 rounded-lg p-4 border border-gray-a4 h-full overflow-y-auto">
    <VideoMetadataPanel
      video={{
        id: video.id,
        title: video.title,
        duration_seconds: video.duration_seconds || 0,
      }}
      progress={progress || undefined}
    />
  </div>
</div>
```

### Changes (Option A - Preferred)
```diff
- <div className="bg-white rounded-lg p-4 border border-gray-6 h-full overflow-y-auto">
+ <Card size="3" className="h-full overflow-y-auto">
    <VideoMetadataPanel {...props} />
- </div>
+ </Card>
```

### Changes (Option B)
```diff
- className="bg-white rounded-lg p-4 border border-gray-6 h-full overflow-y-auto"
+ className="bg-gray-a1 rounded-lg p-4 border border-gray-a4 h-full overflow-y-auto"
```

### Visual Impact
- **Before:** Bright white sidebar dominates desktop view
- **After:** Subtle surface integrates with video player

### Testing
- [ ] Visual check: Panel matches overall theme
- [ ] Desktop only: Verify hidden on tablet/mobile (lg: breakpoint)
- [ ] Overflow: Verify scrolling works properly
- [ ] Contrast: Text readable on background

---

## FIX #3: Chat Section (Line 450)

### Location
File: `/app/dashboard/student/courses/[id]/lesson/page.tsx`
Line: 450

### Current Code
```tsx
<div className="flex-[3] min-h-0 border-t border-gray-6 bg-white">
  {chatSessionId ? (
    <ChatInterface
      sessionId={chatSessionId}
      currentVideoId={videoId || undefined}
      onTimestampClick={handleTimestampClick}
    />
  ) : (
    <div className="h-full flex items-center justify-center text-gray-10">
      <p>Loading chat...</p>
    </div>
  )}
</div>
```

### Corrected Code
```tsx
<div className="flex-[3] min-h-0 border-t border-gray-a4 bg-gray-1">
  {chatSessionId ? (
    <ChatInterface
      sessionId={chatSessionId}
      currentVideoId={videoId || undefined}
      onTimestampClick={handleTimestampClick}
    />
  ) : (
    <div className="h-full flex items-center justify-center text-gray-10">
      <p>Loading chat...</p>
    </div>
  )}
</div>
```

### Changes
```diff
- className="flex-[3] min-h-0 border-t border-gray-6 bg-white"
+ className="flex-[3] min-h-0 border-t border-gray-a4 bg-gray-1"
```

### Visual Impact
- **Before:** Large white section breaks dark theme
- **After:** Consistent dark background throughout page

### Testing
- [ ] Visual check: Chat section matches theme
- [ ] Border: Subtle line separates from video section
- [ ] Loading state: "Loading chat..." text visible
- [ ] Chat interface: Component displays properly

---

## IMPLEMENTATION GUIDE

### Step 1: Open File
```bash
# Open the lesson page in your editor
code app/dashboard/student/courses/[id]/lesson/page.tsx
```

### Step 2: Apply Fix #1 (Line 391)

**Find this line:**
```
Line 391: <div className="bg-white border-b border-gray-6 px-4 py-3 flex-shrink-0">
```

**Replace with:**
```
<div className="bg-gray-a1 border-b border-gray-a4 px-4 py-3 flex-shrink-0">
```

**Verify:**
- Line should start with `<div className="bg-gray-a1...`
- No `bg-white` or `border-gray-6` remaining

### Step 3: Apply Fix #2 (Line 436)

**Find this code block:**
```
<div className="hidden lg:block lg:w-80 flex-shrink-0">
  <div className="bg-white rounded-lg p-4 border border-gray-6 h-full overflow-y-auto">
    <VideoMetadataPanel ... />
  </div>
</div>
```

**Replace with (Option A - Recommended):**
```
<div className="hidden lg:block lg:w-80 flex-shrink-0">
  <Card size="3" className="h-full overflow-y-auto">
    <VideoMetadataPanel ... />
  </Card>
</div>
```

**Alternative (Option B):**
```
<div className="hidden lg:block lg:w-80 flex-shrink-0">
  <div className="bg-gray-a1 rounded-lg p-4 border border-gray-a4 h-full overflow-y-auto">
    <VideoMetadataPanel ... />
  </div>
</div>
```

**If using Option A, verify:**
- Check imports: `import { Card, ... } from 'frosted-ui';`
- Card has `size="3"` attribute
- className only has `h-full overflow-y-auto`

### Step 4: Apply Fix #3 (Line 450)

**Find this line:**
```
Line 450: <div className="flex-[3] min-h-0 border-t border-gray-6 bg-white">
```

**Replace with:**
```
<div className="flex-[3] min-h-0 border-t border-gray-a4 bg-gray-1">
```

**Verify:**
- Line has `bg-gray-1` (not `bg-white`)
- Line has `border-gray-a4` (not `border-gray-6`)

### Step 5: Verify Imports

Check the top of the file. Should have:

```tsx
import { Card, ... } from 'frosted-ui'; // If using Fix #2 Option A
```

If Card is not imported and you're using Option A, add it:

```tsx
import { Card, Heading, Text } from 'frosted-ui';
```

### Step 6: Test

```bash
# Save file
# Dev server should hot-reload automatically

# Navigate to: http://localhost:3007/dashboard/student/courses/[courseId]/lesson?videoId=[videoId]

# Visual verification checklist:
# - [ ] Header has subtle gray background (not white)
# - [ ] Metadata panel (desktop) has subtle gray background (not white)
# - [ ] Chat section has dark gray background (not white)
# - [ ] All borders are subtle gray (not darker gray-6)
# - [ ] Text is readable on all backgrounds
# - [ ] Responsive design still works (test at 375px, 768px, 1440px)
```

---

## VERIFICATION CHECKLIST

### Before Making Changes
- [ ] Backed up the file (or using git)
- [ ] Closed all other instances of the file
- [ ] Opened file at: `/app/dashboard/student/courses/[id]/lesson/page.tsx`

### Making Changes
- [ ] Fix #1 applied (Line 391)
- [ ] Fix #2 applied (Line 436)
- [ ] Fix #3 applied (Line 450)
- [ ] File saved
- [ ] No syntax errors (check IDE)

### Testing Changes
- [ ] Dev server is running
- [ ] Page loads without errors
- [ ] Header looks correct
- [ ] Metadata panel looks correct (desktop)
- [ ] Chat section looks correct
- [ ] All text is readable
- [ ] Mobile responsive still works

### Final Verification
- [ ] All 3 violations fixed
- [ ] No white backgrounds visible
- [ ] All borders use gray-a4
- [ ] All backgrounds use Frosted UI colors
- [ ] No console errors
- [ ] Ready for commit

---

## QUICK REFERENCE

### Color Token Changes

| Old Token | New Token | Context |
|-----------|-----------|---------|
| `bg-white` | `bg-gray-a1` | Subtle surface |
| `bg-white` | `bg-gray-1` | Dark background |
| `border-gray-6` | `border-gray-a4` | Borders |

### Component Options

| Component | Benefit |
|-----------|---------|
| Card (Option A) | Semantic, proper padding, built-in styling |
| Color tokens (Option B) | More control, simpler for single elements |

**Recommendation:** Use Option A (Card) for consistency with Frosted UI patterns.

---

## TROUBLESHOOTING

### Issue: Card styling doesn't look right

**Solution:** Verify Card is properly imported:
```tsx
import { Card } from 'frosted-ui';
```

### Issue: Text is hard to read

**Solution:** Ensure you're using proper text colors:
```tsx
<Text className="text-gray-11"> ← Default
<Text className="text-gray-12"> ← Higher contrast
```

### Issue: Borders are too dark

**Solution:** Verify using correct border token:
```tsx
className="border-gray-a4" ← Correct (subtle)
className="border-gray-6" ← Wrong (removed)
```

### Issue: Background looks wrong on mobile

**Solution:** Check responsive classes:
```tsx
<div className="hidden lg:block"> ← Desktop only
<div className="lg:hidden"> ← Mobile/tablet only
```

---

## GIT COMMIT MESSAGE

Once all fixes are applied and tested, commit with:

```bash
git add app/dashboard/student/courses/[id]/lesson/page.tsx

git commit -m "fix(student): migrate lesson viewer to Frosted UI color tokens

- Replace bg-white with Frosted UI tokens (bg-gray-a1, bg-gray-1)
- Replace border-gray-6 with border-gray-a4
- Use Card component for metadata panel

Fixes: Lesson viewer page not compliant with Frosted UI design system
Severity: High
Affected: Student dashboard lesson viewer page"
```

---

## SUMMARY

**Status:** Ready to implement
**Time to fix:** 5 minutes
**Breaking changes:** None
**Testing required:** Visual verification only
**Risk level:** LOW (CSS-only changes)

**Before Implementation:**
- 3 white background violations
- Non-compliant color tokens
- Inconsistent with design system

**After Implementation:**
- 0 violations
- 100% Frosted UI compliant
- Consistent dark theme throughout

---

**Report Generated:** 2025-11-19
**Implementation Status:** READY
**Next Steps:** Apply fixes, test, commit
