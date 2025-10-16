-- ============================================
-- ChartedArt Database Migration Validator (SQL)
-- ============================================
-- Run this script in Supabase SQL Editor to validate migrations
-- This will output a comprehensive report of the database state

-- ============================================
-- 1. CHECK EXTENSIONS
-- ============================================
SELECT 
  '🔌 EXTENSIONS' as check_type,
  extname as name,
  '✅' as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_trgm', 'pgcrypto')
ORDER BY extname;

-- ============================================
-- 2. CHECK CORE TABLES
-- ============================================
SELECT 
  '📊 CORE TABLES' as check_type,
  table_name as name,
  CASE 
    WHEN table_name IN ('profiles', 'products', 'orders', 'order_items', 'cart_items', 'testimonials', 'events', 'blog_posts')
    THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'products', 'orders', 'order_items', 'cart_items', 'testimonials', 'events', 'blog_posts')
ORDER BY table_name;

-- ============================================
-- 3. CHECK ADMIN TABLES
-- ============================================
SELECT 
  '👤 ADMIN TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'messages', 'system_config', 'idempotency_keys', 'inventory_alerts')
ORDER BY table_name;

-- ============================================
-- 4. CHECK ANALYTICS TABLES
-- ============================================
SELECT 
  '📈 ANALYTICS TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('product_analytics', 'sales_metrics', 'user_browsing_history', 'user_sessions', 'customer_segments', 'cart_sessions', 'order_status_history')
ORDER BY table_name;

-- ============================================
-- 5. CHECK NOTIFICATION TABLES
-- ============================================
SELECT 
  '🔔 NOTIFICATION TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'user_notification_preferences', 'push_subscriptions', 'notification_templates', 'email_queue', 'notification_delivery_log', 'push_notification_log')
ORDER BY table_name;

-- ============================================
-- 6. CHECK ARTIST PORTAL TABLES
-- ============================================
SELECT 
  '🎨 ARTIST PORTAL TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('artist_portfolios', 'commission_requests', 'commission_messages', 'artist_monthly_earnings')
ORDER BY table_name;

-- ============================================
-- 7. CHECK SOCIAL FEATURE TABLES
-- ============================================
SELECT 
  '👥 SOCIAL FEATURE TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_follows', 'product_comments', 'comment_likes', 'product_likes', 'user_collections', 'collection_products', 'artist_exhibitions', 'artist_awards', 'user_activities')
ORDER BY table_name;

-- ============================================
-- 8. CHECK MOVEMENTS TABLES
-- ============================================
SELECT 
  '🌍 MOVEMENTS TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('movements', 'movement_metrics', 'movement_participants', 'movement_donations', 'movement_products', 'movement_events', 'movement_updates')
ORDER BY table_name;

-- ============================================
-- 9. CHECK PUZZLE PIECES TABLES
-- ============================================
SELECT 
  '🧩 PUZZLE PIECES TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('puzzle_pieces', 'puzzle_piece_collections', 'puzzle_piece_transfers', 'piece_reservations')
ORDER BY table_name;

-- ============================================
-- 10. CHECK EVENTS & COMPETITIONS TABLES
-- ============================================
SELECT 
  '🏆 EVENTS & COMPETITIONS TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('event_registrations', 'competition_submissions', 'competition_judges', 'judge_scores', 'submission_upload_requests')
ORDER BY table_name;

-- ============================================
-- 11. CHECK BLOG TABLES
-- ============================================
SELECT 
  '📝 BLOG TABLES' as check_type,
  table_name as name,
  '✅' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('blog_categories', 'blog_tags', 'blog_post_tags', 'blog_comments')
ORDER BY table_name;

-- ============================================
-- 12. CHECK ROW-LEVEL SECURITY
-- ============================================
SELECT 
  '🔒 RLS STATUS' as check_type,
  tablename as name,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 13. CHECK STORAGE BUCKETS
-- ============================================
SELECT 
  '📦 STORAGE BUCKETS' as check_type,
  name,
  CASE 
    WHEN public THEN '🌐 Public'
    ELSE '🔒 Private'
  END as status
FROM storage.buckets
ORDER BY name;

-- ============================================
-- 14. CHECK DATABASE FUNCTIONS
-- ============================================
SELECT 
  '⚙️  DATABASE FUNCTIONS' as check_type,
  routine_name as name,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 15. CHECK TRIGGERS
-- ============================================
SELECT 
  '⚡ TRIGGERS' as check_type,
  trigger_name as name,
  event_object_table as table_name,
  '✅' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 16. TABLE COUNT SUMMARY
-- ============================================
SELECT 
  '📊 SUMMARY' as check_type,
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'

UNION ALL

SELECT 
  '📊 SUMMARY' as check_type,
  'Tables with RLS' as metric,
  COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
  '📊 SUMMARY' as check_type,
  'Total Functions' as metric,
  COUNT(*)::text as value
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
  '📊 SUMMARY' as check_type,
  'Total Triggers' as metric,
  COUNT(DISTINCT trigger_name)::text as value
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT 
  '📊 SUMMARY' as check_type,
  'Storage Buckets' as metric,
  COUNT(*)::text as value
FROM storage.buckets;

-- ============================================
-- 17. MISSING TABLES CHECK
-- ============================================
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'products', 'orders', 'order_items', 'cart_items', 'testimonials', 'events', 'blog_posts',
    'admin_users', 'messages', 'system_config', 'idempotency_keys', 'inventory_alerts',
    'product_analytics', 'sales_metrics', 'user_browsing_history', 'user_sessions', 'customer_segments',
    'cart_sessions', 'order_status_history', 'wishlists', 'wishlist_items', 'product_reviews',
    'notifications', 'user_notification_preferences', 'push_subscriptions', 'notification_templates',
    'email_queue', 'notification_delivery_log', 'push_notification_log',
    'artist_portfolios', 'commission_requests', 'commission_messages', 'artist_monthly_earnings',
    'user_follows', 'product_comments', 'comment_likes', 'product_likes', 'user_collections',
    'collection_products', 'artist_exhibitions', 'artist_awards', 'user_activities',
    'movements', 'movement_metrics', 'movement_participants', 'movement_donations',
    'movement_products', 'movement_events', 'movement_updates',
    'puzzle_pieces', 'puzzle_piece_collections', 'puzzle_piece_transfers', 'piece_reservations',
    'event_registrations', 'competition_submissions', 'competition_judges', 'judge_scores',
    'submission_upload_requests', 'blog_categories', 'blog_tags', 'blog_post_tags', 'blog_comments'
  ]) AS table_name
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
)
SELECT 
  '⚠️  MISSING TABLES' as check_type,
  e.table_name as name,
  '❌ Not Found' as status
FROM expected_tables e
LEFT JOIN existing_tables ex ON e.table_name = ex.table_name
WHERE ex.table_name IS NULL
ORDER BY e.table_name;

-- ============================================
-- FINAL MESSAGE
-- ============================================
SELECT 
  '✅ VALIDATION COMPLETE' as message,
  'Review the output above for any missing tables or disabled RLS policies' as note;

