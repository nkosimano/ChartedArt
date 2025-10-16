-- Real-time Notifications Database Schema
-- Run this in your Supabase SQL editor

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Add constraints for notification types
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

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  social_interactions BOOLEAN DEFAULT true,
  new_artworks BOOLEAN DEFAULT true,
  price_alerts BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one subscription per user (can be updated)
  UNIQUE(user_id)
);

-- Notification templates for consistent messaging
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL UNIQUE,
  title_template VARCHAR(200) NOT NULL,
  message_template TEXT NOT NULL,
  default_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue for notification emails
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification delivery log for analytics
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('push', 'email', 'in_app')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('delivered', 'failed', 'clicked', 'dismissed')),
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  user_agent TEXT,
  device_info JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_notification ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_method ON notification_delivery_log(delivery_method);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_status ON notification_delivery_log(status);

-- Row Level Security (RLS) Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Email queue policies (system only)
CREATE POLICY "System can manage email queue" ON email_queue
  FOR ALL USING (true);

-- Notification delivery log policies (system only)
CREATE POLICY "System can manage delivery log" ON notification_delivery_log
  FOR ALL USING (true);

-- Insert default notification templates
INSERT INTO notification_templates (type, title_template, message_template, default_data) VALUES
('order_confirmed', 'Order Confirmed', 'Your order #{{order_number}} has been confirmed and will be processed soon.', '{"order_number": ""}'),
('order_shipped', 'Order Shipped', 'Great news! Your order #{{order_number}} has been shipped and is on its way.', '{"order_number": "", "tracking_number": ""}'),
('order_delivered', 'Order Delivered', 'Your order #{{order_number}} has been delivered. We hope you love your new artwork!', '{"order_number": ""}'),
('payment_successful', 'Payment Successful', 'Your payment of {{amount}} {{currency}} has been processed successfully.', '{"amount": 0, "currency": "USD"}'),
('payment_failed', 'Payment Failed', 'We were unable to process your payment. Please update your payment method.', '{"amount": 0, "currency": "USD"}'),
('new_follower', 'New Follower', '{{follower_name}} started following you!', '{"follower_name": "", "follower_id": ""}'),
('new_comment', 'New Comment', '{{commenter_name}} commented on your artwork "{{artwork_name}}".', '{"commenter_name": "", "artwork_name": "", "product_id": ""}'),
('comment_reply', 'Comment Reply', '{{replier_name}} replied to your comment on "{{artwork_name}}".', '{"replier_name": "", "artwork_name": "", "product_id": ""}'),
('product_liked', 'Artwork Liked', '{{liker_name}} liked your artwork "{{artwork_name}}".', '{"liker_name": "", "artwork_name": "", "product_id": ""}'),
('new_artwork', 'New Artwork Available', '{{artist_name}} just added a new artwork: "{{artwork_name}}".', '{"artist_name": "", "artwork_name": "", "product_id": ""}'),
('price_drop', 'Price Drop Alert', 'Good news! "{{artwork_name}}" is now available for {{new_price}} {{currency}} (was {{old_price}} {{currency}}).', '{"artwork_name": "", "new_price": 0, "old_price": 0, "currency": "USD", "product_id": ""}'),
('auction_ending', 'Auction Ending Soon', 'The auction for "{{artwork_name}}" ends in {{time_remaining}}.', '{"artwork_name": "", "time_remaining": "", "product_id": ""}'),
('commission_request', 'Commission Request', 'You have a new commission request from {{client_name}}.', '{"client_name": "", "commission_id": ""}'),
('exhibition_reminder', 'Exhibition Reminder', 'Reminder: {{exhibition_name}} starts {{start_date}} at {{venue}}.', '{"exhibition_name": "", "start_date": "", "venue": ""}'),
('system_announcement', 'System Announcement', '{{title}}', '{"title": "", "content": ""}'),
('security_alert', 'Security Alert', 'New login detected from {{location}} on {{device}}.', '{"location": "", "device": "", "timestamp": ""}'
) ON CONFLICT (type) DO NOTHING;

-- Functions for notification management

-- Function to create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
  target_user_id UUID,
  notification_type VARCHAR,
  template_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  template_record notification_templates%ROWTYPE;
  notification_id UUID;
  final_title VARCHAR(200);
  final_message TEXT;
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM notification_templates 
  WHERE type = notification_type AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active template found for notification type: %', notification_type;
  END IF;
  
  -- Replace placeholders in title and message
  final_title := template_record.title_template;
  final_message := template_record.message_template;
  
  -- Simple placeholder replacement (could be enhanced with proper templating)
  FOR key_value IN SELECT * FROM jsonb_each_text(template_data) LOOP
    final_title := replace(final_title, '{{' || key_value.key || '}}', key_value.value);
    final_message := replace(final_message, '{{' || key_value.key || '}}', key_value.value);
  END LOOP;
  
  -- Create the notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, final_title, final_message, template_data)
  RETURNING id INTO notification_id;
  
  -- Check if user wants email notifications
  PERFORM create_email_notification(notification_id);
  
  RETURN notification_id;
END;
$$;

-- Function to create email notification if user preferences allow
CREATE OR REPLACE FUNCTION create_email_notification(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  notification_record notifications%ROWTYPE;
  user_email VARCHAR(255);
  user_prefs user_notification_preferences%ROWTYPE;
  should_email BOOLEAN := false;
BEGIN
  -- Get notification details
  SELECT * INTO notification_record FROM notifications WHERE id = notification_id;
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = notification_record.user_id;
  
  -- Get user preferences
  SELECT * INTO user_prefs 
  FROM user_notification_preferences 
  WHERE user_id = notification_record.user_id;
  
  -- Check if email notifications are enabled
  IF user_prefs.email_notifications THEN
    -- Check specific notification type preferences
    CASE notification_record.type
      WHEN 'order_confirmed', 'order_shipped', 'order_delivered', 'payment_successful', 'payment_failed' THEN
        should_email := user_prefs.order_updates;
      WHEN 'new_follower', 'new_comment', 'comment_reply', 'product_liked' THEN
        should_email := user_prefs.social_interactions;
      WHEN 'new_artwork' THEN
        should_email := user_prefs.new_artworks;
      WHEN 'price_drop', 'auction_ending' THEN
        should_email := user_prefs.price_alerts;
      WHEN 'security_alert' THEN
        should_email := user_prefs.security_alerts;
      ELSE
        should_email := true; -- Default for system announcements, etc.
    END CASE;
  END IF;
  
  -- Queue email if needed
  IF should_email AND user_email IS NOT NULL THEN
    INSERT INTO email_queue (user_id, notification_id, email, subject, body)
    VALUES (
      notification_record.user_id,
      notification_id,
      user_email,
      notification_record.title,
      notification_record.message
    );
  END IF;
END;
$$;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Delete unread notifications older than 90 days
  DELETE FROM notifications 
  WHERE is_read = false 
    AND created_at < NOW() - INTERVAL '90 days';
    
  -- Delete expired notifications
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Delete old email queue entries
  DELETE FROM email_queue 
  WHERE status IN ('sent', 'cancelled', 'failed')
    AND created_at < NOW() - INTERVAL '7 days';
    
  -- Delete old delivery logs
  DELETE FROM notification_delivery_log 
  WHERE delivered_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(
  user_id UUID DEFAULT NULL,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_notifications BIGINT,
  unread_notifications BIGINT,
  notifications_by_type JSONB,
  delivery_stats JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set default date range if not provided
  IF start_date IS NULL THEN
    start_date := NOW() - INTERVAL '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := NOW();
  END IF;
  
  RETURN QUERY
  WITH notification_counts AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN NOT is_read THEN 1 END) as unread,
      jsonb_object_agg(type, type_count) as by_type
    FROM (
      SELECT 
        n.type,
        COUNT(*) as type_count,
        n.is_read
      FROM notifications n
      WHERE (user_id IS NULL OR n.user_id = get_notification_stats.user_id)
        AND n.created_at BETWEEN start_date AND end_date
      GROUP BY n.type, n.is_read
    ) type_stats
  ),
  delivery_counts AS (
    SELECT jsonb_object_agg(delivery_method, method_stats) as delivery_stats
    FROM (
      SELECT 
        ndl.delivery_method,
        jsonb_build_object(
          'delivered', COUNT(CASE WHEN status = 'delivered' THEN 1 END),
          'failed', COUNT(CASE WHEN status = 'failed' THEN 1 END),
          'clicked', COUNT(CASE WHEN status = 'clicked' THEN 1 END),
          'dismissed', COUNT(CASE WHEN status = 'dismissed' THEN 1 END)
        ) as method_stats
      FROM notification_delivery_log ndl
      JOIN notifications n ON n.id = ndl.notification_id
      WHERE (user_id IS NULL OR n.user_id = get_notification_stats.user_id)
        AND ndl.delivered_at BETWEEN start_date AND end_date
      GROUP BY ndl.delivery_method
    ) delivery_stats
  )
  SELECT 
    nc.total,
    nc.unread,
    nc.by_type,
    dc.delivery_stats
  FROM notification_counts nc, delivery_counts dc;
END;
$$;

-- Triggers for automatic notification creation

-- Trigger function for order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        PERFORM create_notification_from_template(
          NEW.user_id,
          'order_confirmed',
          jsonb_build_object('order_number', NEW.order_number)
        );
      WHEN 'shipped' THEN
        PERFORM create_notification_from_template(
          NEW.user_id,
          'order_shipped',
          jsonb_build_object(
            'order_number', NEW.order_number,
            'tracking_number', COALESCE(NEW.tracking_number, 'N/A')
          )
        );
      WHEN 'delivered' THEN
        PERFORM create_notification_from_template(
          NEW.user_id,
          'order_delivered',
          jsonb_build_object('order_number', NEW.order_number)
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status changes
CREATE TRIGGER trigger_order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

-- Trigger function for new artworks by followed artists
CREATE OR REPLACE FUNCTION notify_new_artwork()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for active products
  IF NEW.status = 'active' THEN
    -- Notify all followers of this artist
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      uf.follower_id,
      'new_artwork',
      artist.full_name || ' added new artwork',
      'Check out "' || NEW.name || '" by ' || artist.full_name,
      jsonb_build_object(
        'artist_name', artist.full_name,
        'artwork_name', NEW.name,
        'product_id', NEW.id
      )
    FROM user_follows uf
    JOIN profiles artist ON artist.id = NEW.artist_id
    WHERE uf.following_id = NEW.artist_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new artwork notifications
CREATE TRIGGER trigger_new_artwork_notification
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION notify_new_artwork();

-- Schedule cleanup job (would typically be set up as a cron job)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');