-- Migration: Create cart analytics tables
-- Date: 2025-01-16
-- Description: Track cart sessions for analytics and abandoned cart recovery

-- Create cart sessions table
CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  total_value DECIMAL(10,2) DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_status ON cart_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_last_activity ON cart_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_total_value ON cart_sessions(total_value);

-- Function to update cart session
CREATE OR REPLACE FUNCTION update_cart_session()
RETURNS TRIGGER AS $$
DECLARE
  v_total_value DECIMAL(10,2);
  v_item_count INTEGER;
  v_user_id UUID;
BEGIN
  -- Get user_id from NEW or OLD record
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate totals for this user
  SELECT 
    COALESCE(SUM(price * quantity), 0),
    COALESCE(COUNT(*), 0)
  INTO v_total_value, v_item_count
  FROM cart_items
  WHERE user_id = v_user_id;

  -- Insert or update cart session
  INSERT INTO cart_sessions (
    user_id, 
    last_activity, 
    total_value, 
    item_count, 
    status
  )
  VALUES (
    v_user_id,
    NOW(),
    v_total_value,
    v_item_count,
    CASE WHEN v_item_count > 0 THEN 'active' ELSE 'abandoned' END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_activity = NOW(),
    total_value = v_total_value,
    item_count = v_item_count,
    status = CASE 
      WHEN v_item_count > 0 THEN 'active' 
      WHEN cart_sessions.status = 'converted' THEN 'converted'
      ELSE 'abandoned' 
    END,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cart_items table
DROP TRIGGER IF EXISTS trigger_update_cart_session_insert ON cart_items;
CREATE TRIGGER trigger_update_cart_session_insert
  AFTER INSERT ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_session();

DROP TRIGGER IF EXISTS trigger_update_cart_session_update ON cart_items;
CREATE TRIGGER trigger_update_cart_session_update
  AFTER UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_session();

DROP TRIGGER IF EXISTS trigger_update_cart_session_delete ON cart_items;
CREATE TRIGGER trigger_update_cart_session_delete
  AFTER DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_session();

-- Function to mark abandoned carts (run this periodically via cron)
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE cart_sessions
  SET status = 'abandoned', updated_at = NOW()
  WHERE status = 'active'
    AND last_activity < NOW() - INTERVAL '24 hours'
    AND item_count > 0;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark cart as converted when order is created
CREATE OR REPLACE FUNCTION mark_cart_converted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cart_sessions
  SET status = 'converted', updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND status = 'active';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to mark cart as converted on order creation
DROP TRIGGER IF EXISTS trigger_mark_cart_converted ON orders;
CREATE TRIGGER trigger_mark_cart_converted
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION mark_cart_converted();

-- Enable Row Level Security
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cart session
CREATE POLICY "Users can view their own cart session" ON cart_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Admins can view all cart sessions
CREATE POLICY "Admins can view all cart sessions" ON cart_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Policy: System can manage cart sessions
CREATE POLICY "System can manage cart sessions" ON cart_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Create view for cart analytics
CREATE OR REPLACE VIEW cart_analytics AS
SELECT 
  DATE_TRUNC('day', session_start) as date,
  COUNT(*) as total_carts,
  COUNT(*) FILTER (WHERE status = 'active') as active_carts,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_carts,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_carts,
  ROUND(AVG(total_value), 2) as avg_cart_value,
  ROUND(SUM(total_value) FILTER (WHERE status = 'active'), 2) as active_cart_value,
  ROUND(SUM(total_value) FILTER (WHERE status = 'abandoned'), 2) as abandoned_cart_value,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as conversion_rate
FROM cart_sessions
WHERE session_start >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', session_start)
ORDER BY date DESC;

-- Grant access to view
GRANT SELECT ON cart_analytics TO authenticated;

-- Add comments
COMMENT ON TABLE cart_sessions IS 'Tracks user cart sessions for analytics and abandoned cart recovery';
COMMENT ON COLUMN cart_sessions.status IS 'Cart status: active (items in cart), abandoned (no activity 24h), converted (order placed)';
COMMENT ON COLUMN cart_sessions.last_activity IS 'Last time user modified their cart';
COMMENT ON VIEW cart_analytics IS 'Daily cart analytics including conversion rates';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cart_sessions'
  ) THEN
    RAISE NOTICE 'Table cart_sessions created successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'cart_analytics'
  ) THEN
    RAISE NOTICE 'View cart_analytics created successfully';
  END IF;
END $$;
