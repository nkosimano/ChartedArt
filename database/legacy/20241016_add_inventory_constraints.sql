-- Migration: Add inventory management constraints and validations
-- Created: 2025-10-16
-- Description: Adds database-level protections for inventory and order management

-- =====================================================
-- 1. Add constraint to prevent negative stock
-- =====================================================
ALTER TABLE products 
ADD CONSTRAINT stock_quantity_non_negative 
CHECK (stock_quantity >= 0);

-- Add index on stock_quantity for better query performance
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity 
ON products(stock_quantity);

-- =====================================================
-- 2. Add valid order status constraint
-- =====================================================
ALTER TABLE orders
ADD CONSTRAINT valid_order_status
CHECK (status IN (
  'pending', 
  'confirmed', 
  'processing', 
  'shipped', 
  'delivered', 
  'cancelled', 
  'refunded',
  'archived'
));

-- =====================================================
-- 3. Create order status history table for audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add index for quick order history lookup
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
ON order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at 
ON order_status_history(created_at DESC);

-- =====================================================
-- 4. Create trigger to log status changes
-- =====================================================
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.updated_by, -- Assuming you add this column
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_order_status_change();

-- =====================================================
-- 5. Add payment_status column to orders if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN payment_status text DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'canceled'));
  END IF;
END $$;

-- =====================================================
-- 6. Create function to atomically reserve stock
-- =====================================================
CREATE OR REPLACE FUNCTION reserve_product_stock(
  product_id uuid,
  quantity integer
) RETURNS json AS $$
DECLARE
  current_stock integer;
  result json;
BEGIN
  -- Lock the row for update
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = product_id
  FOR UPDATE;
  
  -- Check if sufficient stock
  IF current_stock IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;
  
  IF current_stock < quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', current_stock,
      'requested', quantity
    );
  END IF;
  
  -- Deduct stock
  UPDATE products
  SET stock_quantity = stock_quantity - quantity
  WHERE id = product_id;
  
  RETURN json_build_object(
    'success', true,
    'previous_stock', current_stock,
    'new_stock', current_stock - quantity
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reserve_product_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_product_stock(uuid, integer) TO service_role;

-- =====================================================
-- 7. Create function to restore stock
-- =====================================================
CREATE OR REPLACE FUNCTION restore_product_stock(
  product_id uuid,
  quantity integer
) RETURNS json AS $$
BEGIN
  -- Restore stock
  UPDATE products
  SET stock_quantity = stock_quantity + quantity
  WHERE id = product_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'restored', quantity
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION restore_product_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_product_stock(uuid, integer) TO service_role;

-- =====================================================
-- 8. Add updated_by column to orders for audit trail
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN updated_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- =====================================================
-- 9. Create idempotency keys table
-- =====================================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  response jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours')
);

-- Add index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at 
ON idempotency_keys(expires_at);

-- Create cleanup function for expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Add admin_notes column to orders if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN admin_notes text;
  END IF;
END $$;

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT SELECT, INSERT ON order_status_history TO authenticated;
GRANT SELECT, INSERT, DELETE ON idempotency_keys TO authenticated;
GRANT ALL ON order_status_history TO service_role;
GRANT ALL ON idempotency_keys TO service_role;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON CONSTRAINT stock_quantity_non_negative ON products IS 
  'Prevents negative stock quantities to avoid overselling';

COMMENT ON CONSTRAINT valid_order_status ON orders IS 
  'Ensures only valid order statuses can be set';

COMMENT ON TABLE order_status_history IS 
  'Audit trail for all order status changes';

COMMENT ON FUNCTION reserve_product_stock IS 
  'Atomically reserves stock for an order with row-level locking';

COMMENT ON FUNCTION restore_product_stock IS 
  'Restores stock when orders are cancelled or refunded';

COMMENT ON TABLE idempotency_keys IS 
  'Stores idempotency keys to prevent duplicate order submissions';
