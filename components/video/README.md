# Video Components - Quick Reference

Complete video player system with multi-source support and comprehensive analytics.

## Quick Start

Use AnalyticsVideoPlayer for automatic analytics tracking:

\`\`\`tsx
import AnalyticsVideoPlayer from '@/components/video/AnalyticsVideoPlayer';

<AnalyticsVideoPlayer
  video={video}
  studentId={user.id}
  creatorId={creator.id}
  referrerType="course_page"
/>
\`\`\`

## Components

- **AnalyticsVideoPlayer** ⭐ Automatic analytics (RECOMMENDED)
- **VideoPlayer** - Multi-source router
- **MuxVideoPlayer** - Mux HLS player
- **LoomPlayer** - Loom iframe player
- **LiteVideoPlayer** - Lightweight YouTube embed

## Supported Sources

✅ YouTube | ✅ Mux | ✅ Loom | ✅ Upload

## Documentation

📚 Full docs: docs/features/videos/player-components.md
