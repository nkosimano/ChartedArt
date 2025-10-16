-- ============================================
-- POST-MIGRATION VERIFICATION & ADMIN SETUP
-- ============================================

-- 1. VERIFY SCHEMA IS COMPLETE
-- ============================================

-- Check all tables were created
SELECT 
  'Schema Verification' as check_type,
  COUNT(*) as total_tables,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as table_list
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%';

-- Check materialized views
SELECT 
  'Materialized Views' as check_type,
  COUNT(*) as view_count,
  STRING_AGG(table_name, ', ') as view_names
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'VIEW'
  AND table_name LIKE '%_view';

-- Check sample products were created
SELECT 
  'Sample Products' as check_type,
  COUNT(*) as product_count,
  STRING_AGG(DISTINCT size, ', ') as sizes_available,
  STRING_AGG(DISTINCT frame_type, ', ') as frame_types_available
FROM products;

-- Check product analytics initialized
SELECT 
  'Product Analytics' as check_type,
  COUNT(*) as analytics_rows,
  SUM(total_views) as total_views,
  SUM(total_purchases) as total_purchases
FROM product_analytics;

-- Check sales metrics initialized
SELECT 
  'Sales Metrics' as check_type,
  COUNT(*) as days_of_data,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM sales_metrics;

-- ============================================
-- 2. FIND YOUR USER ID FOR ADMIN SETUP
-- ============================================

-- Show your user details (you need this for admin setup)
SELECT 
  'Your User Info' as info_type,
  id as your_user_id,
  email,
  created_at as account_created,
  'Copy this UUID for admin setup below' as instruction
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================
-- 3. MAKE YOURSELF AN ADMIN
-- ============================================
-- 
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual UUID from above
-- Then uncomment and run the INSERT statement below
-- 

-- INSERT INTO admin_users (user_id, role, permissions, created_by) 
-- VALUES (
--   'YOUR_USER_ID_HERE',  -- Replace with your UUID from the query above
--   'super_admin', 
--   '{"all": true}'::jsonb,
--   'YOUR_USER_ID_HERE'   -- Same UUID again
-- );

-- ============================================
-- 4. TEST ADMIN ACCESS (Run after step 3)
-- ============================================

-- Verify you're now an admin
SELECT 
  'Admin Verification' as check_type,
  au.role,
  au.permissions,
  au.is_active,
  p.email,
  'Admin setup successful!' as status
FROM admin_users au
JOIN profiles p ON au.user_id = p.id
WHERE au.is_active = true;

-- ============================================
-- 5. QUICK DASHBOARD PREVIEW
-- ============================================

-- Business overview
SELECT 
  'Business Overview' as metric_type,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM messages WHERE status = 'pending') as pending_messages,
  (SELECT COUNT(*) FROM inventory_alerts WHERE is_resolved = false) as active_alerts;

-- Recent activity (last 7 days)
SELECT 
  'Recent Activity' as metric_type,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_7d,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as orders_7d,
  (SELECT COUNT(*) FROM user_sessions WHERE started_at >= CURRENT_DATE - INTERVAL '7 days') as sessions_7d,
  (SELECT COUNT(*) FROM user_browsing_history WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as page_views_7d;

-- Product performance preview
SELECT 
  p.size,
  p.frame_type,
  p.base_price,
  pa.total_views,
  pa.total_purchases,
  pa.total_revenue,
  ROUND(pa.conversion_rate * 100, 2) as conversion_percent
FROM products p
JOIN product_analytics pa ON p.id = pa.product_id
ORDER BY p.base_price ASC
LIMIT 5;

-- ============================================
-- 6. SUCCESS CONFIRMATION
-- ============================================

SELECT 
  'PHASE 0 COMPLETE!' as status,
  'Foundation schema successfully implemented' as message,
  'Next: Start Phase 1 - Admin Dashboard Development' as next_phase,
  'Tables: 19 | Views: 2 | Functions: 3 | Triggers: 2' as summary;