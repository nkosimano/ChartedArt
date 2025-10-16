-- ============================================
-- Migration: 01000_movements_system.sql
-- Description: Social impact campaigns (movements, metrics, donations, participants)
-- Dependencies: 00200_core_tables.sql
-- ============================================
-- Purpose: Social impact tracking, community engagement, and fundraising
-- Architecture Principle: Optional Integration, Loose Coupling
-- Feature Flag: ENABLE_MOVEMENTS
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS movement_updates CASCADE;
-- DROP TABLE IF EXISTS movement_events CASCADE;
-- DROP TABLE IF EXISTS movement_products CASCADE;
-- DROP TABLE IF EXISTS movement_donations CASCADE;
-- DROP TABLE IF EXISTS movement_participants CASCADE;
-- DROP TABLE IF EXISTS movement_metrics CASCADE;
-- DROP TABLE IF EXISTS movements CASCADE;

-- ============================================
-- 1. MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  tagline text,
  
  -- Visual Assets
  cover_image text,
  logo_image text,
  hero_video text,
  
  -- Goals & Targets
  goal_amount decimal(12,2) NOT NULL DEFAULT 0.00,
  goal_participants integer NOT NULL DEFAULT 0,
  goal_description text,
  
  -- Status Management
  status text NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  
  -- Timeline
  start_date timestamptz,
  end_date timestamptz,
  
  -- Creator & Beneficiary
  created_by uuid REFERENCES profiles(id),
  beneficiary_organization text,
  beneficiary_contact jsonb, -- { "name": "...", "email": "...", "phone": "..." }
  
  -- Metadata
  tags text[] DEFAULT '{}'::text[],
  featured boolean DEFAULT false,
  featured_order integer,
  
  -- Soft Delete (Privacy Aware)
  archived_at timestamptz,
  archived_by uuid REFERENCES profiles(id),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_movements_slug ON movements(slug);
CREATE INDEX idx_movements_status ON movements(status) WHERE status = 'active';
CREATE INDEX idx_movements_visibility ON movements(visibility) WHERE visibility = 'public';
CREATE INDEX idx_movements_featured ON movements(featured, featured_order) WHERE featured = true;
CREATE INDEX idx_movements_dates ON movements(start_date, end_date);
CREATE INDEX idx_movements_archived ON movements(archived_at) WHERE archived_at IS NULL;
CREATE INDEX idx_movements_tags ON movements USING gin(tags);

-- ============================================
-- 2. MOVEMENT METRICS TABLE (Tier 1: Real-Time)
-- ============================================
CREATE TABLE IF NOT EXISTS movement_metrics (
  movement_id uuid PRIMARY KEY REFERENCES movements(id) ON DELETE CASCADE,
  
  -- Financial Metrics (Instant via Triggers)
  total_raised decimal(12,2) NOT NULL DEFAULT 0.00,
  total_donations integer NOT NULL DEFAULT 0,
  average_donation decimal(10,2) DEFAULT 0.00,
  largest_donation decimal(10,2) DEFAULT 0.00,
  
  -- Participation Metrics (Instant via Triggers)
  participant_count integer NOT NULL DEFAULT 0,
  active_participants integer NOT NULL DEFAULT 0, -- Donated or engaged in last 30 days
  
  -- Product Metrics
  linked_products_count integer DEFAULT 0,
  products_sold integer DEFAULT 0,
  product_revenue decimal(12,2) DEFAULT 0.00,
  
  -- Event Metrics
  linked_events_count integer DEFAULT 0,
  event_registrations integer DEFAULT 0,
  
  -- Engagement Metrics (Tier 2: Background Job)
  engagement_score decimal(10,2) DEFAULT 0.00, -- Calculated by background job
  social_shares integer DEFAULT 0,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  
  -- Timestamps
  last_donation_at timestamptz,
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for analytics
CREATE INDEX idx_movement_metrics_total_raised ON movement_metrics(total_raised DESC);
CREATE INDEX idx_movement_metrics_participant_count ON movement_metrics(participant_count DESC);
CREATE INDEX idx_movement_metrics_engagement_score ON movement_metrics(engagement_score DESC);

-- ============================================
-- 3. MOVEMENT PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movement_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Participation Details
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'advocate', 'organizer', 'admin')),
  joined_at timestamptz DEFAULT now(),
  
  -- Engagement Tracking
  total_donated decimal(12,2) DEFAULT 0.00,
  donation_count integer DEFAULT 0,
  last_donated_at timestamptz,
  
  -- Social Impact
  referral_code text UNIQUE,
  referrals_count integer DEFAULT 0,
  social_shares integer DEFAULT 0,
  
  -- Metadata
  motivation text, -- Why they joined
  public_profile boolean DEFAULT true,
  
  -- Constraints
  UNIQUE(movement_id, user_id)
);

-- Indexes for participant queries
CREATE INDEX idx_movement_participants_movement ON movement_participants(movement_id);
CREATE INDEX idx_movement_participants_user ON movement_participants(user_id);
CREATE INDEX idx_movement_participants_joined ON movement_participants(joined_at);
CREATE INDEX idx_movement_participants_role ON movement_participants(movement_id, role);

-- ============================================
-- 4. MOVEMENT DONATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movement_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  participant_id uuid REFERENCES movement_participants(id) ON DELETE SET NULL,
  
  -- Payment Details
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'ZAR',
  
  -- Stripe Integration (Webhook-Driven)
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  payment_method_type text, -- card, bank_transfer, etc.
  
  -- Status (Only webhook can set to 'completed')
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Donor Information (for anonymous donations)
  donor_name text,
  donor_email text,
  donor_anonymous boolean DEFAULT false,
  
  -- Receipt & Tax
  receipt_url text,
  tax_deductible boolean DEFAULT false,
  
  -- Metadata
  message text, -- Optional message from donor
  in_memory_of text, -- Dedication
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  refunded_at timestamptz
);

-- Indexes for donation queries
CREATE INDEX idx_movement_donations_movement ON movement_donations(movement_id);
CREATE INDEX idx_movement_donations_user ON movement_donations(user_id);
CREATE INDEX idx_movement_donations_status ON movement_donations(status);
CREATE INDEX idx_movement_donations_stripe_intent ON movement_donations(stripe_payment_intent_id);
CREATE INDEX idx_movement_donations_completed ON movement_donations(completed_at);

-- ============================================
-- 5. MOVEMENT PRODUCTS (Link to existing products)
-- ============================================
CREATE TABLE IF NOT EXISTS movement_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Donation Configuration
  donation_percentage decimal(5,2) CHECK (donation_percentage >= 0 AND donation_percentage <= 100),
  fixed_donation_amount decimal(10,2),
  
  -- Metadata
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(movement_id, product_id)
);

CREATE INDEX idx_movement_products_movement ON movement_products(movement_id);
CREATE INDEX idx_movement_products_product ON movement_products(product_id);

-- ============================================
-- 6. MOVEMENT EVENTS (Link to events)
-- ============================================
CREATE TABLE IF NOT EXISTS movement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Fundraising Goal for this event
  event_goal_amount decimal(12,2),
  
  -- Metadata
  is_primary_event boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(movement_id, event_id)
);

CREATE INDEX idx_movement_events_movement ON movement_events(movement_id);
CREATE INDEX idx_movement_events_event ON movement_events(event_id);

-- ============================================
-- 7. MOVEMENT UPDATES (Blog/News for movements)
-- ============================================
CREATE TABLE IF NOT EXISTS movement_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id uuid NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  
  -- Content
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  
  -- Media
  featured_image text,
  media_gallery text[], -- Array of image/video URLs
  
  -- Publishing
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  author_id uuid REFERENCES profiles(id),
  
  -- Engagement
  views_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_movement_updates_movement ON movement_updates(movement_id);
CREATE INDEX idx_movement_updates_status ON movement_updates(status, published_at);

-- ============================================
-- DATABASE TRIGGERS (Tier 1: Instant Updates)
-- ============================================

-- Trigger Function: Update movement metrics on new donation
CREATE OR REPLACE FUNCTION update_movement_metrics_on_donation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process completed donations
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO movement_metrics (movement_id, total_raised, total_donations, largest_donation, last_donation_at)
    VALUES (
      NEW.movement_id,
      NEW.amount,
      1,
      NEW.amount,
      NEW.completed_at
    )
    ON CONFLICT (movement_id) DO UPDATE SET
      total_raised = movement_metrics.total_raised + NEW.amount,
      total_donations = movement_metrics.total_donations + 1,
      average_donation = (movement_metrics.total_raised + NEW.amount) / (movement_metrics.total_donations + 1),
      largest_donation = GREATEST(movement_metrics.largest_donation, NEW.amount),
      last_donation_at = NEW.completed_at,
      updated_at = now();
    
    -- Update participant donation stats if participant exists
    IF NEW.participant_id IS NOT NULL THEN
      UPDATE movement_participants
      SET 
        total_donated = total_donated + NEW.amount,
        donation_count = donation_count + 1,
        last_donated_at = NEW.completed_at
      WHERE id = NEW.participant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_movement_metrics
AFTER INSERT OR UPDATE ON movement_donations
FOR EACH ROW
EXECUTE FUNCTION update_movement_metrics_on_donation();

-- Trigger Function: Update participant count on join
CREATE OR REPLACE FUNCTION update_movement_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO movement_metrics (movement_id, participant_count)
    VALUES (NEW.movement_id, 1)
    ON CONFLICT (movement_id) DO UPDATE SET
      participant_count = movement_metrics.participant_count + 1,
      updated_at = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE movement_metrics
    SET 
      participant_count = GREATEST(0, participant_count - 1),
      updated_at = now()
    WHERE movement_id = OLD.movement_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participant_count
AFTER INSERT OR DELETE ON movement_participants
FOR EACH ROW
EXECUTE FUNCTION update_movement_participant_count();

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_movements_updated_at
BEFORE UPDATE ON movements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_movement_metrics_updated_at
BEFORE UPDATE ON movement_metrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_updates ENABLE ROW LEVEL SECURITY;

-- Public read access for active, public movements
CREATE POLICY "Anyone can view public movements"
ON movements FOR SELECT
USING (status = 'active' AND visibility = 'public' AND archived_at IS NULL);

-- Authenticated users can view their own draft movements
CREATE POLICY "Users can view their own movements"
ON movements FOR SELECT
USING (auth.uid() = created_by);

-- Only authenticated users can create movements
CREATE POLICY "Authenticated users can create movements"
ON movements FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Users can update their own movements
CREATE POLICY "Users can update their own movements"
ON movements FOR UPDATE
USING (auth.uid() = created_by);

-- Public read access for movement metrics
CREATE POLICY "Anyone can view movement metrics"
ON movement_metrics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM movements 
  WHERE movements.id = movement_metrics.movement_id 
  AND movements.status = 'active' 
  AND movements.visibility = 'public'
));

-- Public read access for participants (respecting privacy)
CREATE POLICY "Anyone can view public participants"
ON movement_participants FOR SELECT
USING (public_profile = true);

-- Users can view their own participation
CREATE POLICY "Users can view their own participation"
ON movement_participants FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can join movements
CREATE POLICY "Authenticated users can join movements"
ON movement_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Public read access for non-anonymous donations
CREATE POLICY "Anyone can view non-anonymous donations"
ON movement_donations FOR SELECT
USING (donor_anonymous = false);

-- Users can view their own donations
CREATE POLICY "Users can view their own donations"
ON movement_donations FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create donations
CREATE POLICY "Authenticated users can create donations"
ON movement_donations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Public read for published updates
CREATE POLICY "Anyone can view published updates"
ON movement_updates FOR SELECT
USING (status = 'published');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get movement progress percentage
CREATE OR REPLACE FUNCTION get_movement_progress(p_movement_id uuid)
RETURNS decimal AS $$
DECLARE
  v_goal decimal;
  v_raised decimal;
BEGIN
  SELECT goal_amount INTO v_goal FROM movements WHERE id = p_movement_id;
  SELECT total_raised INTO v_raised FROM movement_metrics WHERE movement_id = p_movement_id;
  
  IF v_goal IS NULL OR v_goal = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN LEAST(100, (v_raised / v_goal) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user is movement participant
CREATE OR REPLACE FUNCTION is_movement_participant(p_movement_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM movement_participants 
    WHERE movement_id = p_movement_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE movements IS 'Core movements table for social impact campaigns';
COMMENT ON TABLE movement_metrics IS 'Real-time metrics updated via database triggers';
COMMENT ON TABLE movement_donations IS 'Donation records - status updated only via Stripe webhook';
COMMENT ON COLUMN movements.archived_at IS 'Soft delete timestamp - preserves data integrity';
COMMENT ON COLUMN movement_donations.status IS 'CRITICAL: Only Stripe webhook can set to completed';

