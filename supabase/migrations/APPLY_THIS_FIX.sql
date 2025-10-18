-- ============================================
-- FIX: Add Custom Print Support to Cart Items
-- ============================================
-- Run this in Supabase SQL Editor to fix the 400 Bad Request error
-- when adding custom prints to cart
-- 
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
-- Paste this script and click "Run"
-- ============================================

BEGIN;

-- Step 1: Add new columns for custom prints
ALTER TABLE cart_items 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS size VARCHAR(100),
  ADD COLUMN IF NOT EXISTS frame VARCHAR(100),
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Step 2: Add check constraint for price
ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_price_check;
  
ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_price_check CHECK (price IS NULL OR price >= 0);

-- Step 3: Make product_id nullable to support custom prints
ALTER TABLE cart_items 
  ALTER COLUMN product_id DROP NOT NULL;

-- Step 4: Drop the old unique constraint (one product per user)
ALTER TABLE cart_items 
  DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Step 5: Add constraint to ensure either product_id OR custom fields are set
ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_or_custom_check;
  
ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_product_or_custom_check
  CHECK (
    -- Regular product: product_id is set, custom fields are null
    (product_id IS NOT NULL AND image_url IS NULL AND name IS NULL AND size IS NULL AND frame IS NULL AND price IS NULL)
    OR
    -- Custom print: product_id is null, all custom fields are set
    (product_id IS NULL AND image_url IS NOT NULL AND name IS NOT NULL AND size IS NOT NULL AND frame IS NOT NULL AND price IS NOT NULL)
  );

-- Step 6: Update comments for documentation
COMMENT ON COLUMN cart_items.image_url IS 'Image URL for custom prints (NULL for regular products)';
COMMENT ON COLUMN cart_items.name IS 'Product name for custom prints (NULL for regular products)';
COMMENT ON COLUMN cart_items.size IS 'Print size for custom prints (NULL for regular products)';
COMMENT ON COLUMN cart_items.frame IS 'Frame type for custom prints (NULL for regular products)';
COMMENT ON COLUMN cart_items.price IS 'Price for custom prints (NULL for regular products, calculated from product table)';
COMMENT ON COLUMN cart_items.product_id IS 'Product ID for regular products (NULL for custom prints)';
COMMENT ON TABLE cart_items IS 'Shopping cart items - supports both regular products and custom prints';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the fix was applied correctly

-- 1. Check cart_items table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items'
ORDER BY ordinal_position;

-- 2. Check constraints
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'cart_items';

-- 3. Test insert (custom print) - SHOULD WORK
-- INSERT INTO cart_items (user_id, image_url, name, size, frame, price, quantity)
-- VALUES (auth.uid(), 'https://example.com/test.jpg', 'Test Print', '8x10', 'black', 29.99, 1);

-- 4. Test insert (regular product) - SHOULD WORK  
-- INSERT INTO cart_items (user_id, product_id, quantity)
-- VALUES (auth.uid(), 'some-product-uuid', 1);
