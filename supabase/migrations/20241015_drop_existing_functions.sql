-- Drop existing functions with all possible signatures
-- This script handles the case where functions exist with different return types

-- Drop get_customer_order_stats with various possible signatures
DROP FUNCTION IF EXISTS get_customer_order_stats(uuid);
DROP FUNCTION IF EXISTS get_customer_order_stats(customer_id uuid);

-- Drop other functions that might exist
DROP FUNCTION IF EXISTS get_business_overview();
DROP FUNCTION IF EXISTS calculate_customer_rfm();
DROP FUNCTION IF EXISTS get_avg_customer_lifetime_value();
DROP FUNCTION IF EXISTS get_customer_retention_rate();

-- Also drop any functions that might have been created with different parameter names
DROP FUNCTION IF EXISTS public.get_customer_order_stats(uuid);
DROP FUNCTION IF EXISTS public.get_customer_order_stats(customer_id uuid);
DROP FUNCTION IF EXISTS public.get_business_overview();
DROP FUNCTION IF EXISTS public.calculate_customer_rfm();
DROP FUNCTION IF EXISTS public.get_avg_customer_lifetime_value();
DROP FUNCTION IF EXISTS public.get_customer_retention_rate();