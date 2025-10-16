-- Migration: Fix products table schema and add missing columns
-- Created: 2025-10-16
-- Description: Adds missing columns to products table to match the application expectations

-- =====================================================
-- 1. Update products table schema to match app expectations
-- =====================================================

-- First, let's see if we need to drop and recreate or just alter
-- The existing products table has: id, size, frame_type, base_price
-- We need: id, name, description, price, stock_quantity, status, image_url, category, artist_id

-- Drop existing products table constraints and recreate
-- Note: This assumes you're in development. In production, you'd migrate data first.

-- Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS artist_id uuid REFERENCES profiles(id);

-- Rename base_price to price for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE products RENAME COLUMN base_price TO price;
  END IF;
END $$;

-- Update existing products if any exist (migrate old data format)
UPDATE products 
SET 
  name = CASE 
    WHEN name IS NULL THEN 'Artwork ' || size || ' - ' || frame_type 
    ELSE name 
  END,
  description = CASE 
    WHEN description IS NULL THEN 'Beautiful artwork printed on quality material in ' || size || ' size with ' || frame_type || ' framing.'
    ELSE description
  END,
  stock_quantity = CASE WHEN stock_quantity IS NULL THEN 10 ELSE stock_quantity END,
  category = CASE WHEN category IS NULL THEN 'Digital Art' ELSE category END
WHERE name IS NULL OR description IS NULL OR stock_quantity IS NULL OR category IS NULL;

-- Make required columns NOT NULL after updating
ALTER TABLE products 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN stock_quantity SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- =====================================================
-- 2. Add indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- =====================================================
-- 3. Update RLS policies for new structure
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read products" ON products;

-- Recreate policies for new structure
CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  TO public
  USING (true);

-- Artists can manage their own products
CREATE POLICY "Artists can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (auth.uid() = artist_id)
  WITH CHECK (auth.uid() = artist_id);

-- Admins can manage all products
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

-- =====================================================
-- 4. Add artist flag to profiles if it doesn't exist
-- =====================================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_artist boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_rate decimal(5,2) DEFAULT 10.00;

-- =====================================================
-- 5. Comments for documentation
-- =====================================================
COMMENT ON COLUMN products.name IS 'Product display name';
COMMENT ON COLUMN products.description IS 'Product description';
COMMENT ON COLUMN products.price IS 'Product price in local currency';
COMMENT ON COLUMN products.stock_quantity IS 'Current stock level';
COMMENT ON COLUMN products.status IS 'Product status: active, inactive, or draft';
COMMENT ON COLUMN products.category IS 'Product category for filtering';
COMMENT ON COLUMN products.artist_id IS 'Reference to the artist who created this product';