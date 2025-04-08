/*
  # Add Product Quantity Management

  1. Changes
    - Add quantity field to products table
    - Add check constraint to ensure quantity is non-negative
    - Add function to update product quantity
    - Add policy for admins to update quantities

  2. Security
    - Only admins can update quantities
    - Validate quantity is non-negative
*/

-- Add quantity column to products table
ALTER TABLE products
ADD COLUMN quantity integer NOT NULL DEFAULT 0;

-- Add check constraint for non-negative quantity
ALTER TABLE products
ADD CONSTRAINT products_quantity_check CHECK (quantity >= 0);

-- Create function to update product quantity
CREATE OR REPLACE FUNCTION update_product_quantity(
  product_id uuid,
  new_quantity integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_exists boolean;
  is_admin boolean;
BEGIN
  -- Check if the user is an admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  ) INTO is_admin;

  IF NOT is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only administrators can update product quantities'
    );
  END IF;

  -- Check if product exists
  SELECT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id
  ) INTO product_exists;

  IF NOT product_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;

  -- Validate new quantity
  IF new_quantity < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quantity cannot be negative'
    );
  END IF;

  -- Update the quantity
  UPDATE products
  SET 
    quantity = new_quantity,
    updated_at = now()
  WHERE id = product_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Product quantity updated successfully'
  );
END;
$$;