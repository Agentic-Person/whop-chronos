# Student Course Catalog

## Overview

The Student Course Catalog is the main landing page for students to browse, filter, and access their available courses. Built with Next.js 14 App Router and Frosted UI components, it provides a comprehensive course discovery and navigation experience.

## Features

### Core Functionality

1. **Course Grid Display**
   - Responsive 3-column grid (desktop) / 2-column (tablet) / 1-column (mobile)
   - Card-based layout with hover effects
   - Thumbnail images with fallback placeholders
   - Progress indicators and status badges
   - Module count and duration display

2. **Filter System**
   - Three filter options: All, In Progress, Completed
   - Active filter highlighting with color coding
   - Real-time filtering without page reload
   - Clear Filters button when filters are active

3. **Search Functionality**
   - Debounced search (500ms delay)
   - Searches across course titles and descriptions
   - Visual feedback with magnifying glass icon
   - Real-time results update

4. **Sort Options**
   - Sort by Recent (default)
   - Sort by Progress
   - Sort by Name (alphabetical)
   - Dropdown menu with active indicator

5. **Empty States**
   - "No courses available" - when no courses exist
   - "No [filter] courses" - when filter returns no results
   - "No courses match your search" - when search returns nothing
   - Clear Filters button shown when applicable

6. **Loading States**
   - Skeleton cards during initial load
   - Maintains layout structure
   - Smooth transition to content

## Component Structure

### File Locations

```
chronos/
├── app/dashboard/student/courses/
│   └── page.tsx                          # Main catalog page
├── components/courses/
│   ├── CourseCard.tsx                    # Course preview card
│   └── CourseFilters.tsx                 # Filter and search controls
└── app/api/courses/student/
    └── route.ts                          # Student courses API endpoint
```

### Component Hierarchy

```
StudentCourseCatalogPage
├── CourseFilters
│   ├── Search Input
│   ├── Filter Buttons (All, In Progress, Completed)
│   └── Sort Dropdown (Recent, Progress, Name)
└── Course Grid
    └── CourseCard (multiple)
        ├── Thumbnail
        ├── Status Badge
        ├── Title & Description
        ├── Progress Bar
        ├── Metadata (modules, duration)
        └── CTA Button
```

## API Integration

### Endpoint

**GET** `/api/courses/student`

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `student_id` | string | Yes | - | Student user ID |
| `filter` | string | No | 'all' | Filter by status: 'all', 'in_progress', 'completed' |
| `search` | string | No | '' | Search query for title/description |
| `sort` | string | No | 'recent' | Sort order: 'recent', 'progress', 'name' |
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Results per page (max 100) |

### Response Format

```typescript
{
  success: true,
  data: {
    courses: [
      {
        id: string,
        title: string,
        description: string,
        thumbnail_url: string | null,
        module_count: number,
        total_duration: number,        // in minutes
        progress: number,               // 0-100
        status: 'not_started' | 'in_progress' | 'completed',
        created_at: string,
        updated_at: string
      }
    ]
  },
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  }
}
```

### Progress Calculation

The API calculates progress by:
1. Fetching all published courses with modules and lessons
2. Retrieving student's watch sessions for all videos
3. Calculating completion percentage: `(completed_lessons / total_lessons) * 100`
4. Determining status based on progress:
   - `not_started`: progress = 0%
   - `in_progress`: 0% < progress < 100%
   - `completed`: progress = 100%

## UI Components

### CourseCard Component

**Location:** `components/courses/CourseCard.tsx`

#### Props

```typescript
interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  progress: number;              // 0-100
  moduleCount: number;
  totalDuration: number;         // in minutes
  status: 'not_started' | 'in_progress' | 'completed';
}
```

#### Features

- **Thumbnail**: Displays course image or fallback gradient with icon
- **Status Badge**: Shows current status with colored icon
- **Title**: Max 2 lines with ellipsis truncation
- **Description**: Max 3 lines with ellipsis truncation
- **Progress Bar**: Animated progress indicator (green for completed, blue for in progress)
- **Metadata Badges**: Module count and formatted duration
- **CTA Button**: "Start", "Continue", or "Review" based on status
- **Hover Effect**: Scale animation and shadow increase
- **Click**: Navigates to `/dashboard/student/courses/[id]`

#### Styling

- Frosted UI Card component base
- Tailwind CSS utilities for layout
- Custom hover transitions
- Gradient backgrounds for fallback images
- Responsive text sizing

### CourseFilters Component

**Location:** `components/courses/CourseFilters.tsx`

#### Props

```typescript
interface CourseFiltersProps {
  onFilterChange: (filter: 'all' | 'in_progress' | 'completed') => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: 'recent' | 'progress' | 'name') => void;
  currentFilter: 'all' | 'in_progress' | 'completed';
  currentSort: 'recent' | 'progress' | 'name';
}
```

#### Features

- **Search Input**: Debounced text input with search icon
- **Filter Buttons**: Three buttons with active state highlighting
- **Sort Dropdown**: Custom dropdown with chevron indicator
- **Responsive Layout**: Stacks on mobile, inline on desktop
- **Click Outside**: Closes dropdown when clicking outside

#### State Management

- Local state for search query (debounced before calling onChange)
- Dropdown open/close state
- Active filter/sort highlighting based on props

## Testing Results

### Playwright Tests (1440px viewport)

✅ **Initial Load**
- Page loads successfully
- Shows empty state when no courses exist
- Skeleton loading states display correctly

✅ **Filter Functionality**
- Clicking "In Progress" updates filter
- Shows appropriate empty state message
- "Clear Filters" button appears when filters active

✅ **Search Functionality**
- Search input accepts text
- Debouncing works (500ms delay)
- Results update after debounce period

✅ **Sort Functionality**
- Dropdown opens on button click
- Shows all three sort options
- Clicking option updates sort and closes dropdown
- Active sort option is highlighted

✅ **Accessibility**
- Keyboard navigation works (Tab through elements)
- Focus indicators visible
- ARIA labels present
- Screen reader friendly

### Screenshots

All screenshots saved to: `docs/screenshots/`

1. `catalog-loaded-*.png` - Initial page load with empty state
2. `filter-in-progress-*.png` - In Progress filter active
3. `search-test-*.png` - Search input with query
4. `sort-dropdown-open-*.png` - Sort dropdown expanded
5. `sort-by-progress-*.png` - Sort by progress selected
6. `filters-cleared-*.png` - After clearing all filters

## Authentication

The catalog page uses the `AuthContext` to get the current student ID:

```typescript
const { userId: studentId } = useAuth();
```

**Development Mode:**
- When `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`, uses mock test student ID
- Allows testing without real Whop authentication

**Production Mode:**
- Uses real Whop OAuth session
- `userId` comes from authenticated user

## Error Handling

### API Errors

- Shows error message in toast notification
- Displays error state with retry button
- Logs errors to console for debugging

### Loading Errors

- Falls back to empty state if fetch fails
- Shows appropriate error message
- Provides retry mechanism

### Network Errors

- Graceful degradation
- Retry button for manual recovery
- Error boundary catches React errors

## Performance Optimizations

1. **Debounced Search**: 500ms delay prevents excessive API calls
2. **Memoized Callbacks**: `useCallback` for stable function references
3. **Efficient Filtering**: Client-side filtering after initial fetch
4. **Lazy Loading**: Images load on demand
5. **Skeleton States**: Perceived performance during load

## Future Enhancements

### Planned Features

- [ ] Pagination for large course catalogs
- [ ] Course categories/tags
- [ ] Recently viewed courses section
- [ ] Recommended courses based on progress
- [ ] Favorite/bookmark courses
- [ ] Course preview on hover
- [ ] Share course functionality
- [ ] Download progress for offline viewing

### Technical Improvements

- [ ] Infinite scroll option
- [ ] Virtual scrolling for very large lists
- [ ] Advanced search filters (duration, difficulty, etc.)
- [ ] Multi-select filters
- [ ] Saved filter presets
- [ ] Export course list to PDF/CSV

## Code Quality

### TypeScript

- Strict type checking enabled
- No `any` types in component interfaces
- Proper error type handling
- Type-safe API responses

### Linting

- No linting errors
- Follows project Biome configuration
- Consistent code style

### Testing

- Playwright tests pass
- Manual testing completed
- Cross-browser compatibility verified

## Git Commit

**Message:**
```
feat(student): add course catalog page with filters and search

- Create CourseCard component for course previews
- Create CourseFilters component with search and sort
- Build course catalog page with grid layout
- Add Playwright tests for catalog functionality
- Add API endpoint for student course listing with progress

Assisted by Jimmy Solutions Developer at Agentic Personnel LLC <Jimmy@AgenticPersonnel.com>
```

## Related Documentation

- Course Viewer: `app/dashboard/student/courses/[id]/page.tsx`
- Course Builder (Creator): `app/dashboard/creator/courses/`
- Video Components: `components/video/`
- API Documentation: `app/api/courses/`

## Support

For questions or issues:
- Check existing course viewer implementation
- Review Frosted UI documentation: https://storybook.whop.dev
- See Next.js App Router docs: https://nextjs.org/docs/app
