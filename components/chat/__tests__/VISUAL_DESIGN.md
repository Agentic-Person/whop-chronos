# Visual Design Documentation
## Clickable Video Timestamp Citations

---

## Component: TimestampBadge

### Default State
```
┌─────────────────┐
│ 🕐 14:07        │  ← Clock icon + timestamp
└─────────────────┘

Colors:
- Background: black/80 (rgba(0,0,0,0.8))
- Text: white
- Border-radius: full (pill shape)
- Padding: px-2.5 py-1
- Font-size: xs (12px)
- Font-weight: semibold
```

### Hover State
```
┌─────────────────┐
│ ▶ 14:07  ✨     │  ← Play icon + glow effect
└─────────────────┘

Changes on Hover:
- Icon: Clock → Play (filled)
- Scale: 105% (slightly larger)
- Shadow: md (elevated)
- Glow: Purple/blue gradient blur behind badge
```

### Active State (Currently Playing)
```
┌─────────────────────────┐
│ ▶ 14:07                 │  ← Purple gradient background
└─────────────────────────┘

Colors:
- Background: Gradient from purple-9 to blue-9
- Text: white
- Shadow: md
- Icon: Play (always shown)
```

### Click Animation
```
Frame 1 (0ms):     ┌─────────┐
                   │ ▶ 14:07 │
                   └─────────┘

Frame 2 (50ms):    ┌──────────┐  ⭕ ← Ripple starts
                   │ ▶ 14:07  │
                   └──────────┘

Frame 3 (150ms):   ┌─────────┐  ⭕⭕ ← Ripple expands
                   │ ▶ 14:07 │     (ping animation)
                   └─────────┘

Frame 4 (300ms):   ┌─────────┐
                   │ ▶ 14:07 │  ← Back to normal
                   └─────────┘
```

### Accessibility (Keyboard Focus)
```
┌─────────────────────┐
║ 🕐 14:07           ║  ← Focus ring (2px purple)
└─────────────────────┘

Focus Ring:
- Color: purple-9
- Width: 2px
- Offset: 2px
- Visible on keyboard tab
```

---

## Component: VideoReferenceCard

### Default State
```
┌────────────────────────────────────────────────────────┐
│                          ╔════════════════════╗         │
│  ┌──────────────┐       ║  Video Title       ║         │
│  │              │       ╚════════════════════╝         │
│  │  Thumbnail   │                                      │
│  │    Image     │       "This is the excerpt from the  │
│  │              │        video transcript showing..."  │
│  │    [14:07]   │  ←    Timestamp badge                │
│  └──────────────┘       Click to play                  │
│                                                         │
│                         ████████░░ 87%                  │
└────────────────────────────────────────────────────────┘

Layout:
- Card: White background, border, rounded-lg
- Thumbnail: 128px × 80px (w-32 h-20)
- Timestamp Badge: Bottom-right corner of thumbnail
- Excerpt: 2 lines max (line-clamp-2)
- Progress Bar: Relevance score visualization
```

### Hover State
```
┌────────────────────────────────────────────────────────┐ ↑
│                          ╔════════════════════╗         │ │ Shadow
│  ┌──────────────┐       ║  Video Title       ║ ← Purple│ │ Lifted
│  │   [Play ▶]   │       ╚════════════════════╝         │ ↓
│  │  Thumbnail   │                                      │
│  │   (scaled)   │       "This is the excerpt from the  │
│  │              │        video transcript showing..."  │
│  │  [▶ 14:07]   │  ←    Play icon on timestamp         │
│  └──────────────┘       Click to play                  │
│                                                         │
└────────────────────────────────────────────────────────┘

Changes on Hover:
- Card: Shadow increases (shadow-lg)
- Thumbnail: Scales to 105%
- Play Overlay: Appears over thumbnail (black/40 opacity)
- Timestamp Badge: Shows play icon, scales up
- Title: Changes to purple color
```

### Current Video State (isCurrentVideo=true)
```
╔════════════════════════════════════════════════════════╗ ← Purple ring
║                          ╔════════════════════╗         ║
║  ┌──────────────┐       ║  Video Title       ║         ║
║  │              │       ╚════════════════════╝         ║
║  │  Thumbnail   │                                      ║
║  │              │       "This is the excerpt from the  ║
║  │              │        video transcript showing..."  ║
║  │  [▶ 14:07]   │  ←    Purple gradient badge          ║
║  └──────────────┘       Playing now ⬅                  ║
║                                                         ║
╚════════════════════════════════════════════════════════╝

Changes when Current Video:
- Card Border: 2px purple ring (ring-2 ring-purple-9)
- Ring Offset: 2px spacing (ring-offset-2)
- Timestamp Badge: Active state (purple gradient)
- Footer Text: "Playing now" instead of "Click to play"
```

---

## Component: Toast Notifications

### Warning Toast (Different Video)
```
┌────────────────────────────────────────────────┐
│  ⚠  This timestamp is from "Introduction to   │
│     React Hooks". Switch to that video to     │
│     view this moment.                    ✕    │
└────────────────────────────────────────────────┘

Slide in from top ↓
├─ 0ms:   [Hidden above viewport]
├─ 100ms: [Sliding down]
└─ 300ms: [Fully visible]

Colors:
- Background: yellow-50
- Border: yellow-200
- Text: yellow-900
- Icon: yellow-600
- Auto-dismiss: 7000ms (7 seconds)
```

### Success Toast (Timestamp Jump)
```
┌────────────────────────────────────────────────┐
│  ✓  Jumped to 14:07                       ✕   │
└────────────────────────────────────────────────┘

Colors:
- Background: green-50
- Border: green-200
- Text: green-900
- Icon: green-600
- Auto-dismiss: 5000ms (5 seconds)
```

### Info Toast
```
┌────────────────────────────────────────────────┐
│  ℹ  Message content here                  ✕   │
└────────────────────────────────────────────────┘

Colors:
- Background: blue-50
- Border: blue-200
- Text: blue-900
- Icon: blue-600
```

### Error Toast
```
┌────────────────────────────────────────────────┐
│  ⓧ  Invalid timestamp                     ✕   │
└────────────────────────────────────────────────┘

Colors:
- Background: red-50
- Border: red-200
- Text: red-900
- Icon: red-600
```

### Toast Positioning
```
Screen Layout:

┌─────────────────────────────────────┐
│                                     │
│         ┌─────────────────┐  ← Toast container
│         │  Toast 1        │     (fixed top-4 right-4)
│         │  Toast 2        │     (z-50)
│         │  Toast 3        │     (max-w-md)
│         └─────────────────┘
│                                     │
│                                     │
│          Main Content               │
│                                     │
│                                     │
└─────────────────────────────────────┘

Multiple Toasts:
- Stacked vertically with gap-2
- Newest toast on top
- Max 5 toasts at once (auto-dismiss oldest)
```

---

## Component: MessageList with Video References

### Layout Example
```
┌────────────────────────────────────────────────────────┐
│  User Message (right-aligned)                          │
│                               ┌──────────────────────┐ │
│                               │ What is a React Hook?│ │
│                               └──────────────────────┘ │
│                                      2 minutes ago      │
│                                                         │
│  Assistant Message (left-aligned)                      │
│  ┌────────────────────────────────────────────┐        │
│  │ React Hooks are functions that let you...  │        │
│  └────────────────────────────────────────────┘        │
│  2 minutes ago                                          │
│                                                         │
│  Referenced in videos:                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Thumbnail]  Introduction to React Hooks    🔘  │  │ ← Current video
│  │   [▶ 14:07]   "In this section we discuss..."    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Thumbnail]  Advanced Hook Patterns              │  │
│  │   [🕐 5:23]   "Here's a more complex example..."  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

Message Bubbles:
- User: Purple gradient (right-aligned)
- Assistant: White with border (left-aligned)
- Max width: 85% of container
- Border-radius: 2xl (16px)
- Shadow: sm
```

---

## Color Palette (Frosted UI)

### Primary Colors
```
Purple Scale:
- purple-9:  #8b5cf6  (Primary actions, active states)
- purple-10: #7c3aed  (Hover states)

Blue Scale:
- blue-9:    #3b82f6  (Gradient endpoint)
- blue-10:   #2563eb  (Hover gradient endpoint)

Gray Scale:
- gray-2:    #f9fafb  (Background light)
- gray-3:    #f3f4f6  (Hover background)
- gray-4:    #e5e7eb  (Border light)
- gray-11:   #1f2937  (Text secondary)
- gray-12:   #111827  (Text primary)

Semantic Colors:
- Success: green-50, green-200, green-600, green-900
- Warning: yellow-50, yellow-200, yellow-600, yellow-900
- Error:   red-50, red-200, red-600, red-900
- Info:    blue-50, blue-200, blue-600, blue-900
```

---

## Animations & Transitions

### Duration Standards
```
Fast:    150ms  (Icon changes, small movements)
Normal:  200ms  (Hover effects, scale changes)
Medium:  300ms  (Badge click, toast entrance)
Slow:    500ms  (Large movements, complex animations)
```

### Easing Functions
```
Default:     ease-in-out
Spring:      cubic-bezier(0.68, -0.55, 0.265, 1.55)
Smooth:      cubic-bezier(0.4, 0.0, 0.2, 1)
```

### Animation Classes
```css
/* Badge Hover */
.timestamp-badge:hover {
  transform: scale(1.05);
  transition: transform 200ms ease-in-out;
}

/* Badge Click */
.timestamp-badge:active {
  transform: scale(0.95);
  transition: transform 150ms ease-in-out;
}

/* Toast Entrance */
@keyframes slide-in-from-top {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Ripple Effect */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

---

## Responsive Breakpoints

### Mobile (< 768px)
```
- Video cards: Full width
- Timestamp badge: Smaller (text-xs)
- Toast: 90% width, centered
- Message bubbles: 95% max-width
```

### Tablet (768px - 1024px)
```
- Video cards: 2 columns (if grid layout)
- Timestamp badge: Normal size
- Toast: Fixed width (max-w-md)
- Message bubbles: 85% max-width
```

### Desktop (> 1024px)
```
- Video cards: 3 columns (if grid layout)
- Timestamp badge: Normal size
- Toast: Fixed width (max-w-md)
- Message bubbles: 85% max-width
- Sidebar: Visible by default
```

---

## Dark Mode Support

### Note
The current implementation uses Frosted UI which has built-in dark mode support. However, the timestamp badge uses fixed black/white colors. For full dark mode support, update:

```typescript
// Current (Light mode only)
className="bg-black/80 text-white"

// Dark mode ready
className="bg-black/80 dark:bg-white/90 text-white dark:text-gray-900"
```

This is a future enhancement - not critical for Wave 1.

---

## Icon Usage

### Icons from lucide-react

| Component | Icon | Usage |
|-----------|------|-------|
| TimestampBadge (default) | Clock | Indicates timestamp |
| TimestampBadge (hover) | Play (filled) | Indicates clickable |
| VideoReferenceCard | Play | Video playback |
| Toast (info) | Info | Information |
| Toast (success) | CheckCircle | Success |
| Toast (warning) | AlertTriangle | Warning |
| Toast (error) | AlertCircle | Error |
| Toast (close) | X | Close button |

All icons use consistent sizing:
- Small: h-3 w-3 (12px)
- Medium: h-4 w-4 (16px)
- Large: h-5 w-5 (20px)

---

**Design System Compliance:** ✅ Frosted UI
**Accessibility:** ✅ WCAG 2.1 AA
**Responsiveness:** ✅ Mobile-first
**Browser Support:** ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
