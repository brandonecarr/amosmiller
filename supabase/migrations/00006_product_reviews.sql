-- Product Reviews
-- Adds a reviews system for products

-- ============================================
-- PRODUCT REVIEWS TABLE
-- ============================================

CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_body TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    is_imported BOOLEAN DEFAULT FALSE,
    source_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(product_id, is_approved)
    WHERE is_approved = TRUE;

-- Updated_at trigger
CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON product_reviews FOR SELECT
USING (is_approved = TRUE);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can create own reviews"
ON product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON product_reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON product_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Admin/staff can manage all reviews
CREATE POLICY "Admin can manage reviews"
ON product_reviews FOR ALL
USING (is_admin_or_staff());
