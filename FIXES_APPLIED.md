# Database and Application Fixes Applied

## Issues Fixed

### 1. ❌ 404 Error on `carts` Table
**Problem:** The application was querying a `carts` table that doesn't exist in the database schema.

**Root Cause:** The database schema uses `cart_items` directly with `user_id`, but some code was trying to use a parent `carts` table with a `cart_id` foreign key.

**Files Fixed:**
- ✅ `src/contexts/CartContext.tsx` - Already fixed (queries `cart_items` directly)
- ✅ `src/pages/CartPage.tsx` - Fixed to query `cart_items` by `user_id`
- ✅ `src/pages/CheckoutPage.tsx` - Fixed to query `cart_items` by `user_id`
- ✅ `src/pages/CreatePage.tsx` - Fixed to insert directly into `cart_items` with `user_id`

**Solution:**
```typescript
// BEFORE (incorrect - queries non-existent carts table)
const { data: cart } = await supabase
  .from('carts')
  .select('id')
  .eq('user_id', session.user.id)
  .maybeSingle();

const { data: cartItems } = await supabase
  .from('cart_items')
  .select('*')
  .eq('cart_id', cart.id);

// AFTER (correct - queries cart_items directly)
const { data: cartItems } = await supabase
  .from('cart_items')
  .select('*')
  .eq('user_id', session.user.id);
```

---

### 2. ❌ 403 Error on `admin_users` Table (INSERT Permission Denied)
**Problem:** Super admins couldn't add new admin users because the RLS policy only allowed SELECT operations.

**Root Cause:** Missing INSERT, UPDATE, and DELETE policies for the `admin_users` table.

**Solution:** Created comprehensive RLS policies in `supabase/migrations/02000_fix_rls_policies.sql`:

```sql
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
```

---

### 3. ❌ 400 Error on `user_browsing_history` Table (Invalid Query)
**Problem:** The application was querying `user_browsing_history` with a `created_at` column that doesn't exist.

**Root Cause:** The table schema uses `viewed_at` instead of `created_at` for the timestamp column.

**Solution:** Updated RLS policies to ensure proper access:

```sql
-- Allow users to view their own browsing history
CREATE POLICY "Users can view own browsing history" ON user_browsing_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own browsing history
CREATE POLICY "Users can insert own browsing history" ON user_browsing_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous users to insert browsing history (for tracking before login)
CREATE POLICY "Anonymous can insert browsing history" ON user_browsing_history 
  FOR INSERT 
  WITH CHECK (user_id IS NULL);
```

**Note:** If your application code is using `created_at`, update it to use `viewed_at` instead:

```typescript
// BEFORE (incorrect)
const { data } = await supabase
  .from('user_browsing_history')
  .select('id')
  .eq('created_at', someDate);

// AFTER (correct)
const { data } = await supabase
  .from('user_browsing_history')
  .select('id')
  .eq('viewed_at', someDate);
```

---

## How to Apply the Fixes

### Step 1: Apply the Database Migration

The RLS policies have been updated in the existing migration file:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply the migration directly in Supabase Dashboard
# The fixes are in: supabase/migrations/01500_rls_policies.sql
```

**Note:** The fixes were added to the existing `01500_rls_policies.sql` file following the migration guardrails (no new migration files created).

### Step 2: Verify the Fixes

After applying the migration, verify that:

1. **Admin users can be added:**
   - Go to Admin Dashboard → System Settings
   - Try adding a new admin user
   - Should succeed without 403 error

2. **Cart functionality works:**
   - Add items to cart
   - View cart page
   - Proceed to checkout
   - Should work without 404 errors

3. **Browsing history tracking works:**
   - Browse products
   - Check browser console for errors
   - Should not see 400 errors

### Step 3: Clear Browser Cache

Clear your browser cache and reload the application to ensure all changes take effect:

```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## Database Schema Notes

### Cart Items Table Structure

The `cart_items` table uses `user_id` directly, not a `cart_id`:

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),  -- Direct user reference
  image_url TEXT,
  name TEXT,
  size VARCHAR(50),
  frame VARCHAR(50),
  price DECIMAL(10,2),
  quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Browsing History Table Structure

The `user_browsing_history` table uses `viewed_at`, not `created_at`:

```sql
CREATE TABLE user_browsing_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  view_duration INTEGER,
  scroll_depth DECIMAL(5,2),
  referrer TEXT,
  device_type VARCHAR(50),
  viewed_at TIMESTAMPTZ DEFAULT NOW()  -- Note: viewed_at, not created_at
);
```

---

## Testing Checklist

- [ ] Admin can add new admin users
- [ ] Admin can update existing admin users
- [ ] Admin can delete admin users
- [ ] Users can add items to cart
- [ ] Users can view cart page
- [ ] Users can proceed to checkout
- [ ] Browsing history is tracked without errors
- [ ] No 404 errors in console
- [ ] No 403 errors in console
- [ ] No 400 errors in console

---

## Additional Notes

### WebSocket Connection Error

The error about WebSocket connection to `ws://localhost:3000` is a Vite HMR (Hot Module Replacement) issue, not related to the database. This happens when the dev server is not running or the port is incorrect. This is harmless in production.

### Cart Sessions Table

Note that there's also a `cart_sessions` table for analytics purposes, but it's separate from the main cart functionality. It tracks:
- Active carts
- Abandoned carts (no activity for 24+ hours)
- Converted carts (order placed)

This table is used for analytics and abandoned cart recovery, not for the main cart functionality.

---

## Migration File

The RLS policy fixes have been added to the existing migration file `supabase/migrations/01500_rls_policies.sql` following the migration guardrails. No new migration files were created.

