-- Add is_featured column to categories for homepage ordering
ALTER TABLE categories
  ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
