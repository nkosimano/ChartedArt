-- ============================================
-- Migration: 00700_notifications.sql
-- Description: Notification system (push, email, in-app)
-- Dependencies: 00200_core_tables.sql
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS push_notification_log CASCADE;
-- DROP TABLE IF EXISTS notification_delivery_log CASCADE;
-- DROP TABLE IF EXISTS email_queue CASCADE;
-- DROP TABLE IF EXISTS notification_templates CASCADE;
-- DROP TABLE IF EXISTS push_subscriptions CASCADE;
-- DROP TABLE IF EXISTS user_notification_preferences CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;

-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Content
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint for notification types
  CONSTRAINT valid_notification_type CHECK (
    type IN (
      'order_confirmed', 'order_shipped', 'order_delivered',
      'payment_successful', 'payment_failed',
      'new_follower', 'new_comment', 'comment_reply', 'product_liked',
      'new_artwork', 'price_drop', 'auction_ending',
      'commission_request', 'exhibition_reminder',
      'system_announcement', 'security_alert'
    )
  )
);

-- ============================================
-- 2. USER NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Channel Preferences
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  
  -- Category Preferences
  order_updates BOOLEAN DEFAULT true,
  social_interactions BOOLEAN DEFAULT true,
  new_artworks BOOLEAN DEFAULT true,
  price_alerts BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PUSH SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Details
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  
  -- Device Info
  device_type VARCHAR(50),
  browser VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique subscription per endpoint
  UNIQUE(endpoint)
);

-- ============================================
-- 4. NOTIFICATION TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Details
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Content Templates
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  email_subject_template TEXT,
  email_body_template TEXT,
  
  -- Variables
  variables JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EMAIL QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Email Details
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  
  -- Retry Logic
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Error Handling
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. NOTIFICATION DELIVERY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Delivery Details
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  
  -- Error Handling
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- ============================================
-- 7. PUSH NOTIFICATION LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Details
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  
  -- Delivery Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  
  -- Error Handling
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- User Notification Preferences
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON user_notification_preferences(user_id);

-- Push Subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Notification Templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- Email Queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);

-- Notification Delivery Log
CREATE INDEX IF NOT EXISTS idx_delivery_log_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_channel ON notification_delivery_log(channel);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON notification_delivery_log(status);

-- Push Notification Log
CREATE INDEX IF NOT EXISTS idx_push_log_user_id ON push_notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_status ON push_notification_log(status);
CREATE INDEX IF NOT EXISTS idx_push_log_created_at ON push_notification_log(created_at DESC);

-- ============================================
-- DEFAULT DATA
-- ============================================
-- Insert default notification templates
INSERT INTO notification_templates (name, type, title_template, message_template, email_subject_template, email_body_template, variables) VALUES
  ('order_confirmed', 'order_confirmed', 'Order Confirmed', 'Your order {{order_id}} has been confirmed!', 'Order Confirmation - {{order_id}}', 'Thank you for your order. Your order {{order_id}} has been confirmed and is being processed.', '{"order_id": "string", "total_amount": "number"}'::jsonb),
  ('order_shipped', 'order_shipped', 'Order Shipped', 'Your order {{order_id}} has been shipped!', 'Your Order Has Shipped', 'Great news! Your order {{order_id}} has been shipped and is on its way.', '{"order_id": "string", "tracking_number": "string"}'::jsonb),
  ('new_follower', 'new_follower', 'New Follower', '{{follower_name}} started following you!', NULL, NULL, '{"follower_name": "string", "follower_id": "string"}'::jsonb),
  ('commission_request', 'commission_request', 'New Commission Request', 'You have a new commission request from {{customer_name}}', 'New Commission Request', 'You have received a new commission request. Please review and respond.', '{"customer_name": "string", "commission_id": "string"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification channels and categories';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions';
COMMENT ON TABLE notification_templates IS 'Templates for notification messages';
COMMENT ON TABLE email_queue IS 'Email delivery queue with retry logic';
COMMENT ON TABLE notification_delivery_log IS 'Delivery tracking for all notification channels';
COMMENT ON TABLE push_notification_log IS 'Push notification delivery log';

COMMENT ON COLUMN notifications.type IS 'Notification type determines template and routing';
COMMENT ON COLUMN email_queue.attempts IS 'Number of delivery attempts (max 3)';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Web Push API endpoint URL';

