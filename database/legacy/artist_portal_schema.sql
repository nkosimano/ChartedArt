-- Artist Tools & Portal Database Schema
-- Run these commands in your Supabase SQL editor

-- Artist portfolios table for showcasing work beyond sellable products
CREATE TABLE IF NOT EXISTS artist_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(100), -- 'painting', 'sculpture', 'digital', 'photography', etc.
  medium VARCHAR(100), -- 'oil', 'watercolor', 'acrylic', 'bronze', etc.
  dimensions VARCHAR(100), -- '24x36 inches', '30cm x 45cm', etc.
  year_created INTEGER,
  is_featured BOOLEAN DEFAULT false,
  is_available_for_commission BOOLEAN DEFAULT false,
  tags TEXT[], -- array of tags for categorization
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission requests table
CREATE TABLE IF NOT EXISTS commission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  preferred_medium VARCHAR(100),
  preferred_style VARCHAR(100),
  dimensions VARCHAR(100),
  deadline TIMESTAMPTZ,
  reference_images TEXT[], -- URLs to reference images
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'quote_sent', 'accepted', 
    'in_progress', 'completed', 'delivered', 'cancelled', 'rejected'
  )),
  artist_notes TEXT,
  quote_amount DECIMAL(10,2),
  quote_details TEXT,
  estimated_completion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commission updates/messages table for communication
CREATE TABLE IF NOT EXISTS commission_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES commission_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[], -- URLs to attached images/files
  is_status_update BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist sales analytics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS artist_sales_analytics AS
SELECT 
  p.id as artist_id,
  p.full_name as artist_name,
  COUNT(DISTINCT pr.id) as total_products,
  COUNT(DISTINCT CASE WHEN pr.status = 'active' THEN pr.id END) as active_products,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(oi.quantity) as total_units_sold,
  SUM(oi.price * oi.quantity) as total_revenue,
  AVG(oi.price) as avg_product_price,
  SUM(oi.price * oi.quantity * (p.commission_rate / 100.0)) as total_earnings,
  COUNT(DISTINCT o.user_id) as unique_customers,
  -- Last 30 days metrics
  COUNT(DISTINCT CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.id END) as orders_last_30_days,
  SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN oi.price * oi.quantity ELSE 0 END) as revenue_last_30_days,
  SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN oi.quantity ELSE 0 END) as units_sold_last_30_days,
  -- Best selling product
  (SELECT pr2.name FROM products pr2 
   JOIN order_items oi2 ON pr2.id = oi2.product_id 
   JOIN orders o2 ON oi2.order_id = o2.id
   WHERE pr2.artist_id = p.id AND o2.status IN ('paid', 'delivered')
   GROUP BY pr2.id, pr2.name
   ORDER BY SUM(oi2.quantity) DESC 
   LIMIT 1) as best_selling_product,
  MAX(o.created_at) as last_sale_date,
  NOW() as last_updated
FROM profiles p
LEFT JOIN products pr ON p.id = pr.artist_id
LEFT JOIN order_items oi ON pr.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'delivered')
WHERE p.is_artist = true
GROUP BY p.id, p.full_name, p.commission_rate;

-- Artist monthly earnings table for detailed tracking
CREATE TABLE IF NOT EXISTS artist_monthly_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  commission_earnings DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  best_selling_product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, year, month)
);

-- Artist payout requests table
CREATE TABLE IF NOT EXISTS artist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'requested' CHECK (status IN (
    'requested', 'processing', 'completed', 'failed', 'cancelled'
  )),
  payout_method VARCHAR(50), -- 'bank_transfer', 'paypal', 'stripe', etc.
  payout_details JSONB, -- encrypted payout method details
  transaction_id VARCHAR(255),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist inventory tracking
CREATE TABLE IF NOT EXISTS artist_inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'stock_added', 'stock_removed', 'sale', 'return', 'adjustment'
  )),
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_artist_id ON artist_portfolios(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_category ON artist_portfolios(category);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_featured ON artist_portfolios(is_featured);

CREATE INDEX IF NOT EXISTS idx_commission_requests_artist_id ON commission_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_commission_requests_customer_id ON commission_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_commission_requests_status ON commission_requests(status);

CREATE INDEX IF NOT EXISTS idx_commission_messages_commission_id ON commission_messages(commission_id);

CREATE INDEX IF NOT EXISTS idx_artist_monthly_earnings_artist_id ON artist_monthly_earnings(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_monthly_earnings_year_month ON artist_monthly_earnings(year, month);

CREATE INDEX IF NOT EXISTS idx_artist_payouts_artist_id ON artist_payouts(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_payouts_status ON artist_payouts(status);

CREATE INDEX IF NOT EXISTS idx_artist_inventory_logs_product_id ON artist_inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_inventory_logs_artist_id ON artist_inventory_logs(artist_id);

-- Row Level Security Policies

-- Artist portfolios - artists can manage their own portfolios
ALTER TABLE artist_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view their own portfolios" ON artist_portfolios
  FOR SELECT USING (artist_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR is_artist = true)
  ));

CREATE POLICY "Artists can insert their own portfolios" ON artist_portfolios
  FOR INSERT WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update their own portfolios" ON artist_portfolios
  FOR UPDATE USING (artist_id = auth.uid());

CREATE POLICY "Artists can delete their own portfolios" ON artist_portfolios
  FOR DELETE USING (artist_id = auth.uid());

-- Commission requests - customers and artists can see their relevant requests
ALTER TABLE commission_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View commission requests" ON commission_requests
  FOR SELECT USING (
    customer_id = auth.uid() OR 
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Customers can create commission requests" ON commission_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Update commission requests" ON commission_requests
  FOR UPDATE USING (
    customer_id = auth.uid() OR 
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Commission messages - participants can view and send messages
ALTER TABLE commission_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View commission messages" ON commission_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM commission_requests cr 
      WHERE cr.id = commission_id 
      AND (cr.customer_id = auth.uid() OR cr.artist_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Send commission messages" ON commission_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM commission_requests cr 
      WHERE cr.id = commission_id 
      AND (cr.customer_id = auth.uid() OR cr.artist_id = auth.uid())
    )
  );

-- Artist monthly earnings - artists can view their own earnings
ALTER TABLE artist_monthly_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view their own earnings" ON artist_monthly_earnings
  FOR SELECT USING (
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Artist payouts - artists can view and request their own payouts
ALTER TABLE artist_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view their own payouts" ON artist_payouts
  FOR SELECT USING (
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Artists can request payouts" ON artist_payouts
  FOR INSERT WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update their own payouts" ON artist_payouts
  FOR UPDATE USING (
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Artist inventory logs - artists and admins can view
ALTER TABLE artist_inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View inventory logs" ON artist_inventory_logs
  FOR SELECT USING (
    artist_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Functions for Artist Portal

-- Function to calculate artist earnings for a specific period
CREATE OR REPLACE FUNCTION calculate_artist_earnings(
  artist_uuid UUID,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  earnings JSONB;
  commission_rate DECIMAL;
BEGIN
  -- Get artist commission rate
  SELECT p.commission_rate INTO commission_rate
  FROM profiles p
  WHERE p.id = artist_uuid AND p.is_artist = true;
  
  -- Default date range if not provided (last 30 days)
  IF start_date IS NULL THEN
    start_date := NOW() - INTERVAL '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := NOW();
  END IF;
  
  WITH earning_metrics AS (
    SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      SUM(oi.quantity) as total_units_sold,
      SUM(oi.price * oi.quantity) as gross_revenue,
      SUM(oi.price * oi.quantity * (commission_rate / 100.0)) as commission_earnings,
      AVG(oi.price * oi.quantity) as avg_order_value,
      COUNT(DISTINCT o.user_id) as unique_customers
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE p.artist_id = artist_uuid
      AND o.status IN ('paid', 'delivered')
      AND o.created_at BETWEEN start_date AND end_date
  )
  SELECT jsonb_build_object(
    'period_start', start_date,
    'period_end', end_date,
    'commission_rate', commission_rate,
    'total_orders', COALESCE(em.total_orders, 0),
    'total_units_sold', COALESCE(em.total_units_sold, 0),
    'gross_revenue', COALESCE(em.gross_revenue, 0),
    'commission_earnings', COALESCE(em.commission_earnings, 0),
    'avg_order_value', COALESCE(em.avg_order_value, 0),
    'unique_customers', COALESCE(em.unique_customers, 0)
  ) INTO earnings
  FROM earning_metrics em;
  
  RETURN earnings;
END;
$$;

-- Function to get artist top selling products
CREATE OR REPLACE FUNCTION get_artist_top_products(
  artist_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  image_url TEXT,
  price DECIMAL,
  total_sales INTEGER,
  total_revenue DECIMAL,
  current_stock INTEGER,
  status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name::VARCHAR,
    p.image_url,
    p.price,
    COALESCE(sales_data.total_sales, 0)::INTEGER,
    COALESCE(sales_data.total_revenue, 0)::DECIMAL,
    p.stock_quantity,
    p.status::VARCHAR
  FROM products p
  LEFT JOIN (
    SELECT 
      oi.product_id,
      SUM(oi.quantity) as total_sales,
      SUM(oi.price * oi.quantity) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status IN ('paid', 'delivered')
    GROUP BY oi.product_id
  ) sales_data ON p.id = sales_data.product_id
  WHERE p.artist_id = artist_uuid
  ORDER BY COALESCE(sales_data.total_revenue, 0) DESC
  LIMIT limit_count;
END;
$$;

-- Function to get commission request metrics for an artist
CREATE OR REPLACE FUNCTION get_artist_commission_metrics(
  artist_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  metrics JSONB;
BEGIN
  WITH commission_stats AS (
    SELECT 
      COUNT(*) as total_requests,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_commissions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_commissions,
      COUNT(CASE WHEN status = 'cancelled' OR status = 'rejected' THEN 1 END) as declined_requests,
      AVG(quote_amount) as avg_commission_value,
      SUM(CASE WHEN status = 'completed' THEN quote_amount ELSE 0 END) as total_commission_earnings
    FROM commission_requests
    WHERE artist_id = artist_uuid
  )
  SELECT jsonb_build_object(
    'total_requests', COALESCE(cs.total_requests, 0),
    'pending_requests', COALESCE(cs.pending_requests, 0),
    'active_commissions', COALESCE(cs.active_commissions, 0),
    'completed_commissions', COALESCE(cs.completed_commissions, 0),
    'declined_requests', COALESCE(cs.declined_requests, 0),
    'avg_commission_value', COALESCE(cs.avg_commission_value, 0),
    'total_commission_earnings', COALESCE(cs.total_commission_earnings, 0)
  ) INTO metrics
  FROM commission_stats cs;
  
  RETURN metrics;
END;
$$;

-- Trigger to update artist sales analytics when orders are updated
CREATE OR REPLACE FUNCTION refresh_artist_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW artist_sales_analytics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic analytics updates
CREATE TRIGGER trigger_refresh_artist_analytics_on_order
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_artist_analytics();

CREATE TRIGGER trigger_refresh_artist_analytics_on_order_items
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_artist_analytics();

-- Function to automatically calculate and update monthly earnings
CREATE OR REPLACE FUNCTION update_artist_monthly_earnings()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER := EXTRACT(year FROM NOW());
  current_month INTEGER := EXTRACT(month FROM NOW());
BEGIN
  -- Insert or update monthly earnings for all artists
  INSERT INTO artist_monthly_earnings (
    artist_id, year, month, gross_revenue, commission_earnings, 
    total_orders, total_units_sold, avg_order_value, best_selling_product_id
  )
  SELECT 
    p.id as artist_id,
    current_year,
    current_month,
    COALESCE(SUM(oi.price * oi.quantity), 0) as gross_revenue,
    COALESCE(SUM(oi.price * oi.quantity * (p.commission_rate / 100.0)), 0) as commission_earnings,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(oi.quantity), 0) as total_units_sold,
    COALESCE(AVG(o.total_amount), 0) as avg_order_value,
    -- Best selling product for the month
    (SELECT pr.id FROM products pr
     JOIN order_items oi2 ON pr.id = oi2.product_id
     JOIN orders o2 ON oi2.order_id = o2.id
     WHERE pr.artist_id = p.id 
       AND EXTRACT(year FROM o2.created_at) = current_year
       AND EXTRACT(month FROM o2.created_at) = current_month
       AND o2.status IN ('paid', 'delivered')
     GROUP BY pr.id
     ORDER BY SUM(oi2.quantity) DESC
     LIMIT 1) as best_selling_product_id
  FROM profiles p
  LEFT JOIN products pr ON p.id = pr.artist_id
  LEFT JOIN order_items oi ON pr.id = oi.product_id
  LEFT JOIN orders o ON oi.order_id = o.id
    AND EXTRACT(year FROM o.created_at) = current_year
    AND EXTRACT(month FROM o.created_at) = current_month
    AND o.status IN ('paid', 'delivered')
  WHERE p.is_artist = true
  GROUP BY p.id, p.commission_rate
  ON CONFLICT (artist_id, year, month) DO UPDATE SET
    gross_revenue = EXCLUDED.gross_revenue,
    commission_earnings = EXCLUDED.commission_earnings,
    total_orders = EXCLUDED.total_orders,
    total_units_sold = EXCLUDED.total_units_sold,
    avg_order_value = EXCLUDED.avg_order_value,
    best_selling_product_id = EXCLUDED.best_selling_product_id,
    updated_at = NOW();
END;
$$;