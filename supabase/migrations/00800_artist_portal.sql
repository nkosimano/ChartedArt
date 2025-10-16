-- ============================================
-- Migration: 00800_artist_portal.sql
-- Description: Artist portal features (portfolios, commissions, earnings)
-- Dependencies: 00200_core_tables.sql
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS artist_monthly_earnings CASCADE;
-- DROP TABLE IF EXISTS commission_messages CASCADE;
-- DROP TABLE IF EXISTS commission_requests CASCADE;
-- DROP TABLE IF NOT EXISTS artist_portfolios CASCADE;

-- ============================================
-- 1. ARTIST PORTFOLIOS TABLE
-- ============================================
-- Artist portfolios for showcasing work beyond sellable products
CREATE TABLE IF NOT EXISTS artist_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Portfolio Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  
  -- Art Details
  category VARCHAR(100), -- 'painting', 'sculpture', 'digital', 'photography', etc.
  medium VARCHAR(100), -- 'oil', 'watercolor', 'acrylic', 'bronze', etc.
  dimensions VARCHAR(100), -- '24x36 inches', '30cm x 45cm', etc.
  year_created INTEGER,
  
  -- Features
  is_featured BOOLEAN DEFAULT false,
  is_available_for_commission BOOLEAN DEFAULT false,
  
  -- Categorization
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. COMMISSION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Request Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Budget
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  
  -- Preferences
  preferred_medium VARCHAR(100),
  preferred_style VARCHAR(100),
  dimensions VARCHAR(100),
  deadline TIMESTAMPTZ,
  reference_images TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'quote_sent', 'accepted', 
    'in_progress', 'completed', 'delivered', 'cancelled', 'rejected'
  )),
  
  -- Artist Response
  artist_notes TEXT,
  quote_amount DECIMAL(10,2),
  quote_details TEXT,
  estimated_completion TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. COMMISSION MESSAGES TABLE
-- ============================================
-- Communication between artist and customer
CREATE TABLE IF NOT EXISTS commission_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES commission_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message Content
  message TEXT NOT NULL,
  attachments TEXT[],
  
  -- Message Type
  is_status_update BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ARTIST MONTHLY EARNINGS TABLE
-- ============================================
-- Track artist earnings by month
CREATE TABLE IF NOT EXISTS artist_monthly_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Revenue Metrics
  gross_revenue DECIMAL(10,2) DEFAULT 0.00,
  commission_earnings DECIMAL(10,2) DEFAULT 0.00,
  
  -- Order Metrics
  total_orders INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0.00,
  
  -- Best Seller
  best_selling_product_id UUID REFERENCES products(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per artist per month
  UNIQUE(artist_id, year, month)
);

-- ============================================
-- INDEXES
-- ============================================
-- Artist Portfolios
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_artist_id ON artist_portfolios(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_category ON artist_portfolios(category);
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_featured ON artist_portfolios(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_artist_portfolios_sort_order ON artist_portfolios(sort_order);

-- Commission Requests
CREATE INDEX IF NOT EXISTS idx_commission_requests_artist_id ON commission_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_commission_requests_customer_id ON commission_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_commission_requests_status ON commission_requests(status);
CREATE INDEX IF NOT EXISTS idx_commission_requests_created_at ON commission_requests(created_at DESC);

-- Commission Messages
CREATE INDEX IF NOT EXISTS idx_commission_messages_commission_id ON commission_messages(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_messages_sender_id ON commission_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_commission_messages_created_at ON commission_messages(created_at DESC);

-- Artist Monthly Earnings
CREATE INDEX IF NOT EXISTS idx_artist_monthly_earnings_artist_id ON artist_monthly_earnings(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_monthly_earnings_year_month ON artist_monthly_earnings(year, month);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE artist_portfolios IS 'Artist portfolio items for showcasing work';
COMMENT ON TABLE commission_requests IS 'Custom commission requests from customers';
COMMENT ON TABLE commission_messages IS 'Communication between artist and customer for commissions';
COMMENT ON TABLE artist_monthly_earnings IS 'Monthly earnings tracking for artists';

COMMENT ON COLUMN commission_requests.status IS 'Commission workflow: pending → reviewing → quote_sent → accepted → in_progress → completed → delivered';
COMMENT ON COLUMN artist_portfolios.is_available_for_commission IS 'Whether this portfolio item style is available for commission';
COMMENT ON COLUMN artist_monthly_earnings.commission_earnings IS 'Artist earnings after platform commission';

