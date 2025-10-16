-- ============================================
-- PUZZLE PIECES SYSTEM MIGRATION
-- ============================================
-- Purpose: Limited-edition, numbered art pieces tied to Movements
-- Architecture Principle: Scarcity & Engagement, Atomic Operations
-- Key Feature: Race condition prevention via PostgreSQL locks
-- ============================================

-- ============================================
-- 1. PUZZLE PIECES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS puzzle_pieces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Movement Association
  movement_id uuid NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  
  -- Piece Details
  piece_number integer NOT NULL, -- 1, 2, 3, etc.
  total_pieces integer NOT NULL, -- Total in the series
  title text NOT NULL,
  description text,
  
  -- Art Details
  artwork_url text NOT NULL,
  artwork_thumbnail text,
  artist_id uuid REFERENCES profiles(id),
  artist_name text,
  artist_bio text,
  
  -- Pricing
  price decimal(10,2) NOT NULL CHECK (price > 0),
  currency text NOT NULL DEFAULT 'ZAR',
  
  -- Collectibility Metadata
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  edition_type text NOT NULL DEFAULT 'limited' CHECK (edition_type IN ('limited', 'special', 'commemorative')),
  
  -- Status Management (Atomic State Machine)
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'withdrawn')),
  
  -- Reservation Details (Atomic Lock)
  reserved_by uuid REFERENCES profiles(id),
  reservation_expires_at timestamptz,
  reservation_token text UNIQUE, -- Secure token for checkout
  
  -- Ownership
  owned_by uuid REFERENCES profiles(id),
  purchased_at timestamptz,
  
  -- Payment Integration
  stripe_payment_intent_id text,
  order_id uuid REFERENCES orders(id),
  
  -- Metadata
  tags text[] DEFAULT '{}'::text[],
  unlock_condition jsonb, -- { "type": "donation_milestone", "value": 1000 }
  is_unlocked boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(movement_id, piece_number), -- Each piece number is unique per movement
  CHECK (piece_number > 0 AND piece_number <= total_pieces)
);

-- Indexes for performance
CREATE INDEX idx_puzzle_pieces_movement ON puzzle_pieces(movement_id);
CREATE INDEX idx_puzzle_pieces_status ON puzzle_pieces(status);
CREATE INDEX idx_puzzle_pieces_artist ON puzzle_pieces(artist_id);
CREATE INDEX idx_puzzle_pieces_owned_by ON puzzle_pieces(owned_by);
CREATE INDEX idx_puzzle_pieces_reservation_expires ON puzzle_pieces(reservation_expires_at) 
  WHERE status = 'reserved' AND reservation_expires_at IS NOT NULL;
CREATE INDEX idx_puzzle_pieces_number ON puzzle_pieces(movement_id, piece_number);
CREATE INDEX idx_puzzle_pieces_rarity ON puzzle_pieces(rarity);

-- ============================================
-- 2. PUZZLE PIECE COLLECTIONS (User's Collection)
-- ============================================
CREATE TABLE IF NOT EXISTS puzzle_piece_collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  puzzle_piece_id uuid NOT NULL REFERENCES puzzle_pieces(id) ON DELETE CASCADE,
  
  -- Acquisition Details
  acquired_at timestamptz DEFAULT now(),
  acquisition_price decimal(10,2),
  
  -- Display Settings
  is_public boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  -- Metadata
  personal_note text,
  
  -- Constraints
  UNIQUE(user_id, puzzle_piece_id)
);

CREATE INDEX idx_collections_user ON puzzle_piece_collections(user_id);
CREATE INDEX idx_collections_piece ON puzzle_piece_collections(puzzle_piece_id);
CREATE INDEX idx_collections_public ON puzzle_piece_collections(is_public) WHERE is_public = true;

-- ============================================
-- 3. PUZZLE PIECE TRANSFER HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS puzzle_piece_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_piece_id uuid NOT NULL REFERENCES puzzle_pieces(id) ON DELETE CASCADE,
  
  -- Transfer Details
  from_user_id uuid REFERENCES profiles(id),
  to_user_id uuid NOT NULL REFERENCES profiles(id),
  transfer_type text NOT NULL CHECK (transfer_type IN ('purchase', 'gift', 'trade', 'admin')),
  
  -- Transaction
  transfer_price decimal(10,2),
  stripe_transaction_id text,
  
  -- Metadata
  notes text,
  transferred_at timestamptz DEFAULT now()
);

CREATE INDEX idx_transfers_piece ON puzzle_piece_transfers(puzzle_piece_id);
CREATE INDEX idx_transfers_from_user ON puzzle_piece_transfers(from_user_id);
CREATE INDEX idx_transfers_to_user ON puzzle_piece_transfers(to_user_id);
CREATE INDEX idx_transfers_date ON puzzle_piece_transfers(transferred_at);

-- ============================================
-- 4. ATOMIC RESERVATION FUNCTION
-- ============================================
-- This function prevents race conditions using SELECT FOR UPDATE
CREATE OR REPLACE FUNCTION reserve_puzzle_piece(
  p_piece_id uuid,
  p_user_id uuid,
  p_reservation_minutes integer DEFAULT 15
)
RETURNS jsonb AS $$
DECLARE
  v_piece RECORD;
  v_token text;
  v_expires_at timestamptz;
  v_existing_reservation uuid;
BEGIN
  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_reservation_minutes || ' minutes')::interval;
  
  -- Lock the row for update (prevents concurrent reservations)
  SELECT id, status, reserved_by, movement_id, piece_number, price
  INTO v_piece
  FROM puzzle_pieces
  WHERE id = p_piece_id
  FOR UPDATE;
  
  -- Check if piece exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIECE_NOT_FOUND',
      'message', 'Puzzle piece not found'
    );
  END IF;
  
  -- Check if piece is available
  IF v_piece.status != 'available' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIECE_NOT_AVAILABLE',
      'message', 'This piece is no longer available',
      'status', v_piece.status
    );
  END IF;
  
  -- Check if user already has an active reservation
  SELECT id INTO v_existing_reservation
  FROM puzzle_pieces
  WHERE reserved_by = p_user_id
    AND status = 'reserved'
    AND reservation_expires_at > now()
    AND id != p_piece_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EXISTING_RESERVATION',
      'message', 'You already have an active reservation. Complete or cancel it first.',
      'existing_reservation_id', v_existing_reservation
    );
  END IF;
  
  -- Atomically update the piece status
  UPDATE puzzle_pieces
  SET 
    status = 'reserved',
    reserved_by = p_user_id,
    reservation_expires_at = v_expires_at,
    reservation_token = v_token,
    updated_at = now()
  WHERE id = p_piece_id;
  
  -- Return success with reservation details
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'piece_id', v_piece.id,
      'movement_id', v_piece.movement_id,
      'piece_number', v_piece.piece_number,
      'price', v_piece.price,
      'token', v_token,
      'expires_at', v_expires_at,
      'expires_in_seconds', EXTRACT(EPOCH FROM (v_expires_at - now()))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CANCEL RESERVATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION cancel_puzzle_piece_reservation(
  p_piece_id uuid,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_piece RECORD;
BEGIN
  -- Lock the row
  SELECT id, status, reserved_by
  INTO v_piece
  FROM puzzle_pieces
  WHERE id = p_piece_id
  FOR UPDATE;
  
  -- Check if piece exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIECE_NOT_FOUND'
    );
  END IF;
  
  -- Check if piece is reserved by this user
  IF v_piece.status != 'reserved' OR v_piece.reserved_by != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_RESERVATION',
      'message', 'No active reservation found for this user'
    );
  END IF;
  
  -- Release the reservation
  UPDATE puzzle_pieces
  SET 
    status = 'available',
    reserved_by = NULL,
    reservation_expires_at = NULL,
    reservation_token = NULL,
    updated_at = now()
  WHERE id = p_piece_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reservation cancelled successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. COMPLETE PURCHASE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION complete_puzzle_piece_purchase(
  p_piece_id uuid,
  p_user_id uuid,
  p_reservation_token text,
  p_stripe_payment_intent_id text,
  p_order_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_piece RECORD;
BEGIN
  -- Lock the row
  SELECT id, status, reserved_by, reservation_token, price, movement_id
  INTO v_piece
  FROM puzzle_pieces
  WHERE id = p_piece_id
  FOR UPDATE;
  
  -- Validate piece exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PIECE_NOT_FOUND');
  END IF;
  
  -- Validate reservation
  IF v_piece.status != 'reserved' OR v_piece.reserved_by != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_RESERVATION');
  END IF;
  
  -- Validate token
  IF v_piece.reservation_token != p_reservation_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
  END IF;
  
  -- Mark as sold
  UPDATE puzzle_pieces
  SET 
    status = 'sold',
    owned_by = p_user_id,
    purchased_at = now(),
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    order_id = p_order_id,
    reserved_by = NULL,
    reservation_expires_at = NULL,
    reservation_token = NULL,
    updated_at = now()
  WHERE id = p_piece_id;
  
  -- Add to user's collection
  INSERT INTO puzzle_piece_collections (user_id, puzzle_piece_id, acquired_at, acquisition_price)
  VALUES (p_user_id, p_piece_id, now(), v_piece.price)
  ON CONFLICT (user_id, puzzle_piece_id) DO NOTHING;
  
  -- Record transfer history
  INSERT INTO puzzle_piece_transfers (puzzle_piece_id, from_user_id, to_user_id, transfer_type, transfer_price, stripe_transaction_id)
  VALUES (p_piece_id, NULL, p_user_id, 'purchase', v_piece.price, p_stripe_payment_intent_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Purchase completed successfully',
    'piece_id', v_piece.id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CLEANUP EXPIRED RESERVATIONS FUNCTION
-- ============================================
-- This will be called by a background job every 5 minutes
CREATE OR REPLACE FUNCTION cleanup_expired_puzzle_reservations()
RETURNS jsonb AS $$
DECLARE
  v_released_count integer;
BEGIN
  WITH released AS (
    UPDATE puzzle_pieces
    SET 
      status = 'available',
      reserved_by = NULL,
      reservation_expires_at = NULL,
      reservation_token = NULL,
      updated_at = now()
    WHERE status = 'reserved'
      AND reservation_expires_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM released;
  
  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Get collection completion percentage
CREATE OR REPLACE FUNCTION get_collection_completion(p_user_id uuid, p_movement_id uuid)
RETURNS decimal AS $$
DECLARE
  v_total integer;
  v_owned integer;
BEGIN
  SELECT COUNT(*) INTO v_total FROM puzzle_pieces WHERE movement_id = p_movement_id;
  SELECT COUNT(*) INTO v_owned 
  FROM puzzle_piece_collections ppc
  JOIN puzzle_pieces pp ON pp.id = ppc.puzzle_piece_id
  WHERE ppc.user_id = p_user_id AND pp.movement_id = p_movement_id;
  
  IF v_total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (v_owned::decimal / v_total::decimal) * 100;
END;
$$ LANGUAGE plpgsql;

-- Get available pieces count
CREATE OR REPLACE FUNCTION get_available_pieces_count(p_movement_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM puzzle_pieces WHERE movement_id = p_movement_id AND status = 'available');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE puzzle_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_piece_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_piece_transfers ENABLE ROW LEVEL SECURITY;

-- Anyone can view available or sold pieces
CREATE POLICY "Anyone can view puzzle pieces"
ON puzzle_pieces FOR SELECT
USING (status IN ('available', 'sold') OR reserved_by = auth.uid());

-- Users can view their own reserved pieces
CREATE POLICY "Users can view their reservations"
ON puzzle_pieces FOR SELECT
USING (reserved_by = auth.uid());

-- Users can view public collections
CREATE POLICY "Anyone can view public collections"
ON puzzle_piece_collections FOR SELECT
USING (is_public = true);

-- Users can view their own collection
CREATE POLICY "Users can view their own collection"
ON puzzle_piece_collections FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own collection settings
CREATE POLICY "Users can update their collection"
ON puzzle_piece_collections FOR UPDATE
USING (user_id = auth.uid());

-- Anyone can view transfer history
CREATE POLICY "Anyone can view transfers"
ON puzzle_piece_transfers FOR SELECT
USING (true);

-- ============================================
-- 10. TRIGGERS
-- ============================================

CREATE TRIGGER trigger_puzzle_pieces_updated_at
BEFORE UPDATE ON puzzle_pieces
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE puzzle_pieces IS 'Limited-edition numbered art pieces with atomic reservation system';
COMMENT ON FUNCTION reserve_puzzle_piece IS 'CRITICAL: Uses SELECT FOR UPDATE to prevent race conditions';
COMMENT ON FUNCTION cleanup_expired_puzzle_reservations IS 'Background job: Run every 5 minutes via EventBridge';
COMMENT ON COLUMN puzzle_pieces.status IS 'State machine: available -> reserved -> sold (atomic transitions only)';
COMMENT ON COLUMN puzzle_pieces.reservation_token IS 'Secure token required for purchase completion';
