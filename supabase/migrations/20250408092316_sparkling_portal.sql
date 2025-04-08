/*
  # Add Archived Status to Orders

  1. Changes
    - Update orders table status check constraint to include 'archived'
    - Ensures data consistency for archived orders
*/

-- Drop existing check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new check constraint with 'archived' status
ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'archived'));