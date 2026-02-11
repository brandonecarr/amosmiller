-- Shopify-style shipping and notification system
-- Adds tracking events, webhook processing, and notification management

-- Table: shipment_events
-- Stores shipment tracking event history from carriers (via EasyPost)
CREATE TABLE shipment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'failed_attempt'
    carrier VARCHAR(50), -- 'usps', 'ups', 'fedex'
    tracking_code VARCHAR(255),
    
    -- Location info
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    occurred_at TIMESTAMPTZ NOT NULL,
    
    -- Messages
    description TEXT, -- Raw carrier message
    
    -- Deduplication
    provider_event_id VARCHAR(255) UNIQUE, -- EasyPost event ID
    raw_data JSONB, -- Full webhook payload for debugging
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipment_events_order ON shipment_events(order_id);
CREATE INDEX idx_shipment_events_tracking ON shipment_events(tracking_code);
CREATE INDEX idx_shipment_events_provider_id ON shipment_events(provider_event_id);

COMMENT ON TABLE shipment_events IS 'Shipment tracking event history from carriers via EasyPost webhooks';

-- Table: webhook_events
-- Logs all incoming webhook requests for processing and debugging
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- 'easypost', 'stripe', etc.
    event_id VARCHAR(255) UNIQUE NOT NULL, -- Provider's unique event ID
    event_type VARCHAR(100) NOT NULL,
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'duplicate'
    attempts INT DEFAULT 0,
    last_error TEXT,
    
    -- Payload
    payload JSONB NOT NULL,
    signature VARCHAR(500), -- HMAC signature
    
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_source ON webhook_events(source);

COMMENT ON TABLE webhook_events IS 'Webhook event processing log for all incoming webhooks';

-- Table: notification_log
-- Audit log for all email notifications sent
CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(100) NOT NULL, -- 'out_for_delivery', 'delivered', etc.
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'sent', 'failed'
    provider_message_id VARCHAR(255), -- Resend message ID
    error_message TEXT,
    
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_log_order ON notification_log(order_id);
CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_type ON notification_log(notification_type);

COMMENT ON TABLE notification_log IS 'Audit log of all email notifications sent to customers';

-- Table: notification_settings
-- Admin controls for when to send automated notifications
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) UNIQUE NOT NULL, -- 'out_for_delivery', 'delivered', etc.
    is_enabled BOOLEAN DEFAULT TRUE,
    email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    delay_minutes INT DEFAULT 0, -- Optional delay before sending
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notification_settings IS 'Admin controls for automated notification triggers';

-- Seed default notification settings
INSERT INTO notification_settings (event_type, is_enabled) VALUES
('in_transit', false), -- Don't spam with every scan
('out_for_delivery', true),
('delivered', true),
('exception', true),
('failed_attempt', true)
ON CONFLICT (event_type) DO NOTHING;

-- Add EasyPost tracking fields to orders table
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS carrier VARCHAR(50),
    ADD COLUMN IF NOT EXISTS easypost_tracker_id VARCHAR(255);

COMMENT ON COLUMN orders.carrier IS 'Shipping carrier: usps, ups, fedex, etc.';
COMMENT ON COLUMN orders.easypost_tracker_id IS 'EasyPost tracker resource ID';

-- RLS Policies
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Shipment events: Admin read all, customers read their own orders
CREATE POLICY "Admin full access to shipment events"
    ON shipment_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Customers view own order shipment events"
    ON shipment_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = shipment_events.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Webhook events: Admin only
CREATE POLICY "Admin full access to webhook events"
    ON webhook_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Notification log: Admin only
CREATE POLICY "Admin full access to notification log"
    ON notification_log
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Notification settings: Admin read/write
CREATE POLICY "Admin full access to notification settings"
    ON notification_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );
