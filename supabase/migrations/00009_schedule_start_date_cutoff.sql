-- Add start_date for recurring schedule anchor
-- Change cutoff from hours to days + time

ALTER TABLE schedules
  ADD COLUMN start_date DATE,
  ADD COLUMN cutoff_days_before INT NOT NULL DEFAULT 1;

-- Migrate existing cutoff_hours_before → cutoff_days_before (round up to nearest day)
UPDATE schedules
  SET cutoff_days_before = GREATEST(1, CEIL(cutoff_hours_before / 24.0)::INT);

-- Drop the old column
ALTER TABLE schedules
  DROP COLUMN cutoff_hours_before;
