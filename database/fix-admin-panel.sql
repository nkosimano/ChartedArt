-- ========================================
-- COMPLETE ADMIN PANEL DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. ADD MISSING PHONE COLUMN TO PROFILES
-- ========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. FIX PRODUCTS -> PROFILES RELATIONSHIP
-- ========================================
-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_artist_id_fkey'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_artist_id_fkey 
        FOREIGN KEY (artist_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. ENSURE PRODUCTS TABLE HAS NAME COLUMN
-- ========================================
-- Check if name column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'name'
    ) THEN
        ALTER TABLE products ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Product';
    END IF;
END $$;

-- 4. CREATE SYSTEM_CONFIG TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Allow admins to read/write system config
CREATE POLICY "Admins can manage system config" ON system_config
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Insert default system config
INSERT INTO system_config (key, value, description, category, is_public)
VALUES 
    ('site_name', 'ChartedArt', 'Website name displayed in titles and headers', 'general', true),
    ('maintenance_mode', 'false', 'Enable maintenance mode to temporarily disable public access', 'general', false),
    ('commission_rate', '15', 'Default commission rate for artists (%)', 'business', false),
    ('email_notifications', 'true', 'Enable email notifications for orders and updates', 'notifications', false)
ON CONFLICT (key) DO NOTHING;

-- 5. CREATE CUSTOMER STATS FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION get_customer_order_stats(customer_id UUID)
RETURNS TABLE (
    total_orders INTEGER,
    total_spent NUMERIC,
    avg_order_value NUMERIC,
    days_since_last_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT o.id)::INTEGER as total_orders,
        COALESCE(SUM(o.total_amount), 0)::NUMERIC as total_spent,
        COALESCE(AVG(o.total_amount), 0)::NUMERIC as avg_order_value,
        CASE 
            WHEN MAX(o.created_at) IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM NOW() - MAX(o.created_at))::INTEGER
        END as days_since_last_order
    FROM orders o
    WHERE o.user_id = customer_id
        AND o.status IN ('paid', 'delivered', 'completed');
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. CREATE RFM ANALYSIS FUNCTION (Simplified)
-- ========================================
CREATE OR REPLACE FUNCTION calculate_customer_rfm()
RETURNS TABLE (
    customer_id UUID,
    recency_score INTEGER,
    frequency_score INTEGER,
    monetary_score INTEGER,
    rfm_segment TEXT,
    last_order_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH customer_metrics AS (
        SELECT 
            o.user_id,
            MAX(o.created_at) as last_order,
            COUNT(DISTINCT o.id) as order_count,
            SUM(o.total_amount) as total_spent,
            EXTRACT(DAY FROM NOW() - MAX(o.created_at)) as days_since_last_order
        FROM orders o
        WHERE o.status IN ('paid', 'delivered', 'completed')
        GROUP BY o.user_id
    )
    SELECT 
        cm.user_id,
        CASE 
            WHEN cm.days_since_last_order <= 30 THEN 5
            WHEN cm.days_since_last_order <= 60 THEN 4
            WHEN cm.days_since_last_order <= 90 THEN 3
            WHEN cm.days_since_last_order <= 180 THEN 2
            ELSE 1
        END::INTEGER as recency_score,
        CASE 
            WHEN cm.order_count >= 10 THEN 5
            WHEN cm.order_count >= 7 THEN 4
            WHEN cm.order_count >= 4 THEN 3
            WHEN cm.order_count >= 2 THEN 2
            ELSE 1
        END::INTEGER as frequency_score,
        CASE 
            WHEN cm.total_spent >= 5000 THEN 5
            WHEN cm.total_spent >= 2000 THEN 4
            WHEN cm.total_spent >= 1000 THEN 3
            WHEN cm.total_spent >= 500 THEN 2
            ELSE 1
        END::INTEGER as monetary_score,
        CASE 
            WHEN cm.days_since_last_order <= 30 AND cm.order_count >= 5 AND cm.total_spent >= 1000 THEN 'Champions'
            WHEN cm.days_since_last_order <= 60 AND cm.order_count >= 3 THEN 'Loyal Customers'
            WHEN cm.days_since_last_order <= 30 AND cm.order_count >= 2 THEN 'Potential Loyalists'
            WHEN cm.days_since_last_order <= 14 THEN 'New Customers'
            WHEN cm.days_since_last_order > 90 AND cm.total_spent >= 1000 THEN 'Cannot Lose Them'
            WHEN cm.days_since_last_order > 60 AND cm.days_since_last_order <= 90 AND cm.total_spent >= 500 THEN 'At Risk'
            WHEN cm.days_since_last_order > 90 AND cm.days_since_last_order <= 365 THEN 'Hibernating'
            WHEN cm.days_since_last_order > 365 THEN 'Lost'
            ELSE 'New Customers'
        END::TEXT as rfm_segment,
        cm.last_order
    FROM customer_metrics cm;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. CREATE CUSTOMER LIFETIME VALUE FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION get_avg_customer_lifetime_value()
RETURNS NUMERIC AS $$
DECLARE
    avg_value NUMERIC;
BEGIN
    SELECT COALESCE(AVG(customer_value), 0)
    INTO avg_value
    FROM (
        SELECT 
            o.user_id,
            SUM(o.total_amount) as customer_value
        FROM orders o
        WHERE o.status IN ('paid', 'delivered', 'completed')
        GROUP BY o.user_id
    ) customer_totals;
    
    RETURN avg_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. CREATE CUSTOMER RETENTION RATE FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION get_customer_retention_rate()
RETURNS NUMERIC AS $$
DECLARE
    retention_rate NUMERIC;
BEGIN
    WITH customer_cohorts AS (
        SELECT 
            user_id,
            MIN(DATE_TRUNC('month', created_at)) as first_purchase_month,
            COUNT(DISTINCT DATE_TRUNC('month', created_at)) as months_active
        FROM orders
        WHERE status IN ('paid', 'delivered', 'completed')
        GROUP BY user_id
        HAVING COUNT(*) > 1
    )
    SELECT 
        COALESCE(
            (COUNT(DISTINCT user_id)::NUMERIC / NULLIF(
                (SELECT COUNT(DISTINCT user_id) FROM orders WHERE status IN ('paid', 'delivered', 'completed')), 
                0
            )) * 100,
            0
        )
    INTO retention_rate
    FROM customer_cohorts;
    
    RETURN COALESCE(retention_rate, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. GRANT EXECUTE PERMISSIONS ON FUNCTIONS
-- ========================================
GRANT EXECUTE ON FUNCTION get_customer_order_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_customer_rfm() TO authenticated;
GRANT EXECUTE ON FUNCTION get_avg_customer_lifetime_value() TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_retention_rate() TO authenticated;

-- 10. VERIFY SETUP
-- ========================================
-- Check profiles
SELECT 'Profiles check:' as info, COUNT(*) as count FROM profiles;

-- Check admin_users
SELECT 'Admin users check:' as info, COUNT(*) as count FROM admin_users;

-- Check if your user is admin
SELECT 'Your admin status:' as info, au.*, p.email
FROM admin_users au
JOIN profiles p ON au.user_id = p.id
WHERE p.email = 'dhlisob@gmail.com';

-- If no admin found, add yourself
INSERT INTO admin_users (user_id, role, is_active)
SELECT id, 'super_admin', true 
FROM profiles 
WHERE email = 'dhlisob@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET role = 'super_admin', is_active = true, updated_at = NOW();

-- Final verification
SELECT 'Setup complete! Your admin account:' as message, au.role, p.email, p.full_name
FROM admin_users au
JOIN profiles p ON au.user_id = p.id
WHERE p.email = 'dhlisob@gmail.com';
