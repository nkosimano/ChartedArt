-- ============================================
-- Migration: 00500_cart_analytics.sql
-- Description: Cart tracking and abandoned cart recovery
-- Dependencies: 00200_core_tables.sql
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS order_status_history CASCADE;
-- DROP TABLE IF EXISTS cart_sessions CASCADE;

-- ============================================
-- 1. CART SESSIONS TABLE
-- ============================================
-- Track cart sessions for analytics and abandoned cart recovery
CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Session Tracking
  session_start TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  
  -- Cart Metrics
  total_value DECIMAL(10,2) DEFAULT 0.00,
  item_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one active cart per user
  UNIQUE(user_id)
);

-- ============================================
-- 2. ORDER STATUS HISTORY TABLE
-- ============================================
-- Audit trail for order status changes
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status Change
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  
  -- Change Details
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  notes TEXT,
  
  -- Timestamps
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Cart Sessions
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_status ON cart_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_last_activity ON cart_sessions(last_activity);

-- Order Status History
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at DESC);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE cart_sessions IS 'Cart session tracking for analytics and abandoned cart recovery';
COMMENT ON TABLE order_status_history IS 'Audit trail for order status changes';

COMMENT ON COLUMN cart_sessions.status IS 'Cart status: active, abandoned (24h inactive), converted (order placed)';
COMMENT ON COLUMN order_status_history.changed_by IS 'User who changed the status (admin or system)';

