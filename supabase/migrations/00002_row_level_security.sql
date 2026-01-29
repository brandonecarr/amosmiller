-- Row Level Security Policies
-- Ensures proper data access control

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if current user is admin or staff
CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'staff')
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin/staff can view all profiles
CREATE POLICY "Staff can view all profiles"
ON profiles FOR SELECT
USING (is_admin_or_staff());

-- Admin can manage all profiles
CREATE POLICY "Admin can manage all profiles"
ON profiles FOR ALL
USING (is_admin());

-- ============================================
-- ADDRESSES POLICIES
-- ============================================

-- Users can manage their own addresses
CREATE POLICY "Users can view own addresses"
ON addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
ON addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
ON addresses FOR DELETE
USING (auth.uid() = user_id);

-- Admin/staff can view all addresses
CREATE POLICY "Staff can view all addresses"
ON addresses FOR SELECT
USING (is_admin_or_staff());

-- ============================================
-- PUBLIC READ POLICIES (Catalog)
-- ============================================

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
ON categories FOR SELECT
USING (is_active = TRUE);

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = TRUE);

-- Anyone can view active product variants
CREATE POLICY "Anyone can view active variants"
ON product_variants FOR SELECT
USING (is_active = TRUE);

-- Anyone can view bundles
CREATE POLICY "Anyone can view bundles"
ON bundles FOR SELECT
USING (TRUE);

-- Anyone can view bundle items
CREATE POLICY "Anyone can view bundle items"
ON bundle_items FOR SELECT
USING (TRUE);

-- Anyone can view active fulfillment locations
CREATE POLICY "Anyone can view active locations"
ON fulfillment_locations FOR SELECT
USING (is_active = TRUE);

-- Anyone can view active delivery zones
CREATE POLICY "Anyone can view active delivery zones"
ON delivery_zones FOR SELECT
USING (is_active = TRUE);

-- Anyone can view active shipping zones
CREATE POLICY "Anyone can view active shipping zones"
ON shipping_zones FOR SELECT
USING (is_active = TRUE);

-- Anyone can view active schedules
CREATE POLICY "Anyone can view active schedules"
ON schedules FOR SELECT
USING (is_active = TRUE);

-- Anyone can view schedule assignments
CREATE POLICY "Anyone can view schedule assignments"
ON schedule_assignments FOR SELECT
USING (TRUE);

-- Anyone can view published pages
CREATE POLICY "Anyone can view published pages"
ON pages FOR SELECT
USING (is_published = TRUE);

-- Anyone can view published blog posts
CREATE POLICY "Anyone can view published posts"
ON blog_posts FOR SELECT
USING (is_published = TRUE);

-- Anyone can view active coupons (to validate codes)
CREATE POLICY "Anyone can view active coupons"
ON coupons FOR SELECT
USING (is_active = TRUE);

-- Anyone can view pricing tiers
CREATE POLICY "Anyone can view pricing tiers"
ON pricing_tiers FOR SELECT
USING (TRUE);

-- Anyone can view vendors
CREATE POLICY "Anyone can view vendors"
ON vendors FOR SELECT
USING (is_active = TRUE);

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
USING (is_admin_or_staff());

-- Staff can update orders
CREATE POLICY "Staff can update orders"
ON orders FOR UPDATE
USING (is_admin_or_staff());

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Users can insert order items for their orders
CREATE POLICY "Users can insert order items"
ON order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
);

-- Staff can manage all order items
CREATE POLICY "Staff can manage order items"
ON order_items FOR ALL
USING (is_admin_or_staff());

-- ============================================
-- ORDER STATUS HISTORY POLICIES
-- ============================================

-- Users can view status history for their orders
CREATE POLICY "Users can view own order history"
ON order_status_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_status_history.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Staff can manage order status history
CREATE POLICY "Staff can manage order history"
ON order_status_history FOR ALL
USING (is_admin_or_staff());

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can create subscriptions
CREATE POLICY "Users can create subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Staff can manage all subscriptions
CREATE POLICY "Staff can manage subscriptions"
ON subscriptions FOR ALL
USING (is_admin_or_staff());

-- ============================================
-- SUBSCRIPTION ITEMS POLICIES
-- ============================================

-- Users can manage their own subscription items
CREATE POLICY "Users can manage own subscription items"
ON subscription_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.id = subscription_items.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
);

-- Staff can manage all subscription items
CREATE POLICY "Staff can manage subscription items"
ON subscription_items FOR ALL
USING (is_admin_or_staff());

-- ============================================
-- GIFT CARDS POLICIES
-- ============================================

-- Users can view gift cards they purchased or received
CREATE POLICY "Users can view own gift cards"
ON gift_cards FOR SELECT
USING (
    purchased_by_user_id = auth.uid()
    OR redeemed_by_user_id = auth.uid()
);

-- Anyone can look up gift card by code (for redemption)
CREATE POLICY "Anyone can lookup gift card by code"
ON gift_cards FOR SELECT
USING (is_active = TRUE);

-- Staff can manage all gift cards
CREATE POLICY "Staff can manage gift cards"
ON gift_cards FOR ALL
USING (is_admin_or_staff());

-- ============================================
-- STORE CREDITS POLICIES
-- ============================================

-- Users can view their own store credits
CREATE POLICY "Users can view own store credits"
ON store_credits FOR SELECT
USING (auth.uid() = user_id);

-- Staff can manage all store credits
CREATE POLICY "Staff can manage store credits"
ON store_credits FOR ALL
USING (is_admin_or_staff());

-- ============================================
-- CARTS POLICIES
-- ============================================

-- Users can manage their own cart
CREATE POLICY "Users can manage own cart"
ON carts FOR ALL
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- ============================================
-- ADMIN-ONLY POLICIES
-- ============================================

-- Admin can manage all catalog data
CREATE POLICY "Admin can manage categories"
ON categories FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage products"
ON products FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage variants"
ON product_variants FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage bundles"
ON bundles FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage bundle items"
ON bundle_items FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage product availability"
ON product_availability FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage locations"
ON fulfillment_locations FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage delivery zones"
ON delivery_zones FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage shipping zones"
ON shipping_zones FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage schedules"
ON schedules FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage schedule assignments"
ON schedule_assignments FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage vendors"
ON vendors FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage pages"
ON pages FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage blog posts"
ON blog_posts FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage settings"
ON settings FOR ALL
USING (is_admin());

CREATE POLICY "Admin can manage email templates"
ON email_templates FOR ALL
USING (is_admin());

CREATE POLICY "Admin can manage coupons"
ON coupons FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Admin can view coupon usages"
ON coupon_usages FOR SELECT
USING (is_admin_or_staff());

CREATE POLICY "Admin can manage pricing tiers"
ON pricing_tiers FOR ALL
USING (is_admin());

CREATE POLICY "Admin can manage gift card transactions"
ON gift_card_transactions FOR ALL
USING (is_admin_or_staff());
