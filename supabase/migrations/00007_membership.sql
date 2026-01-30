-- Membership Fee Support
-- Adds lifetime membership tracking to profiles and membership fee to orders

-- ============================================
-- PROFILES: Add membership fields
-- ============================================

ALTER TABLE profiles
  ADD COLUMN is_member BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN membership_paid_at TIMESTAMPTZ;

-- Index for quickly checking membership status
CREATE INDEX idx_profiles_is_member ON profiles(id) WHERE is_member = TRUE;

-- ============================================
-- ORDERS: Add membership fee column
-- ============================================

ALTER TABLE orders
  ADD COLUMN membership_fee NUMERIC(10,2) NOT NULL DEFAULT 0;
