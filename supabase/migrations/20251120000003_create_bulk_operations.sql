-- Migration: Create bulk_operations table for background bulk video operations
-- Date: November 20, 2025
-- Purpose: Track bulk delete, export, and reprocess operations with progress

-- Create bulk_operations table
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (
    operation_type IN ('delete', 'export', 'reprocess')
  ),
  video_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'partial', 'failed')
  ),
  progress_current INT DEFAULT 0,
  progress_total INT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Add index for creator + status lookups
CREATE INDEX idx_bulk_operations_creator
ON bulk_operations(creator_id, created_at DESC);

-- Add index for status lookups (for polling)
CREATE INDEX idx_bulk_operations_status
ON bulk_operations(status, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE bulk_operations IS 'Background bulk video operations with progress tracking';

-- Example result structure in JSONB:
COMMENT ON COLUMN bulk_operations.result IS '
Example structure:
{
  "deleted": 5,
  "failed": 1,
  "errors": [
    {"video_id": "uuid", "error": "Video not found"}
  ],
  "download_url": "https://storage.url/export.csv"
}
';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON bulk_operations TO service_role;
GRANT SELECT ON bulk_operations TO authenticated;

-- Enable Row Level Security
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Creators can only see their own operations
CREATE POLICY bulk_operations_creator_select
  ON bulk_operations
  FOR SELECT
  USING (creator_id = auth.uid());

-- RLS Policy: Service role can manage all operations (for Inngest)
CREATE POLICY bulk_operations_service_all
  ON bulk_operations
  FOR ALL
  USING (auth.role() = 'service_role');
