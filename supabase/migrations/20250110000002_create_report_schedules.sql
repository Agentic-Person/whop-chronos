-- Migration: Create report schedules and history tables
-- Created: 2025-01-10

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: report_schedules
-- Stores automated report generation schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL, -- References creators(id), add FK when creators table exists
  name VARCHAR(255) NOT NULL,
  template VARCHAR(50) NOT NULL CHECK (template IN ('executive', 'detailed', 'student', 'content', 'custom')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  delivery_time TIME NOT NULL DEFAULT '09:00:00',
  delivery_day INTEGER, -- For weekly (1-7 = Mon-Sun) or monthly (1-31 = day of month)
  recipients TEXT[] NOT NULL, -- Array of email addresses
  options JSONB DEFAULT '{}'::jsonb, -- Additional options (branding, custom sections, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: report_history
-- Stores history of generated reports
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL, -- References creators(id)
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- Template type used
  file_url TEXT, -- Storage URL for the generated report
  file_size_bytes INTEGER,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  delivery_status VARCHAR(50) CHECK (delivery_status IN ('pending', 'sent', 'failed'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_report_schedules_creator_id ON report_schedules(creator_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_frequency ON report_schedules(frequency);

CREATE INDEX IF NOT EXISTS idx_report_history_creator_id ON report_history(creator_id);
CREATE INDEX IF NOT EXISTS idx_report_history_schedule_id ON report_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_at ON report_history(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_history_delivery_status ON report_history(delivery_status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_schedules_updated_at ON report_schedules;
CREATE TRIGGER update_report_schedules_updated_at
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on tables
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can only access their own schedules
DROP POLICY IF EXISTS report_schedules_creator_policy ON report_schedules;
CREATE POLICY report_schedules_creator_policy ON report_schedules
  FOR ALL
  USING (creator_id = auth.uid());

-- Policy: Creators can only access their own report history
DROP POLICY IF EXISTS report_history_creator_policy ON report_history;
CREATE POLICY report_history_creator_policy ON report_history
  FOR ALL
  USING (creator_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE report_schedules IS 'Stores automated report generation schedules for creators';
COMMENT ON TABLE report_history IS 'Stores history of generated and delivered reports';

COMMENT ON COLUMN report_schedules.frequency IS 'Report generation frequency: daily, weekly, or monthly';
COMMENT ON COLUMN report_schedules.delivery_day IS 'Day for delivery - 1-7 for weekly (Mon-Sun), 1-31 for monthly (day of month)';
COMMENT ON COLUMN report_schedules.recipients IS 'Array of email addresses to receive the report';
COMMENT ON COLUMN report_schedules.options IS 'JSON object for additional options like branding, custom sections, etc.';

COMMENT ON COLUMN report_history.schedule_id IS 'References the schedule that generated this report (NULL for manual reports)';
COMMENT ON COLUMN report_history.file_url IS 'Storage URL where the generated report file is stored';
COMMENT ON COLUMN report_history.delivery_status IS 'Email delivery status: pending, sent, or failed';
