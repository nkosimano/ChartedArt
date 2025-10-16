-- ============================================
-- Make User Admin Script
-- ============================================
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

-- Insert admin user record
INSERT INTO admin_users (user_id, role, is_active)
SELECT 
  id,
  'super_admin',
  true
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();

-- Verify the admin was created
SELECT 
  au.id,
  au.user_id,
  p.email,
  p.full_name,
  au.role,
  au.is_active,
  au.created_at
FROM admin_users au
JOIN profiles p ON p.id = au.user_id
WHERE p.email = 'YOUR_EMAIL_HERE';
