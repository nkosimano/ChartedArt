# How to Apply Database and Code Fixes

## Summary of Changes Made

### ✅ Code Changes (Already Applied)
1. **Fixed CartContext.tsx** - Already querying `cart_items` directly (no changes needed)
2. **Fixed CartPage.tsx** - Removed query to non-existent `carts` table
3. **Fixed CheckoutPage.tsx** - Removed query to non-existent `carts` table
4. **Fixed CreatePage.tsx** - Simplified to insert directly into `cart_items`
5. **Fixed useRecommendations.ts** - Changed `created_at` to `viewed_at` for browsing history

### ✅ Database Changes (Need to Apply)
Updated `supabase/migrations/01500_rls_policies.sql` with:
1. **Admin Users Policies** - Added INSERT, UPDATE, DELETE policies for super admins
2. **User Browsing History Policies** - Added INSERT policies for authenticated and anonymous users
3. **Cart Items Policy** - Already exists (no changes needed)

---

## How to Apply the Database Changes

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the following SQL commands:**

```sql
-- ============================================
-- FIX ADMIN_USERS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;

-- Allow super admins to INSERT new admin users
CREATE POLICY "Super admins can insert admin users" ON admin_users 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- Allow super admins to UPDATE admin users
CREATE POLICY "Super admins can update admin users" ON admin_users 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- Allow super admins to DELETE admin users
CREATE POLICY "Super admins can delete admin users" ON admin_users 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- ============================================
-- FIX USER_BROWSING_HISTORY RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own browsing history" ON user_browsing_history;
DROP POLICY IF EXISTS "Anonymous can insert browsing history" ON user_browsing_history;

-- Allow authenticated users to insert their own browsing history
CREATE POLICY "Users can insert own browsing history" ON user_browsing_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert browsing history (for tracking before login)
CREATE POLICY "Anonymous can insert browsing history" ON user_browsing_history 
  FOR INSERT 
  WITH CHECK (user_id IS NULL);

-- ============================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON admin_users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT ON user_browsing_history TO authenticated;
GRANT ALL ON cart_items TO authenticated;
```

4. **Click "Run" to execute the SQL**

5. **Verify the changes:**

```sql
-- Verify admin_users policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'admin_users'
ORDER BY policyname;

-- Verify user_browsing_history policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'user_browsing_history'
ORDER BY policyname;

-- Verify cart_items policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'cart_items'
ORDER BY policyname;
```

---

### Option 2: Using Supabase CLI (If Installed)

If you have the Supabase CLI installed:

```bash
# Navigate to project directory
cd c:\Users\dhliso\Development\ChartedArt

# Push database changes
supabase db push

# Or reset the database (WARNING: This will delete all data)
# supabase db reset
```

---

## Testing the Fixes

After applying the database changes:

### 1. Test Admin User Management
1. Log in as a super admin
2. Go to Admin Dashboard → System Settings
3. Try adding a new admin user
4. **Expected:** Should succeed without 403 error

### 2. Test Cart Functionality
1. Add items to cart
2. View cart page
3. Proceed to checkout
4. **Expected:** Should work without 404 errors on `carts` table

### 3. Test Browsing History
1. Browse products
2. Check browser console (F12)
3. **Expected:** No 400 errors on `user_browsing_history` with `created_at`

### 4. Clear Browser Cache
After testing, clear your browser cache:
- **Windows/Linux:** `Ctrl+Shift+R`
- **Mac:** `Cmd+Shift+R`

---

## Troubleshooting

### Issue: Still getting 403 errors on admin_users

**Solution:** Make sure you're logged in as a super admin. Check your admin status:

```sql
SELECT au.*, p.email
FROM admin_users au
JOIN profiles p ON au.user_id = p.id
WHERE p.email = 'your-email@example.com';
```

If you're not a super admin, update your role:

```sql
UPDATE admin_users
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM profiles WHERE email = 'your-email@example.com');
```

### Issue: Still getting 404 errors on carts table

**Solution:** The code changes have been applied. Make sure to:
1. Restart your development server
2. Clear browser cache
3. Hard refresh the page

### Issue: Still getting 400 errors on user_browsing_history

**Solution:** The code has been updated to use `viewed_at` instead of `created_at`. Make sure to:
1. Restart your development server
2. Clear browser cache

---

## Files Modified

### Code Files (Already Updated)
- ✅ `src/pages/CartPage.tsx`
- ✅ `src/pages/CheckoutPage.tsx`
- ✅ `src/pages/CreatePage.tsx`
- ✅ `src/hooks/useRecommendations.ts`

### Database Migration Files (Updated)
- ✅ `supabase/migrations/01500_rls_policies.sql`

### Documentation Files (Created)
- ✅ `FIXES_APPLIED.md`
- ✅ `APPLY_FIXES_INSTRUCTIONS.md`

---

## Next Steps

1. ✅ Apply the database changes using Option 1 or Option 2 above
2. ✅ Restart your development server
3. ✅ Clear browser cache
4. ✅ Test all functionality
5. ✅ Verify no errors in browser console

---

## Support

If you encounter any issues after applying these fixes, please check:
1. Browser console for specific error messages
2. Supabase logs in the dashboard
3. Network tab to see which API calls are failing

All fixes follow the migration guardrails - no new migration files were created, only existing files were updated.

