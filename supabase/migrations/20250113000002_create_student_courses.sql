-- Migration: Create student_courses table for tracking course enrollments
-- Created: 2025-01-13
-- Purpose: Track which students are enrolled in which courses and their progress

-- Create student_courses table
CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed BOOLEAN DEFAULT FALSE,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_student_course UNIQUE(student_id, course_id)
);

-- Create indexes for performance
CREATE INDEX idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX idx_student_courses_course_id ON student_courses(course_id);
CREATE INDEX idx_student_courses_last_accessed ON student_courses(last_accessed DESC);
CREATE INDEX idx_student_courses_completed ON student_courses(completed);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_student_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_courses_updated_at
  BEFORE UPDATE ON student_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_student_courses_updated_at();

-- Enable Row Level Security
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students can view their own course enrollments
CREATE POLICY "Students can view own enrollments"
  ON student_courses
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE whop_user_id = auth.uid()::text
    )
  );

-- Students can update their own progress
CREATE POLICY "Students can update own progress"
  ON student_courses
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM students WHERE whop_user_id = auth.uid()::text
    )
  );

-- Creators can view enrollments for their courses
CREATE POLICY "Creators can view course enrollments"
  ON student_courses
  FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses WHERE creator_id IN (
        SELECT id FROM creators WHERE whop_user_id = auth.uid()::text
      )
    )
  );

-- System can insert enrollments (via service role)
CREATE POLICY "Service role can insert enrollments"
  ON student_courses
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE student_courses IS 'Tracks student course enrollments and progress';
COMMENT ON COLUMN student_courses.progress IS 'Course completion percentage (0-100)';
COMMENT ON COLUMN student_courses.completed IS 'Whether student has completed the course';
COMMENT ON COLUMN student_courses.last_accessed IS 'Last time student accessed this course';
