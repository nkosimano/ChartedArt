-- ============================================
-- Migration: 01700_functions.sql
-- Description: Database functions and RPC endpoints
-- Dependencies: All table migrations (00200-01300)
-- ============================================

-- Rollback:
-- DROP FUNCTION statements for all functions created in this file

-- ============================================
-- ADMIN DASHBOARD FUNCTIONS
-- ============================================

-- Get comprehensive business overview
CREATE OR REPLACE FUNCTION get_business_overview(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_revenue DECIMAL;
  total_orders INTEGER;
  total_customers INTEGER;
  avg_order_value DECIMAL;
BEGIN
  -- Calculate metrics
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    COUNT(DISTINCT user_id)
  INTO total_revenue, total_orders, total_customers
  FROM orders
  WHERE created_at BETWEEN start_date AND end_date
    AND status IN ('paid', 'delivered');
  
  -- Calculate average order value
  IF total_orders > 0 THEN
    avg_order_value := total_revenue / total_orders;
  ELSE
    avg_order_value := 0;
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'revenue', total_revenue,
    'orders', total_orders,
    'customers', total_customers,
    'avg_order_value', avg_order_value,
    'period_start', start_date,
    'period_end', end_date
  );
  
  RETURN result;
END;
$$;

-- Get product performance metrics
CREATE OR REPLACE FUNCTION get_product_performance(
  product_id_param UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_views INTEGER;
  total_sales INTEGER;
  total_revenue DECIMAL;
  conversion_rate DECIMAL;
BEGIN
  -- Get views from analytics
  SELECT COALESCE(SUM(views), 0)
  INTO total_views
  FROM product_analytics
  WHERE product_id = product_id_param
    AND date >= CURRENT_DATE - days_back;
  
  -- Get sales
  SELECT 
    COUNT(*),
    COALESCE(SUM(oi.price * oi.quantity), 0)
  INTO total_sales, total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = product_id_param
    AND o.created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND o.status IN ('paid', 'delivered');
  
  -- Calculate conversion rate
  IF total_views > 0 THEN
    conversion_rate := (total_sales::DECIMAL / total_views) * 100;
  ELSE
    conversion_rate := 0;
  END IF;
  
  result := jsonb_build_object(
    'views', total_views,
    'sales', total_sales,
    'revenue', total_revenue,
    'conversion_rate', conversion_rate,
    'days', days_back
  );
  
  RETURN result;
END;
$$;

-- ============================================
-- ARTIST PORTAL FUNCTIONS
-- ============================================

-- Get artist earnings summary
CREATE OR REPLACE FUNCTION get_artist_earnings(
  artist_id_param UUID,
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_earnings DECIMAL;
  total_sales INTEGER;
  commission_rate DECIMAL := 0.15; -- 15% platform commission
BEGIN
  -- Calculate earnings from product sales
  SELECT 
    COUNT(*),
    COALESCE(SUM(oi.price * oi.quantity * (1 - commission_rate)), 0)
  INTO total_sales, total_earnings
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE p.artist_id = artist_id_param
    AND o.created_at BETWEEN start_date AND end_date
    AND o.status IN ('paid', 'delivered');
  
  result := jsonb_build_object(
    'total_earnings', total_earnings,
    'total_sales', total_sales,
    'commission_rate', commission_rate,
    'period_start', start_date,
    'period_end', end_date
  );
  
  RETURN result;
END;
$$;

-- Get artist products with stats
CREATE OR REPLACE FUNCTION get_artist_products(
  artist_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price DECIMAL,
  stock_quantity INTEGER,
  status TEXT,
  total_views INTEGER,
  total_sales INTEGER,
  total_revenue DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.stock_quantity,
    p.status,
    COALESCE(SUM(pa.views), 0)::INTEGER AS total_views,
    COALESCE(COUNT(oi.id), 0)::INTEGER AS total_sales,
    COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue
  FROM products p
  LEFT JOIN product_analytics pa ON pa.product_id = p.id
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'delivered')
  WHERE p.artist_id = artist_id_param
  GROUP BY p.id, p.name, p.price, p.stock_quantity, p.status
  ORDER BY p.created_at DESC;
END;
$$;

-- ============================================
-- RECOMMENDATION FUNCTIONS
-- ============================================

-- Get personalized product recommendations
CREATE OR REPLACE FUNCTION get_product_recommendations(
  user_id_param UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  image_url TEXT,
  category TEXT,
  artist_id UUID,
  recommendation_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_browsing AS (
    -- Get user's browsing history
    SELECT DISTINCT product_id, category
    FROM user_browsing_history
    WHERE user_id = user_id_param
    ORDER BY viewed_at DESC
    LIMIT 20
  ),
  user_purchases AS (
    -- Get user's purchase history
    SELECT DISTINCT oi.product_id, p.category
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.user_id = user_id_param
      AND o.status IN ('paid', 'delivered')
  ),
  user_interests AS (
    -- Combine browsing and purchases
    SELECT category, COUNT(*) as interest_score
    FROM (
      SELECT category FROM user_browsing
      UNION ALL
      SELECT category FROM user_purchases
    ) combined
    GROUP BY category
  )
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.category,
    p.artist_id,
    COALESCE(ui.interest_score, 0)::FLOAT AS recommendation_score
  FROM products p
  LEFT JOIN user_interests ui ON ui.category = p.category
  WHERE p.status = 'active'
    AND p.id NOT IN (SELECT product_id FROM user_purchases)
  ORDER BY recommendation_score DESC, p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- SOCIAL FEATURES FUNCTIONS
-- ============================================

-- Get social feed for user
CREATE OR REPLACE FUNCTION get_social_feed(
  user_id_param UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  activity_type TEXT,
  title TEXT,
  description TEXT,
  data JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.user_id,
    ua.activity_type,
    ua.title,
    ua.description,
    ua.data,
    ua.created_at
  FROM user_activities ua
  WHERE ua.user_id IN (
    -- Activities from users the current user follows
    SELECT following_id FROM user_follows WHERE follower_id = user_id_param
  )
  OR ua.activity_type IN ('product_like', 'new_artwork', 'exhibition')
  ORDER BY ua.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================
-- CUSTOMER ANALYTICS FUNCTIONS
-- ============================================

-- Get customer order statistics
CREATE OR REPLACE FUNCTION get_customer_order_stats(customer_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  total_spent NUMERIC,
  avg_order_value NUMERIC,
  days_since_last_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(o.id)::BIGINT AS total_orders,
    COALESCE(SUM(o.total_amount), 0)::NUMERIC AS total_spent,
    CASE
      WHEN COUNT(o.id) > 0 THEN (COALESCE(SUM(o.total_amount), 0) / COUNT(o.id))::NUMERIC
      ELSE 0::NUMERIC
    END AS avg_order_value,
    CASE
      WHEN MAX(o.created_at) IS NOT NULL THEN
        EXTRACT(DAY FROM (NOW() - MAX(o.created_at)))::INTEGER
      ELSE NULL::INTEGER
    END AS days_since_last_order
  FROM orders o
  WHERE o.user_id = customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_order_stats(UUID) TO authenticated;

-- Calculate customer RFM (Recency, Frequency, Monetary) analysis
CREATE OR REPLACE FUNCTION calculate_customer_rfm()
RETURNS TABLE (
  customer_id UUID,
  recency_score INTEGER,
  frequency_score INTEGER,
  monetary_score INTEGER,
  rfm_segment TEXT,
  last_order_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH customer_metrics AS (
    SELECT
      p.id AS customer_id,
      COALESCE(MAX(o.created_at), p.created_at) AS last_order_date,
      COUNT(o.id) AS frequency,
      COALESCE(SUM(o.total_amount), 0) AS monetary_value,
      EXTRACT(DAY FROM (NOW() - COALESCE(MAX(o.created_at), p.created_at))) AS recency_days
    FROM profiles p
    LEFT JOIN orders o ON p.id = o.user_id
    GROUP BY p.id, p.created_at
  ),
  rfm_scores AS (
    SELECT
      cm.customer_id,
      cm.last_order_date,
      -- Recency score (1-5, where 5 is most recent)
      CASE
        WHEN cm.recency_days <= 30 THEN 5
        WHEN cm.recency_days <= 60 THEN 4
        WHEN cm.recency_days <= 90 THEN 3
        WHEN cm.recency_days <= 180 THEN 2
        ELSE 1
      END AS recency_score,
      -- Frequency score (1-5, where 5 is most frequent)
      CASE
        WHEN cm.frequency >= 10 THEN 5
        WHEN cm.frequency >= 5 THEN 4
        WHEN cm.frequency >= 3 THEN 3
        WHEN cm.frequency >= 1 THEN 2
        ELSE 1
      END AS frequency_score,
      -- Monetary score (1-5, where 5 is highest value)
      CASE
        WHEN cm.monetary_value >= 1000 THEN 5
        WHEN cm.monetary_value >= 500 THEN 4
        WHEN cm.monetary_value >= 200 THEN 3
        WHEN cm.monetary_value >= 50 THEN 2
        ELSE 1
      END AS monetary_score
    FROM customer_metrics cm
  )
  SELECT
    rf.customer_id,
    rf.recency_score,
    rf.frequency_score,
    rf.monetary_score,
    -- Segment based on RFM scores
    CASE
      WHEN rf.recency_score >= 4 AND rf.frequency_score >= 4 AND rf.monetary_score >= 4 THEN 'Champions'
      WHEN rf.recency_score >= 3 AND rf.frequency_score >= 3 AND rf.monetary_score >= 3 THEN 'Loyal Customers'
      WHEN rf.recency_score >= 4 AND rf.frequency_score <= 2 THEN 'New Customers'
      WHEN rf.recency_score >= 3 AND rf.frequency_score <= 2 AND rf.monetary_score >= 3 THEN 'Promising'
      WHEN rf.recency_score >= 3 AND rf.frequency_score >= 2 THEN 'Potential Loyalists'
      WHEN rf.recency_score <= 2 AND rf.frequency_score >= 4 AND rf.monetary_score >= 4 THEN 'At Risk'
      WHEN rf.recency_score <= 2 AND rf.frequency_score >= 2 AND rf.monetary_score >= 2 THEN 'Need Attention'
      WHEN rf.recency_score <= 3 AND rf.frequency_score >= 2 AND rf.monetary_score >= 2 THEN 'Hibernating'
      ELSE 'Lost'
    END AS rfm_segment,
    rf.last_order_date
  FROM rfm_scores rf;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_customer_rfm() TO authenticated;

-- Get average customer lifetime value
CREATE OR REPLACE FUNCTION get_avg_customer_lifetime_value()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_clv NUMERIC;
BEGIN
  SELECT AVG(customer_total) INTO avg_clv
  FROM (
    SELECT COALESCE(SUM(o.total_amount), 0) AS customer_total
    FROM profiles p
    LEFT JOIN orders o ON p.id = o.user_id
    GROUP BY p.id
  ) customer_totals;

  RETURN COALESCE(avg_clv, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_avg_customer_lifetime_value() TO authenticated;

-- Get customer retention rate
CREATE OR REPLACE FUNCTION get_customer_retention_rate()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  retention_rate NUMERIC;
BEGIN
  WITH customer_order_months AS (
    SELECT
      o.user_id,
      DATE_TRUNC('month', o.created_at) AS order_month
    FROM orders o
    WHERE o.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY o.user_id, DATE_TRUNC('month', o.created_at)
  ),
  retention_data AS (
    SELECT
      order_month,
      LAG(order_month) OVER (PARTITION BY user_id ORDER BY order_month) AS prev_month
    FROM customer_order_months
  ),
  monthly_retention AS (
    SELECT
      order_month,
      COUNT(*) AS total_customers,
      COUNT(CASE WHEN prev_month = order_month - INTERVAL '1 month' THEN 1 END) AS retained_customers
    FROM retention_data
    WHERE prev_month IS NOT NULL
    GROUP BY order_month
  )
  SELECT
    CASE
      WHEN SUM(total_customers) > 0 THEN
        (SUM(retained_customers)::NUMERIC / SUM(total_customers)::NUMERIC) * 100
      ELSE 0::NUMERIC
    END
  INTO retention_rate
  FROM monthly_retention;

  RETURN COALESCE(retention_rate, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_retention_rate() TO authenticated;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Update product stock after order
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrease stock when order item is created
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- ADMIN SECURITY FUNCTIONS
-- ============================================

-- Log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    changes,
    status
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    'success'
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Check for brute force attempts
CREATE OR REPLACE FUNCTION check_brute_force(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_failed_count INTEGER;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*) INTO v_failed_count
  FROM login_attempts
  WHERE email = p_email
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Return true if too many failed attempts
  RETURN v_failed_count >= 5;
END;
$$;

-- Create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_admin_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO security_alerts (
    alert_type,
    severity,
    admin_user_id,
    details
  ) VALUES (
    p_alert_type,
    p_severity,
    p_admin_user_id,
    p_details
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- Check IP whitelist
CREATE OR REPLACE FUNCTION is_ip_whitelisted(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_ip_whitelist
    WHERE ip_address = p_ip_address
      AND is_active = true
  );
END;
$$;

-- Clean old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM admin_audit_log
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION get_business_overview IS 'Get comprehensive business metrics for admin dashboard';
COMMENT ON FUNCTION get_product_performance IS 'Get detailed performance metrics for a specific product';
COMMENT ON FUNCTION get_artist_earnings IS 'Calculate artist earnings after platform commission';
COMMENT ON FUNCTION get_product_recommendations IS 'Get personalized product recommendations based on user behavior';
COMMENT ON FUNCTION get_social_feed IS 'Get social activity feed for user';
COMMENT ON FUNCTION get_customer_order_stats IS 'Get order statistics for a specific customer';
COMMENT ON FUNCTION calculate_customer_rfm IS 'Calculate RFM (Recency, Frequency, Monetary) analysis for customer segmentation';
COMMENT ON FUNCTION get_avg_customer_lifetime_value IS 'Calculate average customer lifetime value across all customers';
COMMENT ON FUNCTION get_customer_retention_rate IS 'Calculate customer retention rate based on repeat purchases';
COMMENT ON FUNCTION log_admin_action IS 'Log admin action for audit trail';
COMMENT ON FUNCTION check_brute_force IS 'Check for brute force login attempts';
COMMENT ON FUNCTION create_security_alert IS 'Create security alert for admin monitoring';
COMMENT ON FUNCTION is_ip_whitelisted IS 'Check if IP address is whitelisted for admin access';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Clean up old audit logs (run periodically)';

