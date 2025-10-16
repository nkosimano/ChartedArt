-- ============================================
-- Migration: 01900_views.sql
-- Description: Database views and materialized views
-- Dependencies: All previous migrations (00100-01800)
-- ============================================

-- Rollback:
-- DROP MATERIALIZED VIEW statements for all views created in this file

-- ============================================
-- ARTIST ANALYTICS VIEWS
-- ============================================

-- Artist sales analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS artist_sales_analytics AS
SELECT 
  p.artist_id,
  prof.full_name AS artist_name,
  COUNT(DISTINCT p.id) AS total_products,
  COUNT(DISTINCT oi.id) AS total_sales,
  COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue,
  COALESCE(AVG(oi.price), 0) AS avg_product_price,
  COUNT(DISTINCT o.user_id) AS unique_customers,
  MAX(o.created_at) AS last_sale_date,
  COALESCE(SUM(pa.views), 0) AS total_views,
  CASE 
    WHEN SUM(pa.views) > 0 THEN (COUNT(DISTINCT oi.id)::FLOAT / SUM(pa.views)) * 100
    ELSE 0
  END AS conversion_rate
FROM products p
LEFT JOIN profiles prof ON prof.id = p.artist_id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'delivered')
LEFT JOIN product_analytics pa ON pa.product_id = p.id
WHERE prof.is_artist = true
GROUP BY p.artist_id, prof.full_name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_sales_analytics_artist_id 
  ON artist_sales_analytics(artist_id);

-- ============================================
-- PRODUCT PERFORMANCE VIEWS
-- ============================================

-- Product performance summary view
CREATE OR REPLACE VIEW product_performance_summary AS
SELECT 
  p.id AS product_id,
  p.name,
  p.category,
  p.price,
  p.stock_quantity,
  p.status,
  p.artist_id,
  prof.full_name AS artist_name,
  COALESCE(SUM(pa.views), 0) AS total_views,
  COALESCE(SUM(pa.add_to_cart_count), 0) AS total_add_to_cart,
  COALESCE(COUNT(DISTINCT oi.id), 0) AS total_sales,
  COALESCE(SUM(oi.quantity), 0) AS units_sold,
  COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue,
  COALESCE(COUNT(DISTINCT pl.id), 0) AS total_likes,
  COALESCE(COUNT(DISTINCT pc.id), 0) AS total_comments,
  COALESCE(AVG(pc.rating), 0) AS avg_rating,
  CASE 
    WHEN SUM(pa.views) > 0 THEN (COUNT(DISTINCT oi.id)::FLOAT / SUM(pa.views)) * 100
    ELSE 0
  END AS conversion_rate
FROM products p
LEFT JOIN profiles prof ON prof.id = p.artist_id
LEFT JOIN product_analytics pa ON pa.product_id = p.id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'delivered')
LEFT JOIN product_likes pl ON pl.product_id = p.id
LEFT JOIN product_comments pc ON pc.product_id = p.id
GROUP BY p.id, p.name, p.category, p.price, p.stock_quantity, p.status, p.artist_id, prof.full_name;

-- ============================================
-- CUSTOMER ANALYTICS VIEWS
-- ============================================

-- Customer lifetime value view
CREATE OR REPLACE VIEW customer_lifetime_value AS
SELECT 
  o.user_id,
  prof.full_name AS customer_name,
  prof.email,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
  COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
  MIN(o.created_at) AS first_order_date,
  MAX(o.created_at) AS last_order_date,
  EXTRACT(DAYS FROM (MAX(o.created_at) - MIN(o.created_at))) AS customer_age_days,
  COUNT(DISTINCT oi.product_id) AS unique_products_purchased
FROM orders o
LEFT JOIN profiles prof ON prof.id = o.user_id
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('paid', 'delivered')
GROUP BY o.user_id, prof.full_name, prof.email;

-- ============================================
-- INVENTORY VIEWS
-- ============================================

-- Low stock products view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.stock_quantity,
  p.artist_id,
  prof.full_name AS artist_name,
  prof.email AS artist_email,
  COALESCE(COUNT(DISTINCT oi.id), 0) AS sales_last_30_days,
  CASE 
    WHEN COUNT(DISTINCT oi.id) > 0 THEN 
      p.stock_quantity::FLOAT / (COUNT(DISTINCT oi.id) / 30.0)
    ELSE 
      999
  END AS days_of_stock_remaining
FROM products p
LEFT JOIN profiles prof ON prof.id = p.artist_id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id 
  AND o.status IN ('paid', 'delivered')
  AND o.created_at >= NOW() - INTERVAL '30 days'
WHERE p.status = 'active'
  AND p.stock_quantity <= 10
GROUP BY p.id, p.name, p.category, p.stock_quantity, p.artist_id, prof.full_name, prof.email
ORDER BY p.stock_quantity ASC;

-- ============================================
-- MOVEMENT ANALYTICS VIEWS
-- ============================================

-- Movement performance view
CREATE OR REPLACE VIEW movement_performance AS
SELECT 
  m.id AS movement_id,
  m.name,
  m.status,
  m.goal_amount,
  m.goal_participants,
  mm.total_raised,
  mm.total_donations,
  mm.participant_count,
  mm.average_donation,
  mm.largest_donation,
  CASE 
    WHEN m.goal_amount > 0 THEN (mm.total_raised / m.goal_amount) * 100
    ELSE 0
  END AS funding_percentage,
  CASE 
    WHEN m.goal_participants > 0 THEN (mm.participant_count::FLOAT / m.goal_participants) * 100
    ELSE 0
  END AS participation_percentage,
  m.start_date,
  m.end_date,
  CASE 
    WHEN m.end_date IS NOT NULL THEN 
      EXTRACT(DAYS FROM (m.end_date - NOW()))
    ELSE 
      NULL
  END AS days_remaining
FROM movements m
LEFT JOIN movement_metrics mm ON mm.movement_id = m.id
WHERE m.archived_at IS NULL;

-- ============================================
-- COMMISSION ANALYTICS VIEWS
-- ============================================

-- Commission request summary view
CREATE OR REPLACE VIEW commission_request_summary AS
SELECT 
  cr.artist_id,
  prof.full_name AS artist_name,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN cr.status = 'pending' THEN 1 END) AS pending_requests,
  COUNT(CASE WHEN cr.status = 'accepted' THEN 1 END) AS accepted_requests,
  COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) AS completed_requests,
  COUNT(CASE WHEN cr.status = 'rejected' THEN 1 END) AS rejected_requests,
  COALESCE(AVG((cr.budget_min + cr.budget_max) / 2), 0) AS avg_budget,
  COALESCE(SUM(CASE WHEN cr.status = 'completed' THEN cr.quote_amount ELSE 0 END), 0) AS total_completed_value,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(CASE WHEN cr.status = 'completed' THEN 1 END)::FLOAT / COUNT(*)) * 100
    ELSE 
      0
  END AS completion_rate
FROM commission_requests cr
LEFT JOIN profiles prof ON prof.id = cr.artist_id
GROUP BY cr.artist_id, prof.full_name;

-- ============================================
-- BLOG ANALYTICS VIEWS
-- ============================================

-- Blog post performance view
CREATE OR REPLACE VIEW blog_post_performance AS
SELECT 
  bp.id,
  bp.title,
  bp.slug,
  bp.status,
  bp.author_id,
  prof.full_name AS author_name,
  bp.published_at,
  COALESCE(COUNT(DISTINCT bc.id), 0) AS total_comments,
  COALESCE(SUM(CASE WHEN bc.created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) AS comments_last_7_days,
  bp.created_at,
  bp.updated_at
FROM blog_posts bp
LEFT JOIN profiles prof ON prof.id = bp.author_id
LEFT JOIN blog_comments bc ON bc.post_id = bp.id
WHERE bp.status = 'published'
GROUP BY bp.id, bp.title, bp.slug, bp.status, bp.author_id, prof.full_name, bp.published_at, bp.created_at, bp.updated_at;

-- ============================================
-- REFRESH MATERIALIZED VIEWS FUNCTION
-- ============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY artist_sales_analytics;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON MATERIALIZED VIEW artist_sales_analytics IS 'Aggregated sales analytics per artist - refresh daily';
COMMENT ON VIEW product_performance_summary IS 'Comprehensive product performance metrics';
COMMENT ON VIEW customer_lifetime_value IS 'Customer lifetime value and purchase history';
COMMENT ON VIEW low_stock_products IS 'Products with low stock levels requiring attention';
COMMENT ON VIEW movement_performance IS 'Movement funding and participation metrics';
COMMENT ON VIEW commission_request_summary IS 'Commission request statistics per artist';
COMMENT ON VIEW blog_post_performance IS 'Blog post engagement metrics';
COMMENT ON FUNCTION refresh_all_materialized_views IS 'Refresh all materialized views - run daily via cron job';

