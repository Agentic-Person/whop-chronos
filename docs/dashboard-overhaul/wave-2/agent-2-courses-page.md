# Wave 2 - Agent 2: Courses Page (Course Builder)

**Agent:** Agent 2
**Wave:** Wave 2 - Page Development
**Status:** 🔵 Pending
**Start Time:** Not started
**End Time:** Not started
**Duration:** TBD
**Complexity:** 🔴 HIGH - Most complex page in Wave 2

---

## 📋 Assigned Tasks

**Primary Goal:** Build complete course builder with chapter/lesson organization and video library integration

**CRITICAL FIX:** Change page title from "Videos" to "Courses" or "Course Builder"

### Design References
📁 **Location:** `snips/courses/`
- `Sample course creation step 1.jpg` - Create Course Modal
- `Sample course creation step 2.jpg` - Chapter Management View
- `Sample course creation step 3.jpg` - Lesson Type Selection
- `Sample Course Creation Step 4.jpg` - Lessons Grid View
- `Sample course creation step 5.jpg` - Individual Lesson Editor

---

## 🎯 Complete Course Builder Workflow

### STATE 1: Empty State (No Courses)
**What user sees:**
- Grid layout with blue rectangles showing where courses will appear
- Subtle outline box
- Small round "Add course" button (subtle, not prominent)
- Empty state message

**Components needed:**
- CoursesGrid (empty state)
- AddCourseButton (subtle circular icon)

---

### STATE 2: Create Course Modal

**Design Reference:** `Sample course creation step 1.jpg`

**Modal Dialog (Green Box in Design):**

**Form Fields:**
1. **Name** (text input)
   - Placeholder: "Enter course name"
   - Required field
   - Max length: 100 characters

2. **Description** (textarea)
   - Placeholder: "Enter course description"
   - Optional
   - Max length: 500 characters

3. **Cover Image** (image upload)
   - **CRITICAL FEATURE:** User can choose aspect ratio
   - **Options:**
     - AR 16:9 (landscape/traditional)
     - AR 9:16 (portrait/vertical)
   - **Display behavior:**
     - If user chooses 9:16 (tall), center it in the rectangular window
     - Keep rectangular size consistent regardless of choice
     - Might look silly with tall images, that's okay
   - Image upload with preview
   - Drag & drop support
   - Supported formats: JPG, PNG, WebP
   - Max size: 5MB

**Actions:**
- Cancel button (closes modal)
- Create button (creates course, opens to Chapter Manager)

**Components needed:**
- CreateCourseModal
- AspectRatioSelector (16:9 or 9:16 radio buttons)
- ImageUploadWithPreview
- FormValidation

---

### STATE 3: Chapter Management View

**Design Reference:** `Sample course creation step 2.jpg`

**Layout:**
- Left sidebar: Chapter list (collapsible)
- Main content: Selected chapter/lesson content

**Top Window Features:**
- "Chapter 1" with dropdown (inline rename)
- Additional icon (⚙️ or ⋮) to open chapter settings
- Drag handles for reordering chapters

**Chapter List:**
- Chapter 1 (expanded)
  - "No lessons in this chapter" message
  - "+" icon to add lesson
- Chapter 2 (expanded)
  - "No lessons in this chapter"
  - "+" icon
- Chapter 3 (expanded)
  - "No lessons in this chapter"
  - "+" icon
- **"Add New Chapter" button** at bottom of list

**Key Functionality:**
- Users can add multiple chapters BEFORE adding any videos
- Can organize course structure first, then populate with content
- Chapters are collapsible/expandable
- Drag & drop to reorder chapters
- Rename chapters inline
- Delete chapters (with confirmation)

**Components needed:**
- ChapterSidebar
- ChapterList (drag & drop)
- ChapterItem (collapsible)
- AddChapterButton
- ChapterSettings menu

---

### STATE 4: Add Lesson Dialog

**Design Reference:** `Sample course creation step 3.jpg`

**CRITICAL REQUIREMENT:** Two-path video system

**Modal Dialog: "New Lesson"**
**Subtitle:** "Select how to add content to this lesson"

**Option 1: Insert Video (from library)**
- Icon: 📹 Video icon
- Label: "Insert Video"
- Description: "Choose from your existing video library"
- **WHY:** Content creators have storage limits - they don't want to re-upload videos
- **BENEFIT:** Reuse videos across multiple courses
- Clicking opens Video Library Picker (see STATE 5)

**Option 2: Upload Video (new)**
- Icon: ⬆️ Upload icon
- Label: "Upload Video"
- Description: "Upload a new video to your library"
- **WHY:** For brand new content
- **PROCESS:** Upload → Transcription → Vectorization → Add to library → Add to lesson
- Clicking opens Video Uploader

**Option 3: Quiz (Coming Soon)**
- Icon: ❓ Question mark (faded)
- Label: "Quiz" (grayed out)
- Description: "Coming Soon"
- **Status:** Not clickable, visually faded/disabled
- **Display:** Show but indicate it's not available yet

**Actions:**
- Cancel button
- Conditional "Continue" button (after selection)

**Components needed:**
- AddLessonDialog
- LessonTypeSelector
- Coming Soon badge/indicator

---

### STATE 5: Video Library Picker (Insert Mode)

**Design Reference:** `Sample Course Creation Step 4.jpg`

**When user clicks "Insert Video" from STATE 4:**

**Main View: Video Library Grid**

**Each Video Card Shows:**

**Left Section:**
- Thumbnail image (16:9 or 9:16 based on video)
- Play icon overlay
- Video duration badge

**Right Section (Metadata):**
- Video title (bold)
- Short description (truncated)
- Upload date
- **STATISTICS PANEL:**
  - 👁️ Total views/plays
  - ⏱️ Total watch time (minutes)
  - **Visual Heat Meter (NEW REQUIREMENT):**
    - Horizontal bar graphic
    - Color gradient: Green → Yellow → Orange → Red
    - **Green:** Low views, cold content
    - **Yellow:** Moderate views
    - **Orange:** Good views, warm content
    - **Red:** High views, "RED HOT" content
    - Helps creators identify best-performing videos at a glance

**Actions:**
- Click video card to select it
- "Select" button on hover
- Cancel button to go back

**Bottom Section:**
- **"Upload New Video" button** (always accessible)
- If clicked, switches to upload flow

**Search & Filter:**
- Search bar to find videos by title
- Filter by upload date
- Filter by performance (hot/warm/cold)
- Sort by views, date, duration

**Components needed:**
- VideoLibraryPicker
- VideoCard (with stats and heat meter)
- HeatMeter component (gradient bar)
- VideoSearch
- VideoFilters
- "Upload New Video" button

---

### STATE 6: Video Upload Flow

**Design Reference:** `Sample course creation step 5.jpg`

**When user clicks "Upload Video":**

**Upload Section:**
- Large upload area
- Icon: 📹 Video icon
- Text: "Upload a video..."
- Supported formats: ".mp4, .mov, .mpeg, or .webm"
- Drag & drop support
- "Upload file" button
- **"Paste Video" button** (for video URLs like YouTube, Vimeo)

**After Upload:**
- Progress bar (upload progress)
- Processing indicator (transcription + vectorization)
- Success message
- Video added to library
- Video added to current lesson

**File Attachments Section:**
- "Upload attachment" button
- Supports PDFs, docs, slides
- Shows list of uploaded attachments

**Drip Feeding Settings:**
- Toggle: "Unlocks immediately" (default ON)
- If OFF: Date/time picker for unlock schedule
- Useful for course releases over time

**Content Editor:**
- Rich text editor
- Placeholder: "Press '/' for commands"
- Markdown support
- Add text, images, embeds alongside video

**Components needed:**
- VideoUploader (drag & drop)
- URLPasteUploader
- UploadProgress
- FileAttachments
- DripFeedingToggle
- RichTextEditor (slash commands)

---

### STATE 7: Populated Courses Grid

**After courses are created:**
- Grid of course cards (3-4 per row on desktop)
- Each card shows:
  - Cover image (with chosen aspect ratio)
  - Course title
  - Number of chapters
  - Number of lessons/videos
  - Last edited date
  - "Edit" button
- Hover effects
- Click card to open course editor
- "Add course" button always visible

---

## 📁 Files to Modify

- `app/dashboard/creator/courses/page.tsx`
  - [ ] **CRITICAL:** Change title from "Videos" to "Courses"
  - [ ] Redesigned with full course builder
  - [ ] Empty state with Add Course button
  - [ ] Courses grid layout
  - [ ] Complete workflow implemented (7 states)
  - [ ] All components integrated
  - [ ] Responsive design
  - [ ] Error handling

---

## 🎨 Frosted UI Components to Use

- `Card` - Course cards, video cards
- `Dialog` / `Modal` - All modal dialogs
- `Button` - All buttons
- `Input` / `Textarea` - Form inputs
- `Select` / `Radio` - Aspect ratio selector
- `Tabs` - If needed for different views
- `Progress` - Upload progress
- `Badge` - Status indicators, counts, "Coming Soon"
- `Skeleton` - Loading states
- `DropdownMenu` - Chapter settings
- `Toggle` / `Switch` - Drip feeding
- Drag & Drop utilities (from `@dnd-kit/*`)
- Design tokens: `--gray-*`, `--accent-*`

---

## 🧪 Playwright Tests Required (MANDATORY - Test as you build!)

### Test 1: Empty State & Add Course
- [ ] Navigate to /dashboard/creator/courses
- [ ] Verify empty state shows
- [ ] Verify "Add course" button visible
- [ ] Click "Add course" → modal opens
- **Result:** PENDING

### Test 2: Create Course Modal
- [ ] Fill in course name
- [ ] Fill in description
- [ ] Select aspect ratio (16:9)
- [ ] Upload cover image
- [ ] Click "Create"
- [ ] Course appears in grid
- **Result:** PENDING

### Test 3: Aspect Ratio 9:16 Handling
- [ ] Create course with 9:16 image
- [ ] Verify image is centered in rectangle
- [ ] Verify rectangular size maintained
- **Result:** PENDING

### Test 4: Chapter Management
- [ ] Create course
- [ ] Verify Chapter 1 exists
- [ ] Click "Add New Chapter"
- [ ] Verify Chapter 2 created
- [ ] Rename Chapter 1
- [ ] Drag Chapter 2 above Chapter 1
- **Result:** PENDING

### Test 5: Add Lesson - Two Path Choice
- [ ] Click "+" on a chapter
- [ ] Verify "Insert Video" option
- [ ] Verify "Upload Video" option
- [ ] Verify "Quiz" is grayed out
- **Result:** PENDING

### Test 6: Video Library Picker
- [ ] Choose "Insert Video"
- [ ] Verify video library opens
- [ ] Verify all videos show thumbnails
- [ ] Verify statistics display (views, time)
- [ ] Verify heat meter displays
- [ ] Check gradient colors (green to red)
- [ ] Select a video
- [ ] Verify video added to lesson
- **Result:** PENDING

### Test 7: Video Upload Flow
- [ ] Choose "Upload Video"
- [ ] Upload .mp4 file
- [ ] Verify progress bar shows
- [ ] Wait for processing
- [ ] Verify success message
- [ ] Verify video added to library
- [ ] Verify video added to lesson
- **Result:** PENDING

### Test 8: "Upload New Video" Always Accessible
- [ ] From video library picker, click "Upload New Video"
- [ ] Verify upload dialog opens
- [ ] Upload video
- [ ] Verify can return to library
- **Result:** PENDING

### Test 9: Heat Meter Accuracy
- [ ] Check multiple videos in library
- [ ] Verify heat meter reflects view counts
- [ ] High views = red
- [ ] Low views = green
- [ ] Medium views = yellow/orange
- **Result:** PENDING

### Test 10: Responsive Design
- [ ] Test at 375px width (mobile)
- [ ] Test at 768px width (tablet)
- [ ] Test at 1440px width (desktop)
- [ ] Course grid adapts
- [ ] Modals are mobile-friendly
- **Result:** PENDING

---

## 📸 Screenshots (MANDATORY - Use Playwright MCP!)

**Naming Convention:** `wave-2-agent-2-courses-[state]-[viewport].png`

Screenshots to capture:
- [ ] Empty state - desktop
- [ ] Create course modal - desktop
- [ ] Aspect ratio selector - close-up
- [ ] Chapter manager - desktop
- [ ] Add lesson dialog - desktop
- [ ] Video library picker - desktop
- [ ] Video card with heat meter - close-up
- [ ] Upload flow - desktop
- [ ] Populated courses grid - desktop
- [ ] Mobile view (375px) - each major state

**Save to:** User's Downloads folder (Playwright MCP default)

---

## 🚨 Issues Encountered

*Document any issues here as they arise*

---

## 🔗 Dependencies

- **Supabase Storage** - For video and image uploads
- **Video processing pipeline** - Transcription + vectorization
- **OpenAI Whisper** - Transcription
- **OpenAI Ada-002** - Embeddings for vector DB
- **Drag & Drop library** - `@dnd-kit/core` and `@dnd-kit/sortable`
- **Video analytics** - For heat meter calculations
- **Whop tier limits** - For storage limits display

---

## ✅ Completion Checklist

- [ ] Page title changed to "Courses"
- [ ] All 7 workflow states implemented
- [ ] Empty state working
- [ ] Create course modal with aspect ratio selector
- [ ] Chapter management with drag & drop
- [ ] Two-path lesson system (Insert vs Upload)
- [ ] Video library picker with statistics
- [ ] Heat meter component implemented (green→red gradient)
- [ ] Video upload flow working
- [ ] "Upload New Video" always accessible
- [ ] Quiz option shown as "Coming Soon"
- [ ] All components use Frosted UI
- [ ] Responsive design verified
- [ ] All Playwright tests passing
- [ ] Screenshots saved with Playwright MCP
- [ ] Code follows project patterns
- [ ] No console errors
- [ ] Ready for integration testing

---

## 📝 Implementation Notes

### Before Starting
- Review all 5 design reference images carefully
- Understand the two-path video system rationale (storage limits)
- Plan component hierarchy
- Set up Playwright MCP testing workflow
- Test WITH BROWSER OPEN as you build each feature

### Critical Implementation Details

**Aspect Ratio Handling:**
- Always maintain rectangular card size
- If 16:9: Fill rectangle naturally
- If 9:16: Center vertically, add padding left/right
- CSS: `object-fit: contain` with `object-position: center`

**Heat Meter Algorithm:**
```typescript
function getHeatColor(views: number, maxViews: number): string {
  const percentage = (views / maxViews) * 100;
  if (percentage < 25) return 'green';
  if (percentage < 50) return 'yellow';
  if (percentage < 75) return 'orange';
  return 'red';
}
```

**Two-Path System:**
- Insert = No upload, just link existing video
- Upload = New video, transcribe, vectorize, add to library, then link
- Both paths end with video in lesson
- Library grows with every upload
- Reuse prevents storage bloat

### During Implementation
- **USE PLAYWRIGHT MCP CONSTANTLY**
- Test each state as you build it
- Don't move to next state until current one works
- Take screenshots at each milestone
- Keep browser open to see changes live
- Test both happy path and error cases

### After Completion
- Full workflow test (empty → course → chapters → lessons → populated)
- Test with multiple courses
- Test with no videos in library (upload-only flow)
- Test with many videos in library (search/filter)
- Performance check (should handle 100+ videos)
- Mobile testing on actual device

---

## 🎯 Success Criteria

✅ Page title says "Courses" not "Videos"
✅ Complete 7-state workflow implemented
✅ Users can choose 16:9 or 9:16 aspect ratio
✅ Two-path video system works (Insert vs Upload)
✅ Heat meter accurately reflects video performance
✅ "Upload New Video" accessible from library picker
✅ Quiz option shows as "Coming Soon"
✅ Chapter management with drag & drop works
✅ All modals use Frosted UI
✅ Responsive on mobile, tablet, desktop
✅ All Playwright tests passing with browser verification
✅ Video library prevents redundant uploads
✅ Course builder matches design references exactly
