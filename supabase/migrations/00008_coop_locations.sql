-- Co-Op Location Support
-- Adds is_coop flag to fulfillment_locations to distinguish
-- co-op pickup locations from the farm pickup location

ALTER TABLE fulfillment_locations
  ADD COLUMN is_coop BOOLEAN NOT NULL DEFAULT FALSE;
