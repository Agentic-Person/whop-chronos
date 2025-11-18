-- Migration: Create lesson_notes table
-- Description: Allows students to take and save notes for each lesson
-- Author: Chronos Development Team
-- Date: 2025-01-13

-- Create lesson_notes table
CREATE TABLE IF NOT EXISTS lesson_notes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  -- Note content
  content TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one note per student per lesson
  CONSTRAINT unique_student_lesson UNIQUE(student_id, lesson_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_notes_student_id
  ON lesson_notes(student_id);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson_id
  ON lesson_notes(lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_updated_at
  ON lesson_notes(updated_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_lesson_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lesson_notes_updated_at
  BEFORE UPDATE ON lesson_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_notes_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students can view their own notes
CREATE POLICY "Students can view own notes"
  ON lesson_notes
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own notes
CREATE POLICY "Students can insert own notes"
  ON lesson_notes
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own notes
CREATE POLICY "Students can update own notes"
  ON lesson_notes
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Students can delete their own notes
CREATE POLICY "Students can delete own notes"
  ON lesson_notes
  FOR DELETE
  USING (auth.uid() = student_id);

-- Creators can view notes for their videos (for analytics/support)
CREATE POLICY "Creators can view notes for their videos"
  ON lesson_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM videos v
      WHERE v.id = lesson_notes.lesson_id
      AND v.creator_id = auth.uid()
    )
  );

-- Add helpful comments
COMMENT ON TABLE lesson_notes IS 'Student notes for individual lessons';
COMMENT ON COLUMN lesson_notes.student_id IS 'Student who wrote the note';
COMMENT ON COLUMN lesson_notes.lesson_id IS 'Video/lesson the note is about';
COMMENT ON COLUMN lesson_notes.content IS 'Note content in plain text';
COMMENT ON COLUMN lesson_notes.created_at IS 'When the note was first created';
COMMENT ON COLUMN lesson_notes.updated_at IS 'When the note was last modified';
