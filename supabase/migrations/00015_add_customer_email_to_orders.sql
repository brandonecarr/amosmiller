-- Add customer_email to orders table for guest checkout support
-- This allows orders to have an email address even without a user_id

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Add comment
COMMENT ON COLUMN orders.customer_email IS 'Customer email address for order notifications. Required for guest orders, optional for authenticated orders (can use user profile email instead).';
