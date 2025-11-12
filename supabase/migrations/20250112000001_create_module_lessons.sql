-- Create module_lessons table
-- Migration: Add many-to-many relationship between course modules and videos with ordering

-- =====================================================
-- MODULE_LESSONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS module_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  lesson_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  estimated_duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for fetching all lessons in a module (sorted by order)
CREATE INDEX IF NOT EXISTS idx_module_lessons_module_id ON module_lessons(module_id);

-- Index for finding which modules contain a specific video
CREATE INDEX IF NOT EXISTS idx_module_lessons_video_id ON module_lessons(video_id);

-- Composite index for ordering lessons within a module
CREATE INDEX IF NOT EXISTS idx_module_lessons_module_order ON module_lessons(module_id, lesson_order);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Prevent duplicate videos in the same module
CREATE UNIQUE INDEX IF NOT EXISTS idx_module_lessons_unique_video_per_module ON module_lessons(module_id, video_id);

-- Ensure lesson_order is positive
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'module_lessons_lesson_order_positive') THEN
    ALTER TABLE module_lessons ADD CONSTRAINT module_lessons_lesson_order_positive CHECK (lesson_order > 0);
  END IF;
END $$;

-- Ensure estimated_duration is positive if provided
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'module_lessons_duration_positive') THEN
    ALTER TABLE module_lessons ADD CONSTRAINT module_lessons_duration_positive CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0);
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE module_lessons ENABLE ROW LEVEL SECURITY;

-- Creators can view lessons in their own modules
DROP POLICY IF EXISTS module_lessons_select_policy ON module_lessons;
CREATE POLICY module_lessons_select_policy ON module_lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON cm.course_id = c.id
      WHERE cm.id = module_lessons.module_id
      AND c.creator_id = (SELECT id FROM creators WHERE whop_user_id = auth.jwt()->>'sub')
    )
  );

-- Creators can insert lessons into their own modules
DROP POLICY IF EXISTS module_lessons_insert_policy ON module_lessons;
CREATE POLICY module_lessons_insert_policy ON module_lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON cm.course_id = c.id
      WHERE cm.id = module_lessons.module_id
      AND c.creator_id = (SELECT id FROM creators WHERE whop_user_id = auth.jwt()->>'sub')
    )
  );

-- Creators can update lessons in their own modules
DROP POLICY IF EXISTS module_lessons_update_policy ON module_lessons;
CREATE POLICY module_lessons_update_policy ON module_lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON cm.course_id = c.id
      WHERE cm.id = module_lessons.module_id
      AND c.creator_id = (SELECT id FROM creators WHERE whop_user_id = auth.jwt()->>'sub')
    )
  );

-- Creators can delete lessons from their own modules
DROP POLICY IF EXISTS module_lessons_delete_policy ON module_lessons;
CREATE POLICY module_lessons_delete_policy ON module_lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON cm.course_id = c.id
      WHERE cm.id = module_lessons.module_id
      AND c.creator_id = (SELECT id FROM creators WHERE whop_user_id = auth.jwt()->>'sub')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE module_lessons IS 'Many-to-many relationship between course modules and videos with ordering and metadata';
COMMENT ON COLUMN module_lessons.module_id IS 'Reference to parent course module';
COMMENT ON COLUMN module_lessons.video_id IS 'Reference to video content';
COMMENT ON COLUMN module_lessons.lesson_order IS 'Display order within the module (1-based)';
COMMENT ON COLUMN module_lessons.title IS 'Lesson title (can differ from video title for context)';
COMMENT ON COLUMN module_lessons.description IS 'Lesson-specific description or learning objectives';
COMMENT ON COLUMN module_lessons.is_required IS 'Whether students must complete this lesson';
COMMENT ON COLUMN module_lessons.estimated_duration_minutes IS 'Estimated time to complete this lesson';
COMMENT ON COLUMN module_lessons.metadata IS 'Additional lesson metadata (tags, prerequisites, etc.)';

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_module_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS module_lessons_updated_at_trigger ON module_lessons;
CREATE TRIGGER module_lessons_updated_at_trigger
  BEFORE UPDATE ON module_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_module_lessons_updated_at();
