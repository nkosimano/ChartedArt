-- ============================================
-- Dashboard Test Queries - Phase 0 Verification
-- ============================================
-- 
-- Run these queries after the Phase 0 schema migration
-- to verify everything is working correctly and see sample data.
-- 
-- These queries simulate what your admin dashboard will display.
--
-- ============================================

-- 1. REVENUE DASHBOARD
-- ============================================

-- Daily revenue for the last 30 days
SELECT 
  date,
  total_revenue,
  total_orders,
  completed_orders,
  average_order_value,
  ROUND(conversion_rate * 100, 2) as conversion_percentage
FROM sales_metrics 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC
LIMIT 10;

-- Quick revenue summary
SELECT 
  SUM(total_revenue) as total_revenue_30d,
  SUM(total_orders) as total_orders_30d,
  AVG(average_order_value) as avg_order_value,
  ROUND(AVG(conversion_rate) * 100, 2) as avg_conversion_rate
FROM sales_metrics 
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- 2. PRODUCT PERFORMANCE
-- ============================================

-- Top performing products by revenue
SELECT 
  p.size,
  p.frame_type,
  p.base_price,
  pa.total_views,
  pa.total_purchases,
  pa.total_revenue,
  ROUND(pa.conversion_rate * 100, 2) as conversion_percentage,
  pa.last_calculated
FROM products p
JOIN product_analytics pa ON p.id = pa.product_id
ORDER BY pa.total_revenue DESC
LIMIT 10;

-- Products needing attention (low conversion)
SELECT 
  p.size,
  p.frame_type,
  pa.total_views,
  pa.total_purchases,
  ROUND(pa.conversion_rate * 100, 2) as conversion_percentage
FROM products p
JOIN product_analytics pa ON p.id = pa.product_id
WHERE pa.total_views > 10 AND pa.conversion_rate < 0.02
ORDER BY pa.total_views DESC;

-- 3. CUSTOMER INSIGHTS
-- ============================================

-- Customer segmentation overview
SELECT 
  customer_type,
  COUNT(*) as customer_count,
  AVG(lifetime_value) as avg_lifetime_value,
  AVG(total_orders) as avg_orders,
  AVG(days_since_last_order) as avg_days_since_last_order
FROM customer_insights_view
GROUP BY customer_type
ORDER BY avg_lifetime_value DESC;

-- Top 10 customers by lifetime value
SELECT 
  email,
  full_name,
  lifetime_value,
  total_orders,
  avg_order_value,
  customer_type,
  days_since_last_order
FROM customer_insights_view
ORDER BY lifetime_value DESC
LIMIT 10;

-- Customers at risk (haven't ordered in 30+ days)
SELECT 
  email,
  full_name,
  lifetime_value,
  total_orders,
  days_since_last_order
FROM customer_insights_view
WHERE days_since_last_order > 30 
  AND total_orders > 0
  AND customer_type IN ('repeat_customer', 'loyal_customer')
ORDER BY lifetime_value DESC
LIMIT 10;

-- 4. RECENT ACTIVITY
-- ============================================

-- Recent orders (last 7 days)
SELECT 
  DATE(o.created_at) as order_date,
  COUNT(*) as orders_count,
  SUM(o.total_amount) as daily_revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(o.created_at)
ORDER BY order_date DESC;

-- Recent user activity (sessions in last 7 days)
SELECT 
  DATE(started_at) as session_date,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(page_views) as avg_page_views,
  COUNT(*) FILTER (WHERE converted = true) as converted_sessions
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY session_date DESC;

-- 5. INVENTORY ALERTS
-- ============================================

-- Current inventory alerts
SELECT 
  ia.alert_type,
  ia.severity,
  p.size,
  p.frame_type,
  ia.current_stock,
  ia.threshold_value,
  ia.message,
  ia.created_at
FROM inventory_alerts ia
JOIN products p ON ia.product_id = p.id
WHERE ia.is_resolved = false
ORDER BY 
  CASE ia.severity 
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2  
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  ia.created_at DESC;

-- 6. MESSAGE & SUPPORT METRICS
-- ============================================

-- Recent messages by status
SELECT 
  status,
  priority,
  COUNT(*) as message_count,
  MAX(created_at) as latest_message
FROM messages
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status, priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    ELSE 4
  END;

-- Pending high-priority messages
SELECT 
  name,
  email,
  subject,
  priority,
  created_at
FROM messages
WHERE status = 'pending' 
  AND priority IN ('urgent', 'high')
ORDER BY 
  CASE priority WHEN 'urgent' THEN 1 ELSE 2 END,
  created_at ASC;

-- 7. USER ENGAGEMENT
-- ============================================

-- Most viewed products (last 30 days)
SELECT 
  p.size,
  p.frame_type,
  COUNT(ubh.id) as total_views,
  COUNT(DISTINCT ubh.user_id) as unique_viewers,
  AVG(ubh.time_spent_seconds) as avg_time_spent
FROM user_browsing_history ubh
JOIN products p ON ubh.product_id = p.id
WHERE ubh.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.size, p.frame_type
ORDER BY total_views DESC
LIMIT 10;

-- Device breakdown (last 7 days)
SELECT 
  device_type,
  COUNT(*) as session_count,
  AVG(page_views) as avg_page_views,
  COUNT(*) FILTER (WHERE converted = true) as conversions,
  ROUND(
    COUNT(*) FILTER (WHERE converted = true)::decimal / COUNT(*)::decimal * 100, 
    2
  ) as conversion_rate_percent
FROM user_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
  AND device_type IS NOT NULL
GROUP BY device_type
ORDER BY session_count DESC;

-- 8. WISHLIST INSIGHTS  
-- ============================================

-- Most wishlisted products
SELECT 
  p.size,
  p.frame_type,
  COUNT(wi.id) as wishlist_adds,
  COUNT(DISTINCT wi.wishlist_id) as unique_wishlists
FROM wishlist_items wi
JOIN products p ON wi.product_id = p.id
WHERE wi.added_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.size, p.frame_type
ORDER BY wishlist_adds DESC
LIMIT 10;

-- 9. PERFORMANCE CHECK
-- ============================================

-- Verify materialized views are populated
SELECT 
  'order_analytics_view' as view_name,
  COUNT(*) as row_count,
  MAX(order_date) as latest_data
FROM order_analytics_view
UNION ALL
SELECT 
  'customer_insights_view' as view_name,
  COUNT(*) as row_count,
  MAX(signup_date)::date as latest_data
FROM customer_insights_view;

-- Check if triggers are working (product analytics updates)
SELECT 
  'product_analytics' as table_name,
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE total_views > 0) as products_with_views,
  COUNT(*) FILTER (WHERE total_purchases > 0) as products_with_purchases,
  MAX(last_calculated) as last_update
FROM product_analytics;

-- 10. SAMPLE DATA INSIGHTS
-- ============================================

-- Overall business health snapshot
SELECT 
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as orders_last_30d,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30d,
  (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE started_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_last_7d,
  (SELECT COUNT(*) FROM messages WHERE status = 'pending') as pending_messages,
  (SELECT COUNT(*) FROM inventory_alerts WHERE is_resolved = false) as active_alerts;

-- Revenue trend (current vs previous month)
WITH current_month AS (
  SELECT SUM(total_revenue) as current_revenue
  FROM sales_metrics 
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
),
previous_month AS (
  SELECT SUM(total_revenue) as previous_revenue  
  FROM sales_metrics
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND date < DATE_TRUNC('month', CURRENT_DATE)
)
SELECT 
  cm.current_revenue,
  pm.previous_revenue,
  CASE 
    WHEN pm.previous_revenue > 0 THEN 
      ROUND(((cm.current_revenue - pm.previous_revenue) / pm.previous_revenue) * 100, 2)
    ELSE NULL 
  END as revenue_growth_percent
FROM current_month cm, previous_month pm;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 
  'Dashboard queries executed successfully!' as status,
  'Check the results above to verify your Phase 0 schema' as message,
  'If you see data, analytics are working correctly' as next_step;