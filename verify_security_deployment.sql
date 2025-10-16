-- ============================================
-- VERIFICATION SCRIPT FOR SECURITY FEATURES
-- ============================================
-- This script verifies that all security features were deployed successfully

-- Check security tables exist
SELECT 
  'Security Tables' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All 5 security tables exist'
    ELSE '❌ Missing security tables'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'admin_audit_log',
    'login_attempts',
    'admin_sessions',
    'security_alerts',
    'admin_ip_whitelist'
  );

-- List all security tables
SELECT 
  'Security Table Details' AS check_type,
  table_name,
  '✅ Exists' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'admin_audit_log',
    'login_attempts',
    'admin_sessions',
    'security_alerts',
    'admin_ip_whitelist'
  )
ORDER BY table_name;

-- Check security functions exist
SELECT 
  'Security Functions' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All 5 security functions exist'
    ELSE '❌ Missing security functions'
  END AS status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'log_admin_action',
    'check_brute_force',
    'create_security_alert',
    'is_ip_whitelisted',
    'cleanup_old_audit_logs'
  );

-- List all security functions
SELECT 
  'Security Function Details' AS check_type,
  routine_name,
  '✅ Exists' AS status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'log_admin_action',
    'check_brute_force',
    'create_security_alert',
    'is_ip_whitelisted',
    'cleanup_old_audit_logs'
  )
ORDER BY routine_name;

-- Check customer analytics functions exist (from previous deployment)
SELECT 
  'Customer Analytics Functions' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ All 4 customer analytics functions exist'
    ELSE '❌ Missing customer analytics functions'
  END AS status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_customer_order_stats',
    'calculate_customer_rfm',
    'get_avg_customer_lifetime_value',
    'get_customer_retention_rate'
  );

-- Check RLS policies on security tables
SELECT 
  'RLS Policies' AS check_type,
  tablename,
  COUNT(*) AS policy_count,
  '✅ RLS enabled with policies' AS status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'admin_audit_log',
    'login_attempts',
    'admin_sessions',
    'security_alerts',
    'admin_ip_whitelist'
  )
GROUP BY tablename
ORDER BY tablename;

-- Check security triggers
SELECT 
  'Security Triggers' AS check_type,
  trigger_name,
  event_object_table,
  '✅ Exists' AS status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name IN (
    'new_admin_user_alert',
    'admin_role_change_alert',
    'admin_mfa_disabled_alert'
  )
ORDER BY trigger_name;

-- Final summary
SELECT 
  '=== DEPLOYMENT SUMMARY ===' AS summary,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('admin_audit_log', 'login_attempts', 'admin_sessions', 'security_alerts', 'admin_ip_whitelist')) AS security_tables,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('log_admin_action', 'check_brute_force', 'create_security_alert', 'is_ip_whitelisted', 'cleanup_old_audit_logs')) AS security_functions,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('get_customer_order_stats', 'calculate_customer_rfm', 'get_avg_customer_lifetime_value', 'get_customer_retention_rate')) AS customer_analytics_functions,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name IN ('new_admin_user_alert', 'admin_role_change_alert', 'admin_mfa_disabled_alert')) AS security_triggers,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('admin_audit_log', 'login_attempts', 'admin_sessions', 'security_alerts', 'admin_ip_whitelist')) = 5
     AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('log_admin_action', 'check_brute_force', 'create_security_alert', 'is_ip_whitelisted', 'cleanup_old_audit_logs')) = 5
     AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('get_customer_order_stats', 'calculate_customer_rfm', 'get_avg_customer_lifetime_value', 'get_customer_retention_rate')) = 4
     AND (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name IN ('new_admin_user_alert', 'admin_role_change_alert', 'admin_mfa_disabled_alert')) = 3
    THEN '✅ ALL SECURITY FEATURES DEPLOYED SUCCESSFULLY!'
    ELSE '❌ Some features are missing'
  END AS deployment_status;

