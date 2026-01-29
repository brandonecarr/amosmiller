-- Add subscription configuration fields to products table
-- This enables products to be marked as available for subscriptions

-- Add subscription fields to products
ALTER TABLE products
ADD COLUMN is_subscribable BOOLEAN DEFAULT FALSE,
ADD COLUMN subscription_frequencies subscription_frequency[] DEFAULT '{}',
ADD COLUMN min_subscription_quantity INT DEFAULT 1,
ADD COLUMN max_subscription_quantity INT DEFAULT 10;

-- Add index for subscribable products
CREATE INDEX idx_products_subscribable ON products(is_subscribable) WHERE is_subscribable = TRUE;

-- Add subscription_id to orders for tracking which orders came from subscriptions
ALTER TABLE orders
ADD COLUMN subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Create index for subscription orders
CREATE INDEX idx_orders_subscription ON orders(subscription_id) WHERE subscription_id IS NOT NULL;

-- Add payment method storage for users (for subscription auto-charging)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
    card_last_four VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX idx_payment_methods_default ON payment_methods(user_id) WHERE is_default = TRUE;

-- Index for user payment methods
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- Add default_payment_method_id to subscriptions
ALTER TABLE subscriptions
ADD COLUMN default_payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

-- Apply updated_at trigger to payment_methods
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
