-- Quick Fix: Apply this in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/uuqfobbkjhrpylygauwf/sql/new

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
