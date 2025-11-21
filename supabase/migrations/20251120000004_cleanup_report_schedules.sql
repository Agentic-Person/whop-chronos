-- Cleanup: Remove report_schedules table and related objects
-- Date: November 20, 2025
-- Reason: Removed scheduled reports feature (using Whop's internal email instead)

-- Drop the table (CASCADE removes all dependent objects)
DROP TABLE IF EXISTS report_schedules CASCADE;

-- Drop the helper function
DROP FUNCTION IF EXISTS calculate_next_send_time(TEXT, INT, INT, TIMESTAMPTZ);

-- Drop the update trigger function
DROP FUNCTION IF EXISTS update_report_schedules_updated_at();

-- Note: No need to drop policies/triggers - they're automatically removed by CASCADE
