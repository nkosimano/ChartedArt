-- Verify RLS Policies Applied Successfully

-- Check admin_users policies
SELECT 
  'admin_users policies' as table_name,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'admin_users'
ORDER BY policyname;

-- Check user_browsing_history policies
SELECT 
  'user_browsing_history policies' as table_name,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'user_browsing_history'
ORDER BY policyname;

-- Check cart_items policies
SELECT 
  'cart_items policies' as table_name,
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'cart_items'
ORDER BY policyname;

