-- Migration: Create push notification log table
-- Date: 2025-01-16
-- Description: Tracks all push notifications sent to users

-- Create push notification log table
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  opened BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_log_user_id ON push_notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_notification_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_log_type ON push_notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_log_delivered ON push_notification_log(delivered);

-- Enable Row Level Security
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON push_notification_log
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON push_notification_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Policy: System can insert notifications (service role)
CREATE POLICY "System can insert notifications" ON push_notification_log
  FOR INSERT WITH CHECK (true);

-- Add comments
COMMENT ON TABLE push_notification_log IS 'Tracks all push notifications sent to mobile app users';
COMMENT ON COLUMN push_notification_log.notification_type IS 'Type of notification: order_status, promotional, bulk, etc.';
COMMENT ON COLUMN push_notification_log.delivered IS 'Whether the notification was successfully delivered to Expo';
COMMENT ON COLUMN push_notification_log.opened IS 'Whether the user opened the notification';
COMMENT ON COLUMN push_notification_log.data IS 'Additional data payload sent with notification';

-- Create order status history table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for order status history
CREATE POLICY "Users can view their order status history" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order status history" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Add comments
COMMENT ON TABLE order_status_history IS 'Audit log of all order status changes';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'push_notification_log'
  ) THEN
    RAISE NOTICE 'Table push_notification_log created successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'order_status_history'
  ) THEN
    RAISE NOTICE 'Table order_status_history created successfully';
  END IF;
END $$;
