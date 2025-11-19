# YouTube CourseBuilder Fix Plan

**Created:** November 18, 2025
**Priority:** P1 (High)
**Estimated Time:** 3-4 hours
**Status:** Ready for Implementation

---

## 🎯 Executive Summary

The YouTube video embedding feature has a **fully functional backend** (transcript extraction, processing, database storage) but a **broken frontend integration** where imported YouTube videos display as **empty blue boxes** in the CourseBuilder UI, making the course creation workflow unusable.

**Root Cause:** Data structure mismatch between `VideoUrlUploader` (passes video ID string) and `CourseBuilder` (expects full object with thumbnail, title, duration).

**Good News:** Fix code already exists in both components but was never browser-tested. This is likely a 3-4 hour fix requiring API endpoint verification and field name mapping correction.

---

## 🔴 Problem Description

### Current Symptoms

1. **Empty Blue Boxes** - YouTube videos import successfully but display as empty blue rectangles in CourseBuilder lesson list
2. **Missing Metadata** - No thumbnail, title, or duration visible for imported videos
3. **Drag-Drop Broken** - Videos can't be properly manipulated in the course structure
4. **Visual Regression** - Expected: video cards with thumbnails. Actual: blank placeholder boxes

### User Impact

- **Creators:** Cannot build courses with YouTube videos
- **Workflow:** Core course-building functionality unusable with YouTube sources
- **Experience:** Confusing UI with no visual feedback about imported content

### Status

- ✅ Backend: 100% functional (transcript extraction, database, processing)
- ❌ Frontend: Broken integration (data flow issue)
- ⚠️ Fix Code: Present but untested

---

## 🔍 Root Cause Analysis

### The Data Structure Mismatch

**VideoUrlUploader's Behavior:**
```typescript
// File: components/courses/VideoUrlUploader.tsx (Line 9)
onComplete?: (video: string) => void;  // ❌ Only passes video ID string
```

**CourseBuilder's Expectation:**
```typescript
// File: components/courses/CourseBuilder.tsx (Lines 236-295)
const handleVideoSelected = async (video: any) => {
  // Expects full object:
  {
    id: string;
    title: string;
    thumbnail: string;   // ❌ Not provided - causes empty box
    duration: number;    // ❌ Not provided
  }
}
```

### Data Flow Breakdown

**Current (Broken) Flow:**
```
1. User imports YouTube URL
   └─ POST /api/video/youtube/import
   └─ Backend: ✅ Extracts transcript, saves to DB
   └─ Returns: { success: true, video: { id, title, youtube_video_id } }

2. VideoUrlUploader polls /api/video/{id}/status
   └─ Waits for status: 'completed'
   └─ Calls: onComplete(currentVideoId)  // ❌ ONLY STRING ID

3. CourseBuilder receives: "uuid-string-here"
   └─ Creates lesson: { title: undefined, thumbnail: undefined }
   └─ Renders: Empty blue box (no thumbnail URL)
```

**Expected (Fixed) Flow:**
```
1. [Same backend - works correctly]

2. VideoUrlUploader polls status
   └─ Status: 'completed'
   └─ ✅ NEW: Fetches GET /api/video/{id}
   └─ Gets: { id, title, thumbnailUrl, duration }
   └─ Calls: onComplete(fullVideoObject)  // ✅ FULL OBJECT

3. CourseBuilder receives full object
   └─ Creates lesson with all metadata
   └─ Renders: Proper video card with thumbnail ✅
```

---

## 📋 4-Phase Fix Strategy

### Phase 1: Verification & Diagnosis (30 minutes)

**Objective:** Understand current API state and identify exact fix needed

#### Tasks

1. **Check if `/api/video/[id]/route.ts` endpoint exists**
   ```bash
   # Search for the endpoint file
   ls -la app/api/video/\[id\]/route.ts

   # OR find in codebase
   find app/api/video -name "route.ts" -path "*/\[id\]/*"
   ```

2. **Test API endpoint directly**
   ```bash
   # First, import a test YouTube video through the UI
   # Then test the endpoint:

   curl http://localhost:3000/api/video/{VIDEO_ID} | jq
   ```

3. **Verify response structure**

   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "id": "uuid-here",
       "title": "Video Title",
       "thumbnailUrl": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
       "duration": 300,
       "youtubeVideoId": "dQw4w9WgXcQ",
       "status": "completed"
     }
   }
   ```

4. **Identify field name mapping**

   Check if API returns:
   - `thumbnailUrl` (camelCase) ✅
   - `thumbnail_url` (snake_case) ⚠️
   - `thumbnail` (no suffix) ⚠️

#### Verification Checklist

- [ ] Endpoint exists at `/app/api/video/[id]/route.ts`
- [ ] Endpoint returns 200 OK for valid video ID
- [ ] Response includes `thumbnailUrl` field
- [ ] Response includes `duration` field
- [ ] Response includes `title` field
- [ ] Field names match what frontend expects

---

### Phase 2: Implementation (1-2 hours)

**Objective:** Fix the data flow issue based on Phase 1 findings

#### Scenario A: Endpoint Exists, Wrong Field Names

**If API returns `thumbnail_url` (snake_case):**

Update `components/courses/VideoUrlUploader.tsx` (Line 74):

```typescript
// BEFORE:
thumbnail: videoData.data.thumbnailUrl || null,

// AFTER:
thumbnail: videoData.data.thumbnail_url || null,
duration: videoData.data.duration_seconds || videoData.data.duration || 0,
```

#### Scenario B: Endpoint Missing

**Create `/app/api/video/[id]/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const supabase = getServiceSupabase();

    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        thumbnail_url,
        duration_seconds,
        youtube_video_id,
        source_type,
        status,
        transcript,
        created_at
      `)
      .eq('id', id)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // Transform snake_case to camelCase for frontend
    return NextResponse.json({
      success: true,
      data: {
        id: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnail_url,
        duration: video.duration_seconds,
        youtubeVideoId: video.youtube_video_id,
        sourceType: video.source_type,
        status: video.status,
        transcript: video.transcript,
        createdAt: video.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Scenario C: Need Data Transformer (Recommended)

**Create `lib/video/transformers.ts`:**

```typescript
/**
 * Transform API video data (snake_case) to frontend format (camelCase)
 */
export interface ApiVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
  youtube_video_id?: string;
  source_type: 'youtube' | 'loom' | 'whop' | 'upload';
  status: string;
  transcript?: string;
  created_at: string;
}

export interface FrontendVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  videoId?: string;
  sourceType: string;
  status: string;
  transcript?: string;
  createdAt: string;
}

export function apiVideoToFrontend(apiVideo: ApiVideo): FrontendVideo {
  return {
    id: apiVideo.id,
    title: apiVideo.title,
    thumbnail: apiVideo.thumbnail_url,
    duration: apiVideo.duration_seconds,
    videoId: apiVideo.youtube_video_id || apiVideo.id,
    sourceType: apiVideo.source_type,
    status: apiVideo.status,
    transcript: apiVideo.transcript,
    createdAt: apiVideo.created_at,
  };
}
```

**Then update VideoUrlUploader.tsx to use transformer:**

```typescript
import { apiVideoToFrontend } from '@/lib/video/transformers';

// In the status polling section (around line 74):
if (videoResponse.ok) {
  const videoData = await videoResponse.json();
  if (videoData.success && videoData.data) {
    const frontendVideo = apiVideoToFrontend(videoData.data);
    onComplete(frontendVideo);
  }
}
```

#### Files to Modify

**Required (pick one approach):**
- Option A: `components/courses/VideoUrlUploader.tsx` (field mapping)
- Option B: `app/api/video/[id]/route.ts` (create endpoint)
- Option C: `lib/video/transformers.ts` (NEW) + VideoUrlUploader.tsx

**Verify Fix is Present:**
- `components/courses/CourseBuilder.tsx` (lines 297-330 - handles both string/object)

---

### Phase 3: Browser Testing (1 hour)

**Objective:** Verify the fix works end-to-end in real browser

#### Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to CourseBuilder**
   ```
   http://localhost:3000/dashboard/creator/courses
   ```

3. **Import YouTube Video**
   - Click "Add Lesson" → "Add from URL"
   - Paste YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
   - Click "Import"
   - Wait for processing to complete

4. **Verify Visual Display**
   - [ ] Video card displays (not blue box)
   - [ ] Thumbnail image loads correctly
   - [ ] Title is visible
   - [ ] Duration is visible (e.g., "5:23")
   - [ ] Video is clickable

5. **Test Drag & Drop**
   - [ ] Video card can be selected
   - [ ] Can drag to reorder lessons
   - [ ] Reordering persists after drag

6. **Check Browser Console**
   - [ ] No red errors during import
   - [ ] No 404 errors for API calls
   - [ ] No "undefined thumbnail" warnings
   - [ ] API responses logged correctly (check Network tab)

7. **Test Multiple Videos**
   - Import 2-3 different YouTube videos
   - All should display correctly
   - Different thumbnails should load

8. **Test Course Saving**
   - Add videos to course
   - Save course
   - Refresh page
   - Videos still display correctly

#### Browser Testing Checklist

- [ ] YouTube import completes successfully
- [ ] Thumbnail displays (no blue box)
- [ ] Title displays correctly
- [ ] Duration displays correctly
- [ ] Video card is interactive (click/select)
- [ ] Drag-drop reordering works
- [ ] Changes persist after save
- [ ] No console errors
- [ ] Network requests succeed (200 OK)
- [ ] Multiple videos work correctly

---

### Phase 4: Documentation (30 minutes)

**Objective:** Update project documentation to reflect fixed status

#### Documentation Updates

1. **Create Resolution Document**

   File: `docs/features/videos/YOUTUBE_COURSEBUILDER_RESOLUTION.md`

   Contents:
   - Problem description
   - Root cause identified
   - Solution implemented
   - Code changes made
   - Testing verification
   - Before/after screenshots
   - Lessons learned

2. **Update PROJECT_STATUS.md**

   Changes:
   ```markdown
   # BEFORE:
   #### 9. Course Builder (C+)
   **Status:** Backend complete, frontend broken by YouTube integration
   **Grade:** 75%
   - ❌ **BROKEN:** YouTube video import breaks UI
   - ❌ **BROKEN:** Videos don't display in lessons

   # AFTER:
   #### 9. Course Builder (B+)
   **Status:** Fully functional with all video sources
   **Grade:** 85%
   - ✅ YouTube video import working
   - ✅ Videos display with thumbnails in lessons
   - ✅ Drag-drop functionality operational
   ```

   Also update P1 issue section:
   ```markdown
   ### ✅ YouTube Embedding CourseBuilder (P1) - RESOLVED
   **Resolution Date:** November [DATE], 2025
   **Root Cause:** Data structure mismatch (fixed)
   **Solution:** [Brief description of fix implemented]
   ```

3. **Update CLAUDE.md**

   Remove or update the warning:
   ```markdown
   # BEFORE:
   **WARNING:** YouTube embedding feature has broken frontend (CourseBuilder UI). Backend processing works but videos don't display. System is NOT usable.

   # AFTER:
   ✅ **YouTube Embedding:** Fully functional. Videos import, process, and display correctly in CourseBuilder.
   ```

4. **Update Implementation Status**

   File: `docs/features/videos/implementation-status.md`

   Mark YouTube CourseBuilder integration as ✅ Complete

#### Documentation Checklist

- [ ] Create YOUTUBE_COURSEBUILDER_RESOLUTION.md
- [ ] Update PROJECT_STATUS.md (Course Builder grade C+ → B+)
- [ ] Update PROJECT_STATUS.md (P1 issue → RESOLVED)
- [ ] Update CLAUDE.md (remove warning)
- [ ] Update implementation-status.md (mark complete)
- [ ] Add screenshots to resolution doc
- [ ] Update production readiness score (if applicable)

---

## 📁 Files Involved

### Primary Components to Review/Modify

1. **VideoUrlUploader.tsx**
   - Location: `components/courses/VideoUrlUploader.tsx`
   - Lines 48-107: Status polling with video fetch (**Fix code present here**)
   - Lines 61-92: Fetch `/api/video/{id}` after status complete
   - Line 74: Field mapping for `thumbnail` and `duration`
   - **Action:** Verify field names match API response

2. **CourseBuilder.tsx**
   - Location: `components/courses/CourseBuilder.tsx`
   - Lines 297-330: `handleVideoUploaded` (**Fix code present here**)
   - Handles both string ID and full object formats
   - **Action:** Usually no changes needed (already handles both formats)

3. **Video Details API Endpoint**
   - Location: `app/api/video/[id]/route.ts`
   - **Status:** May need to be created
   - **Action:** Create if missing, verify response structure

### Reference Components (Working Examples)

4. **VideoLibraryPicker.tsx**
   - Location: `components/courses/VideoLibraryPicker.tsx`
   - Lines 6-15: Correct Video interface definition
   - **Use as:** Reference for expected data structure

### Supporting Files

5. **Video Types**
   - Location: `lib/video/types.ts`
   - Lines 16-36: Video interface (uses `thumbnail_url`)
   - **Note:** Database uses snake_case, frontend expects camelCase

6. **YouTube Import API**
   - Location: `app/api/video/youtube/import/route.ts`
   - Lines 132-154: Database insert (backend works)
   - **Status:** ✅ No changes needed (works correctly)

### New Files to Create (Optional)

7. **Data Transformer (Recommended)**
   - Location: `lib/video/transformers.ts` (NEW)
   - Purpose: Normalize API ↔ Frontend data structures
   - Benefit: Single source of truth for field mapping

---

## 🎯 Success Criteria

### Must Have (P0)

- ✅ YouTube videos import without errors
- ✅ Video cards display with thumbnails (no blue boxes)
- ✅ Title and duration visible in CourseBuilder
- ✅ Videos are clickable and selectable
- ✅ No console errors during import

### Should Have (P1)

- ✅ Drag-drop reordering works
- ✅ Changes persist to database
- ✅ Multiple videos work correctly
- ✅ Course saving/loading works

### Nice to Have (P2)

- ✅ Loading states display during import
- ✅ Error handling for failed imports
- ✅ Thumbnail fallbacks for missing images

---

## ⚠️ Known Issues & Edge Cases

### Field Name Inconsistencies

**Problem:** Database uses `thumbnail_url`, API might return `thumbnailUrl`, frontend expects `thumbnail`

**Solution:** Use data transformer for consistency

### Missing Thumbnails

**Problem:** Some YouTube videos don't have high-res thumbnails

**Solution:** Implement fallback chain:
```typescript
const thumbnail =
  videoData.thumbnailUrl ||
  `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg` ||
  `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` ||
  '/placeholder-video.png';
```

### Duration Format

**Problem:** Database stores `duration_seconds` (integer), frontend may expect formatted string

**Solution:** Store raw seconds, format in UI component

---

## 📊 Risk Assessment

### Low Risk ✅

- Fix code already present in components
- Backend fully functional
- Likely just API endpoint or field name issue
- Isolated to CourseBuilder (won't affect other features)

### Medium Risk ⚠️

- Needs browser testing (not tested yet)
- May need data migration if field names change
- Could affect other video import flows

### Mitigation Strategies

1. **Test in isolation:** Only test CourseBuilder, don't touch working features
2. **Feature flag:** Could add `ENABLE_YOUTUBE_COURSEBUILDER` env var
3. **Rollback plan:** Git commit before changes, easy to revert
4. **Incremental testing:** Test each phase before proceeding

---

## ⏱️ Time Estimates

### Optimistic (2-3 hours)

- Endpoint exists, just wrong field names
- Simple VideoUrlUploader fix
- Quick browser test
- Fast documentation update

### Realistic (3-4 hours)

- Need to create API endpoint
- Implement data transformer
- Thorough browser testing
- Complete documentation

### Pessimistic (5-6 hours)

- Multiple issues discovered
- Database schema changes needed
- Extensive debugging required
- Complex integration issues

**Target:** 3-4 hours (realistic scenario)

---

## 🚀 Implementation Checklist

### Pre-Implementation

- [ ] Read this entire fix plan
- [ ] Understand data flow diagram
- [ ] Review referenced code files
- [ ] Set up development environment
- [ ] Start dev server (`npm run dev`)

### Phase 1: Verification (30 min)

- [ ] Check if `/api/video/[id]/route.ts` exists
- [ ] Import test YouTube video
- [ ] Test API endpoint manually
- [ ] Verify response structure
- [ ] Document field names (thumbnailUrl vs thumbnail_url)

### Phase 2: Implementation (1-2 hours)

- [ ] Choose fix approach (A, B, or C)
- [ ] Make code changes
- [ ] Test locally with `npm run dev`
- [ ] Verify no TypeScript errors
- [ ] Verify no build errors

### Phase 3: Browser Testing (1 hour)

- [ ] Import YouTube video in CourseBuilder
- [ ] Verify thumbnail displays
- [ ] Test drag-drop
- [ ] Check console for errors
- [ ] Test multiple videos
- [ ] Test course saving

### Phase 4: Documentation (30 min)

- [ ] Create YOUTUBE_COURSEBUILDER_RESOLUTION.md
- [ ] Update PROJECT_STATUS.md
- [ ] Update CLAUDE.md
- [ ] Update implementation-status.md
- [ ] Take screenshots (before/after)

### Finalization

- [ ] Run tests: `npm test`
- [ ] Run build: `npm run build`
- [ ] Commit changes with proper message
- [ ] Push to GitHub
- [ ] Update issue/ticket status

---

## 📞 Support & References

### Related Documentation

- **Investigation Report:** (Plan agent output from Nov 18)
- **Previous Fix Attempt:** `docs/archive/test-video-fix.md`
- **Implementation Status:** `docs/features/videos/implementation-status.md`
- **Project Status:** `docs/PROJECT_STATUS.md`

### Key Code References

- **Working Video Import:** `components/courses/VideoLibraryPicker.tsx` (lines 6-15)
- **YouTube Backend:** `app/api/video/youtube/import/route.ts`
- **Video Types:** `lib/video/types.ts`

### Getting Help

- **Check console logs** for detailed error messages
- **Use browser Network tab** to inspect API responses
- **Review Git history** for previous YouTube-related commits
- **Consult CLAUDE.md** for project-specific patterns

---

## 📝 Notes for Implementation

### Important Reminders

1. **Don't overthink it** - This is likely a simple field name mapping issue
2. **Test incrementally** - Verify each phase before moving on
3. **Keep it simple** - Use data transformer approach (Scenario C) for cleanest solution
4. **Document as you go** - Take screenshots, note issues encountered
5. **Commit frequently** - Easier to rollback if needed

### Debugging Tips

If videos still don't display after fix:

1. **Check browser console** - Look for 404s or undefined errors
2. **Inspect Network tab** - Verify `/api/video/{id}` returns correct data
3. **Add console.logs** - Log video data at each step
4. **Check database** - Verify `thumbnail_url` field has data
5. **Test with different videos** - Some YouTube videos may not have thumbnails

### Common Pitfalls

- ❌ Forgetting to restart dev server after API changes
- ❌ Mixing up `thumbnail_url` vs `thumbnailUrl` vs `thumbnail`
- ❌ Not handling null/undefined thumbnails
- ❌ Assuming fix code works without browser testing
- ❌ Modifying working code (VideoLibraryPicker) unnecessarily

---

**Status:** Ready for Implementation
**Next Steps:** Start with Phase 1 verification, proceed sequentially through phases
**Questions?** Refer to investigation report or PROJECT_STATUS.md

---

**Last Updated:** November 18, 2025
**Prepared By:** Claude Code Investigation Agent
**Estimated Completion:** 3-4 hours from start
