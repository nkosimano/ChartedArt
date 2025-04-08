/*
  # Add Archived Status to Orders Table

  1. Changes
    - Add 'archived' status to orders table status check constraint
    - Ensures data consistency for order archiving feature
    - Maintains existing status values while adding new option

  2. Security
    - Maintains existing RLS policies
    - No changes to access control

  3. Notes
    - Safe to run on existing data
    - No data migration needed
    - Backwards compatible with existing status values
*/

DO $$ 
BEGIN
  -- First check if the constraint exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_status_check'
    AND table_name = 'orders'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;

  -- Add the new constraint with 'archived' status
  ALTER TABLE orders
  ADD CONSTRAINT orders_status_check 
  CHECK (
    status IN (
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'archived'
    )
  );
END $$;