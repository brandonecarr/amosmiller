-- Add membership_option to profiles to track which tier was selected
ALTER TABLE profiles
  ADD COLUMN membership_option TEXT CHECK (membership_option IN ('standard', 'preserve-america'));

-- Backfill existing members from their first order with a membership fee
UPDATE profiles p
SET membership_option = CASE
  WHEN o.membership_fee >= 130 THEN 'preserve-america'
  ELSE 'standard'
END
FROM (
  SELECT DISTINCT ON (user_id) user_id, membership_fee
  FROM orders
  WHERE membership_fee > 0
  ORDER BY user_id, created_at ASC
) o
WHERE p.id = o.user_id
  AND p.is_member = TRUE
  AND p.membership_option IS NULL;

-- Catch-all: any members without a matching order default to standard
UPDATE profiles
SET membership_option = 'standard'
WHERE is_member = TRUE
  AND membership_option IS NULL;
