# URGENT FIX: Cart Insert Error

## Problem
Error when adding items to cart:
```
column "session_id" of relation "cart_sessions" does not exist
```

## Root Cause
The `update_cart_session()` trigger function is trying to insert a `session_id` column that doesn't exist in the `cart_sessions` table.

## Solution

### Option 1: Apply via Supabase Dashboard (RECOMMENDED - Fast)

1. Go to: https://supabase.com/dashboard/project/uuqfobbkjhrpylygauwf/sql/new

2. Copy and paste this SQL:

```sql
-- Fix cart_sessions trigger - remove session_id column reference
CREATE OR REPLACE FUNCTION update_cart_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO cart_sessions (user_id, status, last_activity, item_count, total_value)
  SELECT 
    NEW.user_id,
    'active',
    NOW(),
    COUNT(*),
    COALESCE(SUM(COALESCE(p.price, ci.price, 0) * ci.quantity), 0)
  FROM cart_items ci
  LEFT JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = NEW.user_id
  GROUP BY ci.user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity = NOW(),
    item_count = EXCLUDED.item_count,
    total_value = EXCLUDED.total_value,
    status = 'active';
  
  RETURN NEW;
END;
$$;
```

3. Click "Run" button

4. You should see: "Success. No rows returned"

### Option 2: Apply via Supabase CLI

```bash
# Make sure you're in the project root
cd c:\Users\nathi\OneDrive\Documents\Projects\ChartedArt

# Apply the migration
supabase db push --include-all
```

## What Changed

### Before (BROKEN):
```sql
INSERT INTO cart_sessions (user_id, session_id, status, ...)  -- ❌ session_id doesn't exist
SELECT 
  NEW.user_id,
  gen_random_uuid(),  -- ❌ Trying to generate session_id
  ...
```

### After (FIXED):
```sql
INSERT INTO cart_sessions (user_id, status, ...)  -- ✅ No session_id
SELECT 
  NEW.user_id,
  ...
```

### Additional Improvements:
1. Changed `JOIN products` to `LEFT JOIN products` - This allows custom prints (no product_id) to work
2. Added `COALESCE(p.price, ci.price, 0)` - Use product price OR custom print price
3. Wrapped sum in COALESCE - Handle NULL values safely

## Testing After Fix

1. Go to: https://main.d34w69gsv9iyzb.amplifyapp.com/create
2. Upload an image
3. Select size and frame
4. Click "Add to Cart"
5. Should succeed! ✅

## Expected Console Output (After Fix)
```
CreatePage.tsx:82 Preparing file upload...
CreatePage.tsx:96 Backend not deployed yet, using local preview
CreatePage.tsx:101 File ready for upload: uploads/.../image.jpg
CreatePage.tsx:186 Adding to cart with data: {...}
CreatePage.tsx:215 Successfully added to cart: [{...}]  ✅
```

## Files Modified
- `supabase/migrations/01800_triggers.sql` - Fixed trigger definition
- `supabase/migrations/00201_fix_cart_session_trigger.sql` - New migration file
- `fix_cart_trigger.sql` - Quick fix SQL script

## Next Steps After Applying Fix

1. ✅ Apply SQL fix (Option 1 recommended)
2. Test adding to cart
3. Commit and push changes:
   ```bash
   git add .
   git commit -m "Fix cart_sessions trigger - remove session_id reference"
   git push
   ```

## Verification Query

Run this to verify the trigger is fixed:
```sql
-- Check the trigger function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'update_cart_session';
```

Should NOT contain `session_id` in the INSERT statement.

---

**STATUS**: Ready to apply - just run the SQL in Supabase dashboard!
