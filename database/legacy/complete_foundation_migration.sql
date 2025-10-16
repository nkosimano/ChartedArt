-- ============================================
-- COMPLETE FOUNDATION MIGRATION
-- ============================================
-- 
-- This includes:
-- 1. Base ChartedArt schema (profiles, products, orders, etc.)
-- 2. Phase 0 Analytics infrastructure (11 additional tables)
-- 
-- Run this entire script in your Supabase SQL Editor
--
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BASE SCHEMA (Core ChartedArt Tables)
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  avatar_url text,
  shipping_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table (for storing product configurations)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  size text NOT NULL CHECK (size IN ('A4', 'A3', 'A2', 'A1', 'A0')),
  frame_type text NOT NULL CHECK (frame_type IN ('none', 'standard', 'premium')),
  base_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id),
  product_id uuid REFERENCES products(id),
  image_url text NOT NULL,
  quantity integer DEFAULT 1,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  event_date timestamptz NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id),
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  featured_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gallery submissions table
CREATE TABLE IF NOT EXISTS gallery_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  order_item_id uuid REFERENCES order_items(id),
  image_url text NOT NULL,
  description text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- PHASE 0 ANALYTICS SCHEMA (New Tables)
-- ============================================

-- 1. User Browsing History - Track user behavior for personalization
CREATE TABLE user_browsing_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  product_id uuid REFERENCES products(id),
  session_id text NOT NULL,
  page_url text NOT NULL,
  time_spent_seconds integer DEFAULT 0,
  scroll_depth decimal(3,2) DEFAULT 0.0,
  device_type text CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for fast queries
CREATE INDEX idx_browsing_user_id ON user_browsing_history(user_id);
CREATE INDEX idx_browsing_product_id ON user_browsing_history(product_id);
CREATE INDEX idx_browsing_created_at ON user_browsing_history(created_at);
CREATE INDEX idx_browsing_session_id ON user_browsing_history(session_id);

-- 2. Product Analytics - Real-time product performance
CREATE TABLE product_analytics (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  total_cart_adds integer DEFAULT 0,
  total_purchases integer DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0.00,
  conversion_rate decimal(5,4) DEFAULT 0.0000,
  avg_time_on_page integer DEFAULT 0,
  bounce_rate decimal(5,4) DEFAULT 0.0000,
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_product_analytics_conversion ON product_analytics(conversion_rate);
CREATE INDEX idx_product_analytics_revenue ON product_analytics(total_revenue);

-- 3. Wishlists - User wishlist functionality
CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Wishlist',
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_public ON wishlists(is_public) WHERE is_public = true;

-- 4. Wishlist Items
CREATE TABLE wishlist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id uuid REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  notes text,
  
  -- Prevent duplicate entries
  UNIQUE(wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- 5. Product Reviews - Customer reviews and ratings
CREATE TABLE product_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id), -- Verified purchase link
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  content text NOT NULL,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One review per user per product
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved) WHERE is_approved = true;
CREATE INDEX idx_product_reviews_verified ON product_reviews(is_verified_purchase) WHERE is_verified_purchase = true;

-- 6. Customer Segments - RFM Analysis
CREATE TABLE customer_segments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- RFM Metrics
  recency_days integer, -- Days since last purchase
  frequency_score integer, -- Number of orders
  monetary_value decimal(12,2), -- Total spent
  
  -- Calculated Scores (1-5 scale)
  recency_score integer CHECK (recency_score >= 1 AND recency_score <= 5),
  frequency_score_rating integer CHECK (frequency_score_rating >= 1 AND frequency_score_rating <= 5),
  monetary_score integer CHECK (monetary_score >= 1 AND monetary_score <= 5),
  
  -- Segment Classification
  segment_type text CHECK (segment_type IN (
    'champions', 'loyal_customers', 'potential_loyalists', 
    'new_customers', 'promising', 'need_attention',
    'about_to_sleep', 'at_risk', 'cannot_lose_them', 'hibernating'
  )),
  
  -- Business Metrics
  customer_lifetime_value decimal(12,2),
  predicted_churn_probability decimal(4,3),
  next_order_prediction_days integer,
  
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_customer_segments_segment_type ON customer_segments(segment_type);
CREATE INDEX idx_customer_segments_clv ON customer_segments(customer_lifetime_value);
CREATE INDEX idx_customer_segments_churn ON customer_segments(predicted_churn_probability);

-- 7. Inventory Alerts - Stock monitoring
CREATE TABLE inventory_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN (
    'low_stock', 'out_of_stock', 'overstock', 'slow_moving', 'high_demand'
  )),
  current_stock integer NOT NULL,
  threshold_value integer NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX idx_inventory_alerts_severity ON inventory_alerts(severity);
CREATE INDEX idx_inventory_alerts_unresolved ON inventory_alerts(is_resolved) WHERE is_resolved = false;

-- 8. Sales Metrics - Daily business metrics
CREATE TABLE sales_metrics (
  date date PRIMARY KEY,
  
  -- Revenue Metrics
  total_revenue decimal(12,2) DEFAULT 0.00,
  net_revenue decimal(12,2) DEFAULT 0.00, -- After refunds
  
  -- Order Metrics
  total_orders integer DEFAULT 0,
  completed_orders integer DEFAULT 0,
  cancelled_orders integer DEFAULT 0,
  refunded_orders integer DEFAULT 0,
  
  -- Customer Metrics
  new_customers integer DEFAULT 0,
  returning_customers integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  
  -- Conversion Metrics
  conversion_rate decimal(5,4) DEFAULT 0.0000,
  average_order_value decimal(10,2) DEFAULT 0.00,
  revenue_per_visitor decimal(10,2) DEFAULT 0.00,
  
  -- Product Metrics
  top_product_id uuid REFERENCES products(id),
  products_sold integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sales_metrics_date ON sales_metrics(date);
CREATE INDEX idx_sales_metrics_revenue ON sales_metrics(total_revenue);

-- 9. User Sessions - Session tracking
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  session_id text UNIQUE NOT NULL,
  
  -- Session Data
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  page_views integer DEFAULT 0,
  
  -- Device & Location
  device_type text CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser text,
  operating_system text,
  ip_address inet,
  country_code text,
  city text,
  
  -- Behavior
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  entry_page text,
  exit_page text,
  
  -- Conversion Events
  events jsonb DEFAULT '[]'::jsonb,
  conversion_value decimal(10,2) DEFAULT 0.00,
  converted boolean DEFAULT false
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_converted ON user_sessions(converted) WHERE converted = true;
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- 10. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'archived')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category text DEFAULT 'general' CHECK (category IN ('general', 'support', 'sales', 'technical', 'complaint')),
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_assigned_to ON messages(assigned_to);

-- 11. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support', 'analyst')),
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

-- ============================================
-- EXTEND EXISTING TABLES
-- ============================================

-- Extend profiles table with personalization fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style_profile jsonb DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Add index for personalization queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON profiles(marketing_consent) WHERE marketing_consent = true;

-- Extend orders table with analytics fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders(utm_source);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON orders(created_at, status);

-- ============================================
-- MATERIALIZED VIEWS FOR DASHBOARD PERFORMANCE
-- ============================================

-- 1. Order Analytics View
CREATE MATERIALIZED VIEW order_analytics_view AS
SELECT 
  DATE(created_at) as order_date,
  status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  COUNT(DISTINCT user_id) as unique_customers,
  
  -- UTM Attribution
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) FILTER (WHERE utm_source IS NOT NULL) as attributed_orders
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), status, utm_source, utm_medium, utm_campaign
ORDER BY order_date DESC;

-- 2. Customer Insights View
CREATE MATERIALIZED VIEW customer_insights_view AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.created_at as signup_date,
  p.last_active_at,
  
  -- Order Metrics
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as lifetime_value,
  COALESCE(AVG(o.total_amount), 0) as avg_order_value,
  MAX(o.created_at) as last_order_date,
  
  -- Engagement Metrics
  COUNT(DISTINCT ubh.session_id) as total_sessions,
  COUNT(ubh.id) as total_page_views,
  
  -- Segmentation Helper
  CASE 
    WHEN COUNT(o.id) = 0 THEN 'prospect'
    WHEN COUNT(o.id) = 1 THEN 'new_customer'
    WHEN COUNT(o.id) BETWEEN 2 AND 5 THEN 'repeat_customer'
    WHEN COUNT(o.id) > 5 THEN 'loyal_customer'
  END as customer_type,
  
  -- Recency (days since last order)
  CASE 
    WHEN MAX(o.created_at) IS NULL THEN NULL
    ELSE EXTRACT(days FROM NOW() - MAX(o.created_at))::integer
  END as days_since_last_order

FROM profiles p
LEFT JOIN orders o ON p.id = o.user_id
LEFT JOIN user_browsing_history ubh ON p.id = ubh.user_id
GROUP BY p.id, p.email, p.full_name, p.created_at, p.last_active_at;

-- Create indexes on materialized views
CREATE INDEX idx_order_analytics_view_date ON order_analytics_view(order_date);
CREATE INDEX idx_customer_insights_view_customer_type ON customer_insights_view(customer_type);
CREATE INDEX idx_customer_insights_view_lifetime_value ON customer_insights_view(lifetime_value);

-- ============================================
-- TRIGGERS AND FUNCTIONS FOR REAL-TIME UPDATES
-- ============================================

-- 1. Update product analytics on browsing history insert
CREATE OR REPLACE FUNCTION update_product_analytics_on_view()
RETURNS trigger AS $$
BEGIN
  INSERT INTO product_analytics (product_id, total_views, unique_views, last_calculated)
  VALUES (NEW.product_id, 1, 1, NOW())
  ON CONFLICT (product_id) 
  DO UPDATE SET
    total_views = product_analytics.total_views + 1,
    last_calculated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_analytics_on_view
  AFTER INSERT ON user_browsing_history
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics_on_view();

-- 2. Update product analytics on order completion
CREATE OR REPLACE FUNCTION update_product_analytics_on_purchase()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Update analytics for each product in the order
    UPDATE product_analytics 
    SET 
      total_purchases = total_purchases + oi.quantity,
      total_revenue = total_revenue + oi.price * oi.quantity,
      conversion_rate = CASE 
        WHEN total_views > 0 THEN (total_purchases::decimal / total_views::decimal)
        ELSE 0
      END,
      last_calculated = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id 
      AND product_analytics.product_id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_analytics_on_purchase
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics_on_purchase();

-- 3. Auto-refresh materialized views function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW order_analytics_view;
  REFRESH MATERIALIZED VIEW customer_insights_view;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on base tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_submissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new analytics tables
ALTER TABLE user_browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - BASE TABLES
-- ============================================

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow profile updates
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile inserts
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Products: Anyone can read products
CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  TO public
  USING (true);

-- Orders: Users can read their own orders
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Order Items: Users can read their own order items
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Testimonials: Anyone can read approved testimonials
CREATE POLICY "Anyone can read approved testimonials"
  ON testimonials FOR SELECT
  TO public
  USING (is_approved = true);

-- Events: Anyone can read approved events
CREATE POLICY "Anyone can read approved events"
  ON events FOR SELECT
  TO public
  USING (is_approved = true);

-- Blog Posts: Anyone can read published posts
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT
  TO public
  USING (status = 'published');

-- Gallery: Anyone can read approved submissions
CREATE POLICY "Anyone can read approved gallery submissions"
  ON gallery_submissions FOR SELECT
  TO public
  USING (is_approved = true);

-- Insert policies for authenticated users
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can submit to gallery"
  ON gallery_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - ANALYTICS TABLES
-- ============================================

-- User browsing history: Users can only see their own data
CREATE POLICY "Users can read own browsing history"
  ON user_browsing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert browsing history"
  ON user_browsing_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Product analytics: Public read access
CREATE POLICY "Anyone can read product analytics"
  ON product_analytics FOR SELECT
  TO public
  USING (true);

-- Wishlists: Users can manage their own wishlists
CREATE POLICY "Users can manage own wishlists"
  ON wishlists FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read public wishlists"
  ON wishlists FOR SELECT
  TO public
  USING (is_public = true);

-- Wishlist items: Access via wishlist ownership
CREATE POLICY "Users can manage own wishlist items"
  ON wishlist_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wishlists w 
      WHERE w.id = wishlist_items.wishlist_id 
      AND w.user_id = auth.uid()
    )
  );

-- Product reviews: Users can manage their own reviews, everyone can read approved
CREATE POLICY "Users can manage own reviews"
  ON product_reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read approved reviews"
  ON product_reviews FOR SELECT
  TO public
  USING (is_approved = true);

-- Customer segments: Users can read their own segment
CREATE POLICY "Users can read own segment"
  ON customer_segments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin-only tables: Restrict to admin users
CREATE POLICY "Admin only - inventory alerts"
  ON inventory_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin only - sales metrics"
  ON sales_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

-- User sessions: Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert anonymous sessions"
  ON user_sessions FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================
-- INITIAL DATA POPULATION & SAMPLE DATA
-- ============================================

-- Initialize product analytics for existing products (if any)
INSERT INTO product_analytics (product_id, total_views, total_purchases, total_revenue, last_calculated)
SELECT 
  p.id,
  0,
  COALESCE(SUM(oi.quantity), 0),
  COALESCE(SUM(oi.price * oi.quantity), 0),
  NOW()
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('delivered', 'shipped')
GROUP BY p.id
ON CONFLICT (product_id) DO NOTHING;

-- Create some sample products if none exist
INSERT INTO products (size, frame_type, base_price)
SELECT * FROM (VALUES
  ('A4', 'none', 29.99),
  ('A4', 'standard', 49.99),
  ('A4', 'premium', 79.99),
  ('A3', 'none', 49.99),
  ('A3', 'standard', 79.99),
  ('A3', 'premium', 119.99),
  ('A2', 'standard', 129.99),
  ('A2', 'premium', 189.99),
  ('A1', 'standard', 199.99),
  ('A1', 'premium', 299.99)
) AS v(size, frame_type, base_price)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Initialize product analytics for sample products
INSERT INTO product_analytics (product_id, total_views, total_purchases, total_revenue, last_calculated)
SELECT id, 0, 0, 0.00, NOW() FROM products
ON CONFLICT (product_id) DO NOTHING;

-- Create initial sales metrics for the last 30 days
INSERT INTO sales_metrics (date, total_revenue, total_orders, completed_orders, average_order_value)
SELECT 
  date_series.date,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ('delivered', 'shipped')), 0) as total_revenue,
  COUNT(o.id) as total_orders,
  COUNT(o.id) FILTER (WHERE o.status IN ('delivered', 'shipped')) as completed_orders,
  COALESCE(AVG(o.total_amount) FILTER (WHERE o.status IN ('delivered', 'shipped')), 0) as average_order_value
FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day'::interval) as date_series(date)
LEFT JOIN orders o ON DATE(o.created_at) = date_series.date
GROUP BY date_series.date
ORDER BY date DESC
ON CONFLICT (date) DO NOTHING;

-- Refresh materialized views
SELECT refresh_analytics_views();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant read access to materialized views for authenticated users
GRANT SELECT ON order_analytics_view TO authenticated;
GRANT SELECT ON customer_insights_view TO authenticated;

-- Grant execute permission on refresh function to admin users
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO authenticated;

-- ============================================
-- SUCCESS MESSAGE & VERIFICATION
-- ============================================

SELECT 
  'Complete Foundation Migration completed successfully!' as status,
  'Base schema + 11 analytics tables + 2 materialized views created' as summary;

-- Show table counts to verify
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
  (SELECT COUNT(*) FROM products) as sample_products,
  (SELECT COUNT(*) FROM product_analytics) as product_analytics_rows,
  (SELECT COUNT(*) FROM order_analytics_view) as order_analytics_rows,
  (SELECT COUNT(*) FROM customer_insights_view) as customer_insights_rows;