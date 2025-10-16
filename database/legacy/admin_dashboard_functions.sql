-- Enhanced Admin Dashboard Database Functions
-- Run these functions in your Supabase SQL editor

-- Function to get comprehensive revenue metrics
CREATE OR REPLACE FUNCTION get_revenue_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  total_revenue DECIMAL := 0;
  monthly_revenue DECIMAL := 0;
  weekly_revenue DECIMAL := 0;
  daily_revenue DECIMAL := 0;
  prev_period_revenue DECIMAL := 0;
  growth_rate DECIMAL := 0;
  period_days INTEGER;
BEGIN
  -- Calculate period length in days
  period_days := EXTRACT(DAY FROM (end_date - start_date));
  
  -- Total revenue in period
  SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
  FROM orders 
  WHERE created_at BETWEEN start_date AND end_date
    AND status IN ('paid', 'delivered');
  
  -- Monthly revenue (last 30 days from end_date)
  SELECT COALESCE(SUM(total_amount), 0) INTO monthly_revenue
  FROM orders 
  WHERE created_at BETWEEN (end_date - INTERVAL '30 days') AND end_date
    AND status IN ('paid', 'delivered');
  
  -- Weekly revenue (last 7 days from end_date)
  SELECT COALESCE(SUM(total_amount), 0) INTO weekly_revenue
  FROM orders 
  WHERE created_at BETWEEN (end_date - INTERVAL '7 days') AND end_date
    AND status IN ('paid', 'delivered');
  
  -- Daily revenue (last 24 hours from end_date)
  SELECT COALESCE(SUM(total_amount), 0) INTO daily_revenue
  FROM orders 
  WHERE created_at BETWEEN (end_date - INTERVAL '1 day') AND end_date
    AND status IN ('paid', 'delivered');
  
  -- Previous period revenue for growth calculation
  SELECT COALESCE(SUM(total_amount), 0) INTO prev_period_revenue
  FROM orders 
  WHERE created_at BETWEEN (start_date - (end_date - start_date)) AND start_date
    AND status IN ('paid', 'delivered');
  
  -- Calculate growth rate
  IF prev_period_revenue > 0 THEN
    growth_rate := ((total_revenue - prev_period_revenue) / prev_period_revenue) * 100;
  END IF;
  
  RETURN jsonb_build_object(
    'total', total_revenue,
    'monthly', monthly_revenue,
    'weekly', weekly_revenue,
    'daily', daily_revenue,
    'currency', 'USD',
    'growth_rate', growth_rate
  );
END;
$$;

-- Function to get comprehensive order metrics
CREATE OR REPLACE FUNCTION get_order_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  metrics JSONB;
BEGIN
  WITH order_stats AS (
    SELECT 
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded,
      AVG(CASE WHEN status IN ('paid', 'delivered') THEN total_amount END) as avg_value
    FROM orders
    WHERE created_at BETWEEN start_date AND end_date
  )
  SELECT jsonb_build_object(
    'total', COALESCE(total_orders, 0),
    'pending', COALESCE(pending, 0),
    'confirmed', COALESCE(confirmed, 0),
    'shipped', COALESCE(shipped, 0),
    'delivered', COALESCE(delivered, 0),
    'cancelled', COALESCE(cancelled, 0),
    'refunded', COALESCE(refunded, 0),
    'average_value', COALESCE(avg_value, 0)
  ) INTO metrics
  FROM order_stats;
  
  RETURN metrics;
END;
$$;

-- Function to get user metrics and analytics
CREATE OR REPLACE FUNCTION get_user_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  metrics JSONB;
BEGIN
  WITH user_stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
      COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as new_today,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month
    FROM profiles
    WHERE created_at BETWEEN start_date AND end_date
  ),
  retention_calc AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_new_users,
      COUNT(DISTINCT CASE WHEN o.user_id IS NOT NULL THEN p.id END) as retained_users
    FROM profiles p
    LEFT JOIN orders o ON p.id = o.user_id 
      AND o.created_at > p.created_at + INTERVAL '7 days'
      AND o.created_at <= p.created_at + INTERVAL '37 days'
    WHERE p.created_at BETWEEN start_date - INTERVAL '37 days' AND end_date - INTERVAL '7 days'
  )
  SELECT jsonb_build_object(
    'total', COALESCE(us.total_users, 0),
    'active', COALESCE(us.active_users, 0),
    'new_today', COALESCE(us.new_today, 0),
    'new_this_week', COALESCE(us.new_this_week, 0),
    'new_this_month', COALESCE(us.new_this_month, 0),
    'retention_rate', CASE 
      WHEN rc.total_new_users > 0 THEN (rc.retained_users::FLOAT / rc.total_new_users::FLOAT) * 100
      ELSE 0 
    END
  ) INTO metrics
  FROM user_stats us, retention_calc rc;
  
  RETURN metrics;
END;
$$;

-- Function to get product metrics and top selling products
CREATE OR REPLACE FUNCTION get_product_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  metrics JSONB;
  top_selling JSONB;
BEGIN
  WITH product_stats AS (
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
      COUNT(CASE WHEN stock_quantity = 0 AND status = 'active' THEN 1 END) as out_of_stock,
      COUNT(CASE WHEN stock_quantity <= 5 AND stock_quantity > 0 AND status = 'active' THEN 1 END) as low_stock,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_products
    FROM products
  ),
  top_products AS (
    SELECT 
      p.id,
      p.name,
      prof.full_name as artist_name,
      COUNT(oi.id) as total_sales,
      SUM(oi.quantity) as units_sold,
      SUM(oi.price * oi.quantity) as revenue,
      p.image_url
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN profiles prof ON p.artist_id = prof.id
    WHERE o.created_at BETWEEN start_date AND end_date
      AND o.status IN ('paid', 'delivered')
    GROUP BY p.id, p.name, prof.full_name, p.image_url
    ORDER BY revenue DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'total', COALESCE(ps.total_products, 0),
    'active', COALESCE(ps.active_products, 0),
    'out_of_stock', COALESCE(ps.out_of_stock, 0),
    'low_stock', COALESCE(ps.low_stock, 0),
    'draft', COALESCE(ps.draft_products, 0),
    'top_selling', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'artist_name', artist_name,
          'total_sales', total_sales,
          'units_sold', units_sold,
          'revenue', revenue,
          'image_url', image_url
        )
      ) FROM top_products), 
      '[]'::jsonb
    )
  ) INTO metrics
  FROM product_stats ps;
  
  RETURN metrics;
END;
$$;

-- Function to get artist metrics and top earning artists
CREATE OR REPLACE FUNCTION get_artist_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  metrics JSONB;
BEGIN
  WITH artist_stats AS (
    SELECT 
      COUNT(*) as total_artists,
      COUNT(CASE WHEN is_verified = true THEN 1 END) as active_artists,
      COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_approval
    FROM profiles
    WHERE is_artist = true
  ),
  top_artists AS (
    SELECT 
      p.id,
      p.full_name as name,
      p.avatar_url,
      COUNT(DISTINCT o.id) as total_sales,
      SUM(oi.price * oi.quantity) as total_revenue,
      AVG(p.commission_rate) as commission_rate,
      SUM(oi.price * oi.quantity * (p.commission_rate / 100.0)) as earnings
    FROM profiles p
    JOIN products pr ON p.id = pr.artist_id
    JOIN order_items oi ON pr.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at BETWEEN start_date AND end_date
      AND o.status IN ('paid', 'delivered')
      AND p.is_artist = true
    GROUP BY p.id, p.full_name, p.avatar_url
    ORDER BY total_revenue DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'total', COALESCE(ast.total_artists, 0),
    'active', COALESCE(ast.active_artists, 0),
    'pending_approval', COALESCE(ast.pending_approval, 0),
    'top_earning', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'avatar_url', avatar_url,
          'total_revenue', total_revenue,
          'total_sales', total_sales,
          'commission_rate', commission_rate,
          'earnings', earnings
        )
      ) FROM top_artists), 
      '[]'::jsonb
    )
  ) INTO metrics
  FROM artist_stats ast;
  
  RETURN metrics;
END;
$$;

-- Function to get analytics metrics from browsing data
CREATE OR REPLACE FUNCTION get_analytics_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  metrics JSONB;
BEGIN
  WITH analytics_data AS (
    SELECT 
      COUNT(*) as total_page_views,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(DISTINCT user_id) as unique_visitors,
      AVG(time_spent_seconds) as avg_session_duration
    FROM user_browsing_history
    WHERE created_at BETWEEN start_date AND end_date
  ),
  conversion_data AS (
    SELECT 
      COUNT(DISTINCT ubh.session_id) as total_sessions,
      COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN ubh.session_id END) as converted_sessions
    FROM user_browsing_history ubh
    LEFT JOIN orders o ON ubh.user_id = o.user_id 
      AND o.created_at BETWEEN ubh.created_at AND ubh.created_at + INTERVAL '24 hours'
      AND o.status IN ('paid', 'delivered')
    WHERE ubh.created_at BETWEEN start_date AND end_date
  ),
  bounce_data AS (
    SELECT 
      COUNT(DISTINCT session_id) as single_page_sessions,
      COUNT(DISTINCT session_id) FILTER (WHERE page_count = 1) as bounced_sessions
    FROM (
      SELECT 
        session_id,
        COUNT(*) as page_count
      FROM user_browsing_history
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY session_id
    ) session_pages
  )
  SELECT jsonb_build_object(
    'page_views', COALESCE(ad.total_page_views, 0),
    'unique_visitors', COALESCE(ad.unique_visitors, 0),
    'conversion_rate', CASE 
      WHEN cd.total_sessions > 0 THEN (cd.converted_sessions::FLOAT / cd.total_sessions::FLOAT) * 100
      ELSE 0 
    END,
    'bounce_rate', CASE 
      WHEN bd.single_page_sessions > 0 THEN (bd.bounced_sessions::FLOAT / bd.single_page_sessions::FLOAT) * 100
      ELSE 0 
    END,
    'avg_session_duration', COALESCE(ad.avg_session_duration, 0)
  ) INTO metrics
  FROM analytics_data ad, conversion_data cd, bounce_data bd;
  
  RETURN metrics;
END;
$$;

-- Function to get detailed sales analytics by time period
CREATE OR REPLACE FUNCTION get_sales_analytics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  group_by_period VARCHAR DEFAULT 'day' -- 'hour', 'day', 'week', 'month'
)
RETURNS TABLE (
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  total_orders INTEGER,
  total_revenue DECIMAL,
  avg_order_value DECIMAL,
  unique_customers INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  date_trunc_format VARCHAR;
  interval_format VARCHAR;
BEGIN
  -- Set date truncation and interval based on period
  CASE group_by_period
    WHEN 'hour' THEN 
      date_trunc_format := 'hour';
      interval_format := '1 hour';
    WHEN 'day' THEN 
      date_trunc_format := 'day';
      interval_format := '1 day';
    WHEN 'week' THEN 
      date_trunc_format := 'week';
      interval_format := '1 week';
    WHEN 'month' THEN 
      date_trunc_format := 'month';
      interval_format := '1 month';
    ELSE 
      date_trunc_format := 'day';
      interval_format := '1 day';
  END CASE;
  
  RETURN QUERY
  EXECUTE format('
    WITH periods AS (
      SELECT 
        date_trunc(%L, gs) as period_start,
        date_trunc(%L, gs) + interval %L - interval ''1 second'' as period_end
      FROM generate_series(%L, %L, interval %L) gs
    ),
    order_data AS (
      SELECT 
        date_trunc(%L, o.created_at) as order_period,
        COUNT(*) as order_count,
        SUM(o.total_amount) as revenue,
        AVG(o.total_amount) as avg_value,
        COUNT(DISTINCT o.user_id) as customers
      FROM orders o
      WHERE o.created_at BETWEEN %L AND %L
        AND o.status IN (''paid'', ''delivered'')
      GROUP BY date_trunc(%L, o.created_at)
    )
    SELECT 
      p.period_start,
      p.period_end,
      COALESCE(od.order_count, 0)::INTEGER,
      COALESCE(od.revenue, 0)::DECIMAL,
      COALESCE(od.avg_value, 0)::DECIMAL,
      COALESCE(od.customers, 0)::INTEGER
    FROM periods p
    LEFT JOIN order_data od ON p.period_start = od.order_period
    ORDER BY p.period_start',
    date_trunc_format, date_trunc_format, interval_format,
    start_date, end_date, interval_format,
    date_trunc_format, start_date, end_date, date_trunc_format
  );
END;
$$;

-- Function to get inventory alerts and recommendations
CREATE OR REPLACE FUNCTION get_inventory_alerts()
RETURNS TABLE (
  alert_type VARCHAR,
  product_id UUID,
  product_name VARCHAR,
  artist_name VARCHAR,
  current_stock INTEGER,
  recommended_action VARCHAR,
  priority INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH product_sales_velocity AS (
    SELECT 
      p.id as product_id,
      p.name as product_name,
      prof.full_name as artist_name,
      p.stock_quantity,
      COUNT(oi.id) as sales_last_30_days,
      COUNT(oi.id) / 30.0 as avg_daily_sales
    FROM products p
    LEFT JOIN profiles prof ON p.artist_id = prof.id
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
      AND o.created_at >= NOW() - INTERVAL '30 days'
      AND o.status IN ('paid', 'delivered')
    WHERE p.status = 'active'
    GROUP BY p.id, p.name, prof.full_name, p.stock_quantity
  )
  SELECT 
    CASE 
      WHEN stock_quantity = 0 THEN 'OUT_OF_STOCK'
      WHEN stock_quantity <= 3 THEN 'CRITICAL_LOW'
      WHEN stock_quantity <= 5 AND avg_daily_sales > 0.2 THEN 'LOW_STOCK_HIGH_DEMAND'
      WHEN stock_quantity <= 10 AND avg_daily_sales > 0.5 THEN 'MODERATE_LOW'
      ELSE 'NORMAL'
    END as alert_type,
    psv.product_id,
    psv.product_name::VARCHAR,
    COALESCE(psv.artist_name, 'Unknown Artist')::VARCHAR,
    psv.stock_quantity,
    CASE 
      WHEN stock_quantity = 0 THEN 'Urgent: Restock immediately'
      WHEN stock_quantity <= 3 THEN 'High Priority: Restock within 24 hours'
      WHEN stock_quantity <= 5 AND avg_daily_sales > 0.2 THEN 'Medium Priority: Restock within 3 days'
      WHEN stock_quantity <= 10 AND avg_daily_sales > 0.5 THEN 'Low Priority: Consider restocking'
      ELSE 'No action needed'
    END as recommended_action,
    CASE 
      WHEN stock_quantity = 0 THEN 5
      WHEN stock_quantity <= 3 THEN 4
      WHEN stock_quantity <= 5 AND avg_daily_sales > 0.2 THEN 3
      WHEN stock_quantity <= 10 AND avg_daily_sales > 0.5 THEN 2
      ELSE 1
    END as priority
  FROM product_sales_velocity psv
  WHERE stock_quantity <= 10 OR avg_daily_sales > 0.1
  ORDER BY 
    CASE 
      WHEN stock_quantity = 0 THEN 5
      WHEN stock_quantity <= 3 THEN 4
      WHEN stock_quantity <= 5 AND avg_daily_sales > 0.2 THEN 3
      WHEN stock_quantity <= 10 AND avg_daily_sales > 0.5 THEN 2
      ELSE 1
    END DESC, avg_daily_sales DESC;
END;
$$;

-- Function to get customer lifetime value metrics
CREATE OR REPLACE FUNCTION get_customer_ltv_metrics()
RETURNS TABLE (
  user_id UUID,
  customer_name VARCHAR,
  email VARCHAR,
  first_purchase_date TIMESTAMPTZ,
  last_purchase_date TIMESTAMPTZ,
  total_orders INTEGER,
  total_spent DECIMAL,
  avg_order_value DECIMAL,
  days_since_last_purchase INTEGER,
  predicted_ltv DECIMAL,
  customer_segment VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH customer_metrics AS (
    SELECT 
      o.user_id,
      COUNT(*) as order_count,
      SUM(o.total_amount) as total_revenue,
      AVG(o.total_amount) as avg_order_val,
      MIN(o.created_at) as first_order,
      MAX(o.created_at) as last_order,
      EXTRACT(days FROM (NOW() - MAX(o.created_at)))::INTEGER as days_since_last
    FROM orders o
    WHERE o.status IN ('paid', 'delivered')
    GROUP BY o.user_id
  ),
  customer_segments AS (
    SELECT 
      cm.*,
      p.full_name,
      au.email,
      -- Simple LTV prediction based on order frequency and value
      (cm.total_revenue / GREATEST(EXTRACT(days FROM (cm.last_order - cm.first_order)), 1)) * 365 as predicted_yearly_ltv,
      CASE 
        WHEN cm.total_revenue >= 1000 AND cm.order_count >= 5 THEN 'VIP'
        WHEN cm.total_revenue >= 500 OR cm.order_count >= 3 THEN 'HIGH_VALUE'
        WHEN cm.total_revenue >= 100 OR cm.order_count >= 2 THEN 'REGULAR'
        WHEN cm.days_since_last <= 30 THEN 'NEW'
        WHEN cm.days_since_last <= 90 THEN 'ACTIVE'
        ELSE 'AT_RISK'
      END as segment
    FROM customer_metrics cm
    JOIN profiles p ON cm.user_id = p.id
    JOIN auth.users au ON cm.user_id = au.id
  )
  SELECT 
    cs.user_id,
    COALESCE(cs.full_name, 'Unknown')::VARCHAR as customer_name,
    cs.email::VARCHAR,
    cs.first_order,
    cs.last_order,
    cs.order_count,
    cs.total_revenue,
    cs.avg_order_val,
    cs.days_since_last,
    cs.predicted_yearly_ltv,
    cs.segment::VARCHAR
  FROM customer_segments cs
  ORDER BY cs.total_revenue DESC;
END;
$$;

-- Create materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_dashboard_summary AS
SELECT 
  'summary'::text as metric_type,
  NOW() as last_updated,
  (
    SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as orders_last_30_days,
  (
    SELECT SUM(total_amount) FROM orders 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' 
    AND status IN ('paid', 'delivered')
  ) as revenue_last_30_days,
  (
    SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as new_users_last_30_days,
  (
    SELECT COUNT(*) FROM products WHERE stock_quantity <= 5 AND status = 'active'
  ) as low_stock_products,
  (
    SELECT COUNT(*) FROM profiles WHERE is_artist = true AND is_verified = false
  ) as pending_artist_approvals;

-- Function to refresh dashboard summary
CREATE OR REPLACE FUNCTION refresh_admin_dashboard_summary()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW admin_dashboard_summary;
END;
$$;

-- Schedule summary refresh (would typically be set up as a cron job)
-- SELECT cron.schedule('refresh-admin-dashboard', '*/5 * * * *', 'SELECT refresh_admin_dashboard_summary();');