-- Add amount_refunded column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS amount_refunded INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN orders.amount_refunded IS 'Total amount refunded in cents';
