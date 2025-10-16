-- ============================================
-- Migration: 00400_analytics.sql
-- Description: Analytics and tracking tables
-- Dependencies: 00200_core_tables.sql
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS customer_segments CASCADE;
-- DROP TABLE IF EXISTS user_sessions CASCADE;
-- DROP TABLE IF EXISTS user_browsing_history CASCADE;
-- DROP TABLE IF EXISTS sales_metrics CASCADE;
-- DROP TABLE IF EXISTS product_analytics CASCADE;

-- ============================================
-- 1. PRODUCT ANALYTICS TABLE
-- ============================================
-- Track product performance metrics
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- View Metrics
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  add_to_cart_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Sales Metrics
  orders_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0.00,
  units_sold INTEGER DEFAULT 0,
  
  -- Conversion Metrics
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per product per day
  UNIQUE(product_id, date)
);

-- ============================================
-- 2. SALES METRICS TABLE
-- ============================================
-- Daily sales metrics for business overview
CREATE TABLE IF NOT EXISTS sales_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Date
  date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  
  -- Revenue Metrics
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  gross_revenue DECIMAL(12,2) DEFAULT 0.00,
  net_revenue DECIMAL(12,2) DEFAULT 0.00,
  
  -- Order Metrics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0.00,
  
  -- Customer Metrics
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Product Metrics
  total_units_sold INTEGER DEFAULT 0,
  unique_products_sold INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USER BROWSING HISTORY TABLE
-- ============================================
-- Track user browsing behavior for recommendations
CREATE TABLE IF NOT EXISTS user_browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Browsing Details
  view_duration INTEGER, -- seconds
  scroll_depth DECIMAL(5,2), -- percentage
  
  -- Context
  referrer TEXT,
  device_type VARCHAR(50),
  
  -- Timestamps
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. USER SESSIONS TABLE
-- ============================================
-- Track user sessions for analytics
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Session Details
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Device Info
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Session Metrics
  page_views INTEGER DEFAULT 0,
  duration INTEGER, -- seconds
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ============================================
-- 5. CUSTOMER SEGMENTS TABLE
-- ============================================
-- Customer segmentation for marketing and analytics
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- RFM Segmentation
  recency_score INTEGER CHECK (recency_score >= 1 AND recency_score <= 5),
  frequency_score INTEGER CHECK (frequency_score >= 1 AND frequency_score <= 5),
  monetary_score INTEGER CHECK (monetary_score >= 1 AND monetary_score <= 5),
  rfm_segment VARCHAR(50),
  
  -- Customer Metrics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  average_order_value DECIMAL(10,2) DEFAULT 0.00,
  days_since_last_order INTEGER,
  
  -- Behavioral Segments
  customer_type VARCHAR(50), -- 'new', 'active', 'at_risk', 'churned', 'vip'
  
  -- Preferences
  preferred_categories TEXT[],
  preferred_price_range VARCHAR(50),
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- ============================================
-- INDEXES
-- ============================================
-- Product Analytics
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_revenue ON product_analytics(revenue DESC);

-- Sales Metrics
CREATE INDEX IF NOT EXISTS idx_sales_metrics_date ON sales_metrics(date DESC);

-- User Browsing History
CREATE INDEX IF NOT EXISTS idx_browsing_history_user_id ON user_browsing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_product_id ON user_browsing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_browsing_history_viewed_at ON user_browsing_history(viewed_at DESC);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- Customer Segments
CREATE INDEX IF NOT EXISTS idx_customer_segments_user_id ON customer_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(customer_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_rfm ON customer_segments(rfm_segment);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE product_analytics IS 'Daily product performance metrics';
COMMENT ON TABLE sales_metrics IS 'Daily sales and revenue metrics';
COMMENT ON TABLE user_browsing_history IS 'User browsing behavior for recommendations';
COMMENT ON TABLE user_sessions IS 'User session tracking for analytics';
COMMENT ON TABLE customer_segments IS 'Customer segmentation using RFM analysis';

COMMENT ON COLUMN product_analytics.conversion_rate IS 'Orders / Views conversion rate';
COMMENT ON COLUMN customer_segments.rfm_segment IS 'RFM segment: Champions, Loyal, At Risk, etc.';
COMMENT ON COLUMN customer_segments.customer_type IS 'Customer lifecycle stage';

