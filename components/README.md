# Chronos Components

This directory contains all React components for the Chronos application.

## Directory Structure

```
components/
├── layout/           # Main layout components (Header, Sidebar, Footer, DashboardLayout)
├── ui/              # Reusable UI primitives (Button, Card, Input, Badge, Spinner)
├── video/           # Video-related components (planned)
├── chat/            # AI chat interface components (planned)
├── courses/         # Course builder components (planned)
└── analytics/       # Data visualization components (planned)
```

## Completed Components

### Layout Components (`components/layout/`)

All layout components are complete and ready to use:

#### `Header.tsx`
- Sticky header with navigation
- User menu with dropdown
- Notifications bell with badge
- Responsive mobile menu button
- Logo and branding
- Props: `onMenuClick`, `showMenuButton`, `userRole`

#### `Sidebar.tsx`
- Fixed sidebar navigation
- Role-based navigation (creator/student)
- Active route highlighting
- Mobile overlay and close button
- Plan badge at bottom
- Props: `userRole`, `isOpen`, `onClose`

#### `Footer.tsx`
- Multi-column footer layout
- Product, support, and legal links
- Social media links
- Copyright notice
- Fully responsive

#### `DashboardLayout.tsx`
- Main dashboard wrapper
- Combines Header, Sidebar, and optional Footer
- Manages sidebar open/close state
- Responsive layout with mobile support
- Props: `children`, `userRole`, `showFooter`

### UI Components (`components/ui/`)

Reusable UI primitives with consistent styling:

#### `Card.tsx`
- Base card container with variants
- Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Props: `padding` (none/sm/md/lg), `hover`, `className`

#### `Button.tsx`
- Primary, secondary, outline, ghost, and danger variants
- Three sizes: sm, md, lg
- Loading state with spinner
- Icon support (left/right positioning)
- Fully accessible with focus states

#### `Badge.tsx`
- Status badges with color variants
- Variants: default, success, warning, danger, info
- Two sizes: sm, md
- Used for status indicators

#### `Input.tsx`
- Text input with label and helper text
- Error state with error message
- Accessible with proper id/label association
- Disabled state support

#### `Spinner.tsx`
- Loading spinner in three sizes
- `LoadingState` component with message
- Uses Lucide React's Loader2 icon

## Usage Examples

### Using DashboardLayout

```tsx
import { DashboardLayout } from "@/components/layout";

export default function CreatorOverviewPage() {
  return (
    <DashboardLayout userRole="creator" showFooter={false}>
      <div className="p-6">
        <h1>Creator Dashboard</h1>
        {/* Your page content */}
      </div>
    </DashboardLayout>
  );
}
```

### Using UI Components

```tsx
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

export function VideoCard() {
  return (
    <Card hover>
      <CardHeader>
        <CardTitle>My Video</CardTitle>
        <Badge variant="success">Processed</Badge>
      </CardHeader>
      <CardContent>
        <p>Video description goes here</p>
      </CardContent>
      <CardFooter>
        <Button variant="primary">View</Button>
        <Button variant="outline">Edit</Button>
      </CardFooter>
    </Card>
  );
}
```

## Design System

### Colors
- Primary: Purple-Blue gradient (`from-purple-600 to-blue-600`)
- Secondary: Gray-900
- Accent: Purple-600
- Success: Green
- Warning: Yellow
- Danger: Red
- Info: Blue

### Typography
- Uses system fonts (via Geist from Next.js layout)
- Font weights: medium (500), semibold (600), bold (700)
- Consistent text sizes: xs, sm, base, lg, xl

### Spacing
- Consistent padding/margin using Tailwind scale
- Card padding: 3 (sm), 6 (md), 8 (lg)
- Component gaps: 2, 3, 4

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar: Fixed on desktop, overlay on mobile
- Header: Condensed on mobile, full on desktop

## Integration with Frosted UI

While we've created custom components for consistency and control, Frosted UI is available for:
- Advanced components (tooltips, dropdowns, modals)
- Whop-specific integrations
- Data tables and complex forms

Import from `frosted-ui` when needed:
```tsx
import { Tooltip, Dialog, Table } from "frosted-ui";
```

## Next Steps

### Video Components (Priority 1)
- [ ] VideoUploader - Drag-and-drop upload with progress
- [ ] VideoPlayer - Custom player with timestamp links
- [ ] VideoList - Grid/list view with filtering
- [ ] VideoCard - Individual video display
- [ ] ProcessingStatus - Shows transcription progress

### Chat Components (Priority 2)
- [ ] ChatInterface - Main chat container
- [ ] ChatMessage - Individual messages with citations
- [ ] ChatInput - Input with AI suggestions
- [ ] VideoReference - Clickable timestamp links
- [ ] ChatHistory - Previous chat sessions

### Course Components (Priority 3)
- [ ] CourseBuilder - Drag-and-drop course creation
- [ ] ModuleEditor - Edit modules and assignments
- [ ] CoursePreview - Student view preview
- [ ] CourseCard - Course listing card

### Analytics Components (Priority 4)
- [ ] ViewsChart - Line chart with Recharts
- [ ] CompletionChart - Bar chart for completion rates
- [ ] MetricCard - KPI display with trends
- [ ] UsageStats - Storage and AI credit usage
- [ ] EngagementChart - Student engagement metrics

## Development Guidelines

### Component Creation Checklist
- [ ] Use TypeScript with proper interface definitions
- [ ] Make components "use client" if using hooks/interactivity
- [ ] Use `cn()` utility for className merging
- [ ] Support className prop for customization
- [ ] Include proper TypeScript types for all props
- [ ] Use Lucide React for icons
- [ ] Follow mobile-first responsive design
- [ ] Add proper ARIA labels for accessibility
- [ ] Export from index.ts for clean imports

### File Naming
- Components: PascalCase (e.g., `VideoPlayer.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Types: PascalCase (e.g., `types.ts`)

### Import Order
1. React/Next.js imports
2. Third-party imports (Lucide, etc.)
3. Internal imports (@/lib, @/components)
4. Type imports
5. Styles/CSS

## Dependencies Verified

All required UI dependencies are installed:
- ✅ `frosted-ui` - Whop's design system
- ✅ `lucide-react` - Icons
- ✅ `framer-motion` - Animations
- ✅ `recharts` - Charts for analytics
- ✅ `tailwindcss` - Utility-first CSS
- ✅ `clsx` - Class name utility
- ✅ `tailwind-merge` - Tailwind class merging
- ✅ `@whop/react` - Whop React components

## Utilities

### `lib/utils.ts`
Contains the `cn()` function for merging Tailwind classes:
```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", conditionalClass && "extra-class", className)} />
```

This prevents Tailwind class conflicts and allows for clean conditional styling.
