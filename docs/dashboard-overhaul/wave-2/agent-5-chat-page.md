# Wave 2 - Agent 5: Chat Page

**Agent:** Agent 5
**Wave:** Wave 2 - Page Development
**Status:** 🔵 Pending
**Start Time:** Not started
**End Time:** Not started
**Duration:** TBD

---

## 📋 Assigned Tasks

**Primary Goal:** Polish the Chat page with Frosted UI components

**Current State:** Basic implementation with chat session list and viewer
**Target State:** Polished, professional chat interface using Frosted UI throughout

### 1. Chat Session List Polish

**Left Sidebar - Session List:**
- List of all chat sessions
- Each session shows:
  - Session title (auto-generated or custom)
  - Last message preview (truncated)
  - Timestamp (relative time: "2 hours ago")
  - Student/user avatar or initials
  - Unread indicator (if applicable)
- Search/filter sessions
- Sort options:
  - Most recent
  - Most active
  - By student
- "New Session" button at top

**Replace Current Components:**
- Replace custom session list with Frosted UI List components
- Use Frosted UI Avatar for student icons
- Use Frosted UI Badge for unread counts
- Use Frosted UI Card for session items

### 2. Chat Message Viewer Polish

**Main Content Area - Messages:**
- Display selected session's messages
- Message bubbles:
  - Student messages: Left-aligned, light background
  - AI messages: Right-aligned, accent background
  - System messages: Centered, gray
- Each message shows:
  - Avatar/initials
  - Message content (formatted, with markdown support)
  - Timestamp
  - Video references (clickable chips/badges)
  - Cost indicator (tokens/$ for AI messages)

**Replace Current Components:**
- Use Frosted UI Message/Chat components
- Use Frosted UI Avatar
- Use Frosted UI Badge for video references
- Use Frosted UI Tooltip for cost info

### 3. Video References Display

**Clickable References:**
- When AI cites a video, show as clickable badge/chip
- Format: "📹 Video Title @ 12:34"
- Click to:
  - Option 1: Open video modal with timestamp
  - Option 2: Navigate to video page with timestamp
- Highlight in different color
- Hover shows video thumbnail preview

**Components:**
- Frosted UI Badge or Chip
- Custom VideoReferenceBadge component using Frosted UI
- Tooltip with thumbnail preview

### 4. Chat Input Area (if not already good)

**Message Input:**
- Text input for typing messages
- "Send" button
- Character count (if limit)
- Typing indicator (when AI is responding)
- File attachment button (future)

**Components:**
- Frosted UI Textarea or Input
- Frosted UI Button
- Frosted UI Spinner (for typing indicator)

### 5. Session Management Actions

**Actions per Session:**
- Rename session
- Delete session (with confirmation)
- Archive session
- Export session (JSON/Markdown)
- Share session link (future)

**UI:**
- Context menu (right-click or three-dot menu)
- Frosted UI DropdownMenu
- Frosted UI AlertDialog for confirmations

### 6. Empty States

**No Sessions:**
- Friendly empty state message
- "Start your first conversation" CTA
- Illustration or icon

**No Messages in Session:**
- "No messages yet" message
- Prompt to ask a question

**Components:**
- Frosted UI Card
- Frosted UI Button
- Custom EmptyState component using Frosted UI

### 7. Loading States

**While Loading:**
- Session list skeleton
- Message skeleton
- Smooth loading animations

**Components:**
- Frosted UI Skeleton
- Frosted UI Spinner

### 8. Mobile Responsiveness

**Mobile Layout:**
- Session list collapses to drawer/menu
- Messages take full width
- Floating "Back to sessions" button
- Sticky chat input

**Breakpoints:**
- < 768px: Mobile layout
- ≥ 768px: Two-column layout

---

## 📁 Files to Modify

- `app/dashboard/creator/chat/page.tsx`
  - [ ] Replace custom components with Frosted UI
  - [ ] Polish session list UI
  - [ ] Polish message viewer UI
  - [ ] Enhance video reference display
  - [ ] Add session management actions
  - [ ] Improve empty states
  - [ ] Add loading skeletons
  - [ ] Responsive design improvements
  - [ ] Error handling

---

## 🎨 Frosted UI Components to Use

- `Card` - Session items, message containers
- `List` / `ListItem` - Session list
- `Avatar` - User/student avatars
- `Badge` - Unread counts, video references
- `Button` - Actions, send button
- `Input` / `Textarea` - Message input, search
- `DropdownMenu` - Session actions
- `AlertDialog` - Delete confirmations
- `Tooltip` - Hover info, cost details
- `Skeleton` - Loading states
- `Spinner` - Loading indicator
- `Separator` - Visual dividers
- `ScrollArea` - Scrollable message area
- Design tokens: `--gray-*`, `--accent-*`

---

## 🧪 Playwright Tests Required (MANDATORY)

### Test 1: Chat Page Loads
- [ ] Navigate to /dashboard/creator/chat
- [ ] Verify session list displays
- [ ] Verify main content area displays
- [ ] No console errors
- **Result:** PENDING

### Test 2: Session List Display
- [ ] Verify all sessions show
- [ ] Check each session has title, preview, timestamp
- [ ] Verify avatars display
- [ ] Check sorting works (most recent, etc.)
- **Result:** PENDING

### Test 3: Select Session
- [ ] Click a session in list
- [ ] Verify messages load in main area
- [ ] Verify session is highlighted
- [ ] Check message bubbles render correctly
- **Result:** PENDING

### Test 4: Message Display
- [ ] Verify student messages left-aligned
- [ ] Verify AI messages right-aligned
- [ ] Check timestamps show
- [ ] Verify markdown formatting works
- **Result:** PENDING

### Test 5: Video References
- [ ] Find message with video reference
- [ ] Verify clickable badge displays
- [ ] Hover to see thumbnail
- [ ] Click to open video (or navigate)
- **Result:** PENDING

### Test 6: Session Actions
- [ ] Right-click session (or click three-dot menu)
- [ ] Verify context menu opens
- [ ] Test "Rename" action
- [ ] Test "Delete" action (with confirmation)
- [ ] Test "Archive" action
- **Result:** PENDING

### Test 7: Search Sessions
- [ ] Type in search box
- [ ] Verify sessions filter in real-time
- [ ] Check empty state if no matches
- **Result:** PENDING

### Test 8: Empty States
- [ ] Clear all sessions (or use test account)
- [ ] Verify empty state displays
- [ ] Check CTA button works
- **Result:** PENDING

### Test 9: Loading States
- [ ] Force slow network (throttle)
- [ ] Verify skeletons show while loading
- [ ] Check smooth transition to loaded state
- **Result:** PENDING

### Test 10: Responsive Design
- [ ] Test at 375px (mobile)
- [ ] Verify session list collapses
- [ ] Test at 768px (tablet)
- [ ] Test at 1440px (desktop)
- [ ] Check two-column layout on desktop
- **Result:** PENDING

---

## 📸 Screenshots (MANDATORY - Use Playwright MCP!)

**Naming Convention:** `wave-2-agent-5-chat-[feature]-[viewport].png`

Screenshots to capture:
- [ ] Full chat page - desktop (two columns)
- [ ] Session list - close-up
- [ ] Message viewer with conversation - desktop
- [ ] Video reference badge - close-up with hover
- [ ] Session context menu - open state
- [ ] Empty state - no sessions
- [ ] Loading state with skeletons
- [ ] Mobile view (375px) - session list
- [ ] Mobile view (375px) - messages
- [ ] Search in action

---

## 🚨 Issues Encountered

*Document any issues here as they arise*

---

## 🔗 Dependencies

- **Chat sessions** - `chat_sessions` table
- **Chat messages** - `chat_messages` table
- **Video references** - Parse from message content or separate table
- **RAG system** - For creating new sessions
- **Cost calculation** - For displaying AI message costs
- **Video metadata** - For thumbnail previews

---

## ✅ Completion Checklist

- [ ] All custom components replaced with Frosted UI
- [ ] Session list polished
- [ ] Message viewer polished
- [ ] Video references clickable and functional
- [ ] Session management actions working
- [ ] Search and filter working
- [ ] Empty states implemented
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] All Playwright tests passing
- [ ] Screenshots saved
- [ ] No console errors
- [ ] Code follows project patterns
- [ ] Ready for integration testing

---

## 📝 Implementation Notes

### Before Starting
- Review current chat page implementation
- Identify all custom components to replace
- Check Frosted UI documentation for Chat/Message components
- Plan component hierarchy
- Test Playwright MCP with current chat page

### Message Format
```typescript
interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  video_references?: VideoReference[];
  tokens_used?: { input: number; output: number };
  cost?: number;
  created_at: string;
}
```

### Video Reference Format
```typescript
interface VideoReference {
  video_id: string;
  video_title: string;
  timestamp: number; // seconds
  thumbnail_url?: string;
  snippet?: string; // relevant excerpt
}
```

### Layout Structure
```tsx
<div className="flex h-full">
  {/* Left sidebar - Sessions */}
  <aside className="w-80 border-r">
    <SessionList />
  </aside>

  {/* Main content - Messages */}
  <main className="flex-1">
    <MessageViewer />
    <ChatInput />
  </main>
</div>
```

### During Implementation
- **USE PLAYWRIGHT MCP** - Test each section as you polish it
- Start with session list, then move to messages
- Replace one component type at a time
- Test interactions (click, hover, select)
- Verify responsive behavior
- Check accessibility (keyboard navigation)

### After Completion
- Full chat workflow test (browse sessions → read messages → interact)
- Test with different session states (empty, 1 session, many sessions)
- Test with long message threads
- Mobile testing on actual device
- Performance check with many sessions

---

## 🎯 Success Criteria

✅ All Frosted UI components used consistently
✅ Session list is polished and easy to navigate
✅ Messages display beautifully with proper formatting
✅ Video references are clickable with thumbnail previews
✅ Session management actions work smoothly
✅ Search and filter functionality working
✅ Empty states are friendly and helpful
✅ Loading states are smooth with skeletons
✅ Responsive on mobile, tablet, desktop
✅ All Playwright tests passing with browser verification
✅ Professional, polished chat interface
✅ Matches overall Chronos design system
