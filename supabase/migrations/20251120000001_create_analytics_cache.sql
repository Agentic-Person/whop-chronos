-- Migration: Create analytics_cache table for pre-computed analytics
-- Date: November 20, 2025
-- Purpose: Store pre-computed analytics to speed up dashboard from 3-5s to <500ms

-- Create analytics_cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  date_range TEXT NOT NULL CHECK (
    date_range IN ('last_7_days', 'last_30_days', 'last_90_days', 'all_time')
  ),
  data JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (creator_id, date_range)
);

-- Add index for quick lookups by computed_at (for freshness checks)
CREATE INDEX idx_analytics_cache_computed_at
ON analytics_cache(creator_id, computed_at DESC);

-- Add comment for documentation
COMMENT ON TABLE analytics_cache IS 'Pre-computed analytics summaries refreshed every 6 hours by Inngest cron';

-- Example data structure in JSONB:
COMMENT ON COLUMN analytics_cache.data IS '
Example structure:
{
  "metrics": {
    "total_views": 1234,
    "total_watch_time": 56789,
    "avg_completion_rate": 0.65,
    "total_videos": 42
  },
  "views_over_time": [
    {"date": "2025-11-13", "views": 120},
    {"date": "2025-11-14", "views": 145}
  ],
  "completion_rates": [
    {"video_id": "uuid", "title": "Intro to Trading", "completion_rate": 0.85},
    {"video_id": "uuid", "title": "Advanced TA", "completion_rate": 0.72}
  ],
  "cost_breakdown": {
    "youtube": {"count": 20, "cost": 0},
    "loom": {"count": 10, "cost": 0},
    "upload": {"count": 12, "cost": 7.20}
  },
  "storage_usage": [
    {"date": "2025-11-13", "bytes": 1073741824},
    {"date": "2025-11-14", "bytes": 1145044992}
  ],
  "student_engagement": {
    "morning": [120, 140, 160, 180, 200, 190, 170],
    "afternoon": [200, 220, 240, 260, 280, 270, 250],
    "evening": [300, 320, 340, 360, 380, 370, 350],
    "night": [100, 120, 140, 160, 180, 170, 150]
  },
  "top_videos": [
    {
      "id": "uuid",
      "title": "How to Trade Options",
      "views": 523,
      "watch_time": 12345,
      "completion_rate": 0.78
    }
  ]
}
';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_cache TO service_role;
GRANT SELECT ON analytics_cache TO authenticated;

-- Enable Row Level Security
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can only see their own cached analytics
CREATE POLICY analytics_cache_creator_select
  ON analytics_cache
  FOR SELECT
  USING (creator_id = auth.uid());

-- RLS Policy: Service role can manage all cache entries (for Inngest cron)
CREATE POLICY analytics_cache_service_all
  ON analytics_cache
  FOR ALL
  USING (auth.role() = 'service_role');
