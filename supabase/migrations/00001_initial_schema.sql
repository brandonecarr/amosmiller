-- Amos Miller Farm E-Commerce Platform
-- Initial Database Schema Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE pricing_type AS ENUM ('fixed', 'weight');
CREATE TYPE weight_unit AS ENUM ('lb', 'oz', 'kg', 'g');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed');
CREATE TYPE fulfillment_type AS ENUM ('pickup', 'delivery', 'shipping');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE subscription_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE schedule_type AS ENUM ('recurring', 'one_time');
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping');
CREATE TYPE carrier_type AS ENUM ('usps', 'ups', 'fedex', 'local');

-- ============================================
-- CORE TABLES
-- ============================================

-- Pricing Tiers (retail, wholesale, subscription)
CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    pricing_tier_id UUID REFERENCES pricing_tiers(id),
    stripe_customer_id VARCHAR(255),
    avatar_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(100), -- 'Home', 'Work', etc.
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    phone VARCHAR(50),
    delivery_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors (for multi-vendor support)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

    -- Pricing
    pricing_type pricing_type DEFAULT 'fixed',
    base_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),

    -- Weight-based pricing
    weight_unit weight_unit DEFAULT 'lb',
    estimated_weight DECIMAL(8,3),
    min_weight DECIMAL(8,3),
    max_weight DECIMAL(8,3),
    price_per_unit DECIMAL(10,2), -- For weight-based items

    -- Inventory
    track_inventory BOOLEAN DEFAULT TRUE,
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    shelf_location VARCHAR(100),
    allow_backorder BOOLEAN DEFAULT FALSE,

    -- Display
    images JSONB DEFAULT '[]'::JSONB, -- [{url, alt, sort_order}]
    featured_image_url TEXT,

    -- Organization
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_taxable BOOLEAN DEFAULT TRUE,

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (e.g., size options)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "1 lb", "2 lb"
    sku VARCHAR(100),
    price_modifier DECIMAL(10,2) DEFAULT 0, -- Added to base price
    weight_modifier DECIMAL(8,3) DEFAULT 0, -- Added to estimated weight
    stock_quantity INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundles (products composed of other products)
CREATE TABLE bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- The bundle as a product
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bundle Items
CREATE TABLE bundle_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Location Availability (which products available at which locations)
CREATE TABLE product_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    fulfillment_location_id UUID, -- NULL means available everywhere
    delivery_zone_id UUID,
    shipping_zone_id UUID,
    is_available BOOLEAN DEFAULT TRUE,
    price_override DECIMAL(10,2), -- Optional location-specific price
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FULFILLMENT TABLES
-- ============================================

-- Fulfillment Locations (pickup points, dropsites)
CREATE TABLE fulfillment_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type fulfillment_type NOT NULL,
    description TEXT,

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',

    -- Contact
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),

    -- Settings
    instructions TEXT, -- Pickup instructions
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Zones (by zip code)
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,

    -- Zone definition
    zip_codes TEXT[] DEFAULT '{}',

    -- Fees and minimums
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    min_order_amount DECIMAL(10,2),
    free_delivery_threshold DECIMAL(10,2),

    -- Pricing
    pricing_tier_id UUID REFERENCES pricing_tiers(id),

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping Zones (by state, for nationwide)
CREATE TABLE shipping_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,

    -- Zone definition
    states TEXT[] DEFAULT '{}',

    -- Shipping rates
    base_rate DECIMAL(10,2) NOT NULL,
    per_lb_rate DECIMAL(10,2) DEFAULT 0,
    min_order_amount DECIMAL(10,2),
    max_weight DECIMAL(8,2),

    -- Carrier
    carrier carrier_type DEFAULT 'ups',
    estimated_days_min INT,
    estimated_days_max INT,

    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules (order windows and delivery dates)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_type schedule_type DEFAULT 'recurring',

    -- For recurring schedules
    recurrence_rule JSONB, -- {frequency: 'weekly', day_of_week: 2, ...}

    -- Order cutoff
    cutoff_hours_before INT DEFAULT 24, -- Hours before delivery to stop accepting orders
    cutoff_time TIME DEFAULT '23:59:59',

    -- Dates (for one-time or overrides)
    available_dates DATE[] DEFAULT '{}',
    blocked_dates DATE[] DEFAULT '{}',

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Assignments (link schedules to locations/zones)
CREATE TABLE schedule_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    fulfillment_location_id UUID REFERENCES fulfillment_locations(id) ON DELETE CASCADE,
    delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE CASCADE,
    shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Only one assignment type per row
    CONSTRAINT one_assignment_type CHECK (
        (fulfillment_location_id IS NOT NULL)::INT +
        (delivery_zone_id IS NOT NULL)::INT +
        (shipping_zone_id IS NOT NULL)::INT = 1
    )
);

-- ============================================
-- ORDER TABLES
-- ============================================

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL UNIQUE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Status
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',

    -- Fulfillment
    fulfillment_type fulfillment_type NOT NULL,
    fulfillment_location_id UUID REFERENCES fulfillment_locations(id),
    delivery_zone_id UUID REFERENCES delivery_zones(id),
    shipping_zone_id UUID REFERENCES shipping_zones(id),
    schedule_id UUID REFERENCES schedules(id),
    scheduled_date DATE,

    -- Addresses
    shipping_address JSONB,
    billing_address JSONB,

    -- Totals
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,

    -- Payment
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Notes
    customer_notes TEXT,
    private_notes TEXT, -- Internal, shown on packing lists
    invoice_notes TEXT, -- Customer-visible

    -- Metadata
    source VARCHAR(50) DEFAULT 'web', -- 'web', 'pos', 'admin', 'subscription'
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Applied discounts/credits
    coupon_id UUID,
    coupon_code VARCHAR(100),
    gift_card_id UUID,
    gift_card_amount_used DECIMAL(10,2) DEFAULT 0,
    store_credit_used DECIMAL(10,2) DEFAULT 0,

    -- Tracking
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

    -- Item details (snapshot at time of order)
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),

    -- Quantity and pricing
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,

    -- For weight-based items
    pricing_type pricing_type DEFAULT 'fixed',
    estimated_weight DECIMAL(8,3),
    actual_weight DECIMAL(8,3), -- Filled in during packing
    final_price DECIMAL(10,2), -- Calculated after actual weight

    -- Fulfillment
    is_packed BOOLEAN DEFAULT FALSE,
    packed_at TIMESTAMPTZ,
    packed_by UUID REFERENCES profiles(id),

    -- Notes
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Status History
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTION TABLES
-- ============================================

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255),

    status subscription_status DEFAULT 'active',
    frequency subscription_frequency DEFAULT 'monthly',

    -- Fulfillment
    fulfillment_type fulfillment_type NOT NULL,
    fulfillment_location_id UUID REFERENCES fulfillment_locations(id),
    delivery_zone_id UUID REFERENCES delivery_zones(id),
    shipping_zone_id UUID REFERENCES shipping_zones(id),

    -- Scheduling
    next_order_date DATE,
    last_order_date DATE,

    -- Stripe
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),

    -- Address
    shipping_address JSONB,

    -- Skip dates
    skip_dates DATE[] DEFAULT '{}',

    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Items
CREATE TABLE subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INT DEFAULT 1,
    is_customizable BOOLEAN DEFAULT FALSE, -- Can customer swap this?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT & CREDIT TABLES
-- ============================================

-- Gift Cards
CREATE TABLE gift_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    initial_balance DECIMAL(10,2) NOT NULL,
    current_balance DECIMAL(10,2) NOT NULL,

    -- Purchase info
    purchased_by_user_id UUID REFERENCES profiles(id),
    purchase_order_id UUID REFERENCES orders(id),

    -- Redemption
    redeemed_by_user_id UUID REFERENCES profiles(id),

    -- Recipient
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    personal_message TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Card Transactions
CREATE TABLE gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL, -- Negative for redemption, positive for refund
    balance_after DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Credits
CREATE TABLE store_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL, -- Positive for credit, negative for usage
    balance_after DECIMAL(10,2) NOT NULL,
    reason TEXT,
    order_id UUID REFERENCES orders(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,

    coupon_type coupon_type NOT NULL,
    value DECIMAL(10,2) NOT NULL, -- Percentage or fixed amount

    -- Restrictions
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts

    -- Usage limits
    max_uses INT,
    max_uses_per_user INT DEFAULT 1,
    used_count INT DEFAULT 0,

    -- Validity
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,

    -- Restrictions
    applies_to_products UUID[] DEFAULT '{}', -- Empty = all products
    applies_to_categories UUID[] DEFAULT '{}', -- Empty = all categories

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon Usage Tracking
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    order_id UUID REFERENCES orders(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CMS TABLES
-- ============================================

-- Website Pages
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content JSONB DEFAULT '[]'::JSONB, -- Array of content blocks

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,

    -- Navigation
    show_in_nav BOOLEAN DEFAULT FALSE,
    nav_label VARCHAR(100),
    sort_order INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image_url TEXT,

    author_id UUID REFERENCES profiles(id),

    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,

    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,

    -- Organization
    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================

-- Store Settings (key-value store)
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'order_confirmation', 'shipping_notification'
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL, -- HTML with template variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CART TABLE (for persistent carts)
-- ============================================

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest carts

    items JSONB DEFAULT '[]'::JSONB, -- [{product_id, variant_id, quantity}]

    -- Selected fulfillment
    fulfillment_type fulfillment_type,
    fulfillment_location_id UUID REFERENCES fulfillment_locations(id),
    delivery_zone_id UUID REFERENCES delivery_zones(id),
    shipping_zone_id UUID REFERENCES shipping_zones(id),
    scheduled_date DATE,

    -- Applied discounts
    coupon_code VARCHAR(100),

    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;

-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_date);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next ON subscriptions(next_order_date);

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe ON profiles(stripe_customer_id);

-- Carts
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$$;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Default Pricing Tiers
INSERT INTO pricing_tiers (name, description, discount_percentage, is_default) VALUES
('Retail', 'Standard retail pricing', 0, TRUE),
('Wholesale', 'Wholesale pricing for bulk buyers', 15, FALSE),
('Subscriber', 'Discount for subscription customers', 10, FALSE);

-- Default Settings
INSERT INTO settings (key, value, description) VALUES
('store_name', '"Amos Miller Farm"', 'Store display name'),
('store_email', '"orders@amosmillerfarm.com"', 'Store contact email'),
('store_phone', '""', 'Store contact phone'),
('store_address', '{"line1": "", "city": "", "state": "PA", "postal_code": "", "country": "United States"}', 'Store physical address'),
('tax_rate', '0', 'Default tax rate as decimal'),
('currency', '"USD"', 'Store currency'),
('allow_guest_checkout', 'true', 'Allow checkout without account'),
('require_login_for_prices', 'false', 'Require login to see prices'),
('low_stock_email_enabled', 'true', 'Send email when stock is low');

-- Default Email Templates
INSERT INTO email_templates (name, subject, body) VALUES
('order_confirmation', 'Order Confirmation - Order #{{order_number}}', '<h1>Thank you for your order!</h1><p>Your order #{{order_number}} has been received.</p>'),
('order_shipped', 'Your Order Has Shipped - Order #{{order_number}}', '<h1>Your order is on its way!</h1><p>Track your shipment: {{tracking_url}}</p>'),
('order_ready_pickup', 'Your Order is Ready for Pickup - Order #{{order_number}}', '<h1>Your order is ready!</h1><p>Please pick up at: {{location_name}}</p>'),
('subscription_reminder', 'Your Subscription Order is Coming Up', '<h1>Reminder</h1><p>Your subscription order will be placed on {{next_order_date}}.</p>'),
('password_reset', 'Reset Your Password', '<h1>Password Reset</h1><p>Click the link to reset your password: {{reset_link}}</p>');
