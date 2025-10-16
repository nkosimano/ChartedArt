-- Create RPC functions for ChartedArt application
-- Run this AFTER running the drop_existing_functions.sql migration

-- Function to get business overview
CREATE FUNCTION get_business_overview()
RETURNS TABLE (
    total_products bigint,
    total_users bigint,
    total_orders bigint,
    pending_messages bigint,
    active_alerts bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM products)::bigint as total_products,
        (SELECT COUNT(*) FROM profiles)::bigint as total_users,
        (SELECT COUNT(*) FROM orders)::bigint as total_orders,
        (SELECT COUNT(*) FROM messages WHERE status = 'pending')::bigint as pending_messages,
        (SELECT COUNT(*) FROM inventory_alerts WHERE is_resolved = false)::bigint as active_alerts;
END;
$$;

GRANT EXECUTE ON FUNCTION get_business_overview() TO authenticated;

-- Function to get customer order statistics
CREATE FUNCTION get_customer_order_stats(customer_id uuid)
RETURNS TABLE (
    total_orders bigint,
    total_spent numeric,
    avg_order_value numeric,
    days_since_last_order integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(o.id)::bigint as total_orders,
        COALESCE(SUM(o.total_amount), 0)::numeric as total_spent,
        CASE 
            WHEN COUNT(o.id) > 0 THEN (COALESCE(SUM(o.total_amount), 0) / COUNT(o.id))::numeric
            ELSE 0::numeric
        END as avg_order_value,
        CASE 
            WHEN MAX(o.created_at) IS NOT NULL THEN 
                EXTRACT(DAY FROM (NOW() - MAX(o.created_at)))::integer
            ELSE NULL::integer
        END as days_since_last_order
    FROM orders o
    WHERE o.user_id = customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_order_stats(uuid) TO authenticated;

-- Function to calculate customer RFM analysis
CREATE FUNCTION calculate_customer_rfm()
RETURNS TABLE (
    customer_id uuid,
    recency_score integer,
    frequency_score integer,
    monetary_score integer,
    rfm_segment text,
    last_order_date timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH customer_metrics AS (
        SELECT 
            p.id as customer_id,
            COALESCE(MAX(o.created_at), p.created_at) as last_order_date,
            COUNT(o.id) as frequency,
            COALESCE(SUM(o.total_amount), 0) as monetary_value,
            EXTRACT(DAY FROM (NOW() - COALESCE(MAX(o.created_at), p.created_at))) as recency_days
        FROM profiles p
        LEFT JOIN orders o ON p.id = o.user_id
        GROUP BY p.id, p.created_at
    ),
    rfm_scores AS (
        SELECT 
            cm.customer_id,
            cm.last_order_date,
            CASE 
                WHEN cm.recency_days <= 30 THEN 5
                WHEN cm.recency_days <= 60 THEN 4
                WHEN cm.recency_days <= 90 THEN 3
                WHEN cm.recency_days <= 180 THEN 2
                ELSE 1
            END as recency_score,
            CASE 
                WHEN cm.frequency >= 10 THEN 5
                WHEN cm.frequency >= 6 THEN 4
                WHEN cm.frequency >= 3 THEN 3
                WHEN cm.frequency >= 1 THEN 2
                ELSE 1
            END as frequency_score,
            CASE 
                WHEN cm.monetary_value >= 2000 THEN 5
                WHEN cm.monetary_value >= 1000 THEN 4
                WHEN cm.monetary_value >= 500 THEN 3
                WHEN cm.monetary_value >= 100 THEN 2
                ELSE 1
            END as monetary_score
        FROM customer_metrics cm
    )
    SELECT 
        rf.customer_id,
        rf.recency_score,
        rf.frequency_score,
        rf.monetary_score,
        CASE 
            WHEN rf.recency_score >= 4 AND rf.frequency_score >= 4 AND rf.monetary_score >= 4 THEN 'Champions'
            WHEN rf.recency_score >= 3 AND rf.frequency_score >= 3 AND rf.monetary_score >= 3 THEN 'Loyal Customers'
            WHEN rf.recency_score >= 4 AND rf.frequency_score >= 2 AND rf.monetary_score >= 2 THEN 'Potential Loyalists'
            WHEN rf.recency_score >= 4 AND rf.frequency_score <= 2 THEN 'New Customers'
            WHEN rf.recency_score <= 3 AND rf.frequency_score >= 3 AND rf.monetary_score >= 4 THEN 'At Risk'
            WHEN rf.recency_score <= 2 AND rf.frequency_score >= 3 AND rf.monetary_score >= 4 THEN 'Cannot Lose Them'
            WHEN rf.recency_score <= 3 AND rf.frequency_score >= 2 AND rf.monetary_score >= 2 THEN 'Hibernating'
            ELSE 'Lost'
        END as rfm_segment,
        rf.last_order_date
    FROM rfm_scores rf;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_customer_rfm() TO authenticated;

-- Function to get average customer lifetime value
CREATE FUNCTION get_avg_customer_lifetime_value()
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    avg_clv numeric;
BEGIN
    SELECT AVG(customer_total) INTO avg_clv
    FROM (
        SELECT COALESCE(SUM(o.total_amount), 0) as customer_total
        FROM profiles p
        LEFT JOIN orders o ON p.id = o.user_id
        GROUP BY p.id
    ) customer_totals;
    
    RETURN COALESCE(avg_clv, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_avg_customer_lifetime_value() TO authenticated;

-- Function to get customer retention rate
CREATE FUNCTION get_customer_retention_rate()
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    retention_rate numeric;
BEGIN
    WITH customer_order_months AS (
        SELECT 
            o.user_id,
            DATE_TRUNC('month', o.created_at) as order_month
        FROM orders o
        WHERE o.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY o.user_id, DATE_TRUNC('month', o.created_at)
    ),
    retention_data AS (
        SELECT 
            order_month,
            LAG(order_month) OVER (PARTITION BY user_id ORDER BY order_month) as prev_month
        FROM customer_order_months
    ),
    monthly_retention AS (
        SELECT 
            order_month,
            COUNT(*) as total_customers,
            COUNT(CASE WHEN prev_month = order_month - INTERVAL '1 month' THEN 1 END) as retained_customers
        FROM retention_data
        WHERE prev_month IS NOT NULL
        GROUP BY order_month
    )
    SELECT 
        CASE 
            WHEN SUM(total_customers) > 0 THEN 
                (SUM(retained_customers)::numeric / SUM(total_customers)::numeric) * 100
            ELSE 0::numeric
        END
    INTO retention_rate
    FROM monthly_retention;
    
    RETURN COALESCE(retention_rate, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_retention_rate() TO authenticated;