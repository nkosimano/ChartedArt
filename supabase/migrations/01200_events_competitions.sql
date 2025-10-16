-- ============================================
-- Migration: 01200_events_competitions.sql
-- Description: Events and competitions (registrations, submissions, judging)
-- Dependencies: 00200_core_tables.sql
-- ============================================
-- Purpose: Flexible event management for competitions, workshops, fundraisers
-- Architecture Principle: Secure file uploads, multi-judge support, blind judging
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS submission_upload_requests CASCADE;
-- DROP TABLE IF EXISTS judge_scores CASCADE;
-- DROP TABLE IF EXISTS competition_judges CASCADE;
-- DROP TABLE IF EXISTS competition_submissions CASCADE;
-- DROP TABLE IF EXISTS event_registrations CASCADE;

-- ============================================
-- 1. EXTEND EXISTING EVENTS TABLE
-- ============================================
-- Add new columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type text CHECK (event_type IN ('competition', 'workshop', 'fundraiser', 'exhibition', 'meetup'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity integer;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_fee decimal(10,2) DEFAULT 0.00;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prize_pool decimal(12,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS rules_and_guidelines text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prizes jsonb; -- [{ "place": 1, "amount": 5000, "description": "..." }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES profiles(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_registration_deadline ON events(registration_deadline);

-- ============================================
-- 2. EVENT REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Registration Details
  registration_status text NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
  registration_type text DEFAULT 'participant' CHECK (registration_type IN ('participant', 'competitor', 'attendee', 'volunteer')),
  
  -- Payment
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'waived')),
  payment_amount decimal(10,2) DEFAULT 0.00,
  stripe_payment_intent_id text,
  
  -- Participant Info
  team_name text,
  team_members jsonb, -- [{ "name": "...", "email": "..." }]
  
  -- Additional Fields
  custom_fields jsonb, -- Flexible form responses
  notes text,
  
  -- Timestamps
  registered_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  
  -- Constraints
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(registration_status);
CREATE INDEX idx_event_registrations_payment ON event_registrations(payment_status);

-- ============================================
-- 3. COMPETITION SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competition_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES event_registrations(id) ON DELETE SET NULL,
  
  -- Submission Details
  title text NOT NULL,
  description text,
  
  -- File Details (Secure Upload Process)
  submission_url text NOT NULL, -- Final S3 URL after verification
  submission_thumbnail text, -- Auto-generated 400x400 thumbnail
  file_type text, -- image/jpeg, image/png, etc.
  file_size integer, -- Bytes
  
  -- Metadata
  submission_metadata jsonb, -- Dimensions, EXIF, etc.
  
  -- Judging
  submission_status text NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'under_review', 'approved', 'rejected', 'disqualified')),
  
  -- Scoring
  total_score decimal(10,4) DEFAULT 0.0000,
  average_score decimal(10,4) DEFAULT 0.0000,
  judges_count integer DEFAULT 0,
  rank integer, -- Final rank after judging
  
  -- Awards
  award_place integer, -- 1st, 2nd, 3rd, etc.
  prize_amount decimal(10,2),
  certificate_url text,
  
  -- Visibility
  is_public boolean DEFAULT true,
  public_votes integer DEFAULT 0, -- Optional: public voting
  
  -- Timestamps
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_submissions_event ON competition_submissions(event_id);
CREATE INDEX idx_submissions_user ON competition_submissions(user_id);
CREATE INDEX idx_submissions_status ON competition_submissions(submission_status);
CREATE INDEX idx_submissions_rank ON competition_submissions(event_id, rank);
CREATE INDEX idx_submissions_score ON competition_submissions(total_score DESC);

-- ============================================
-- 4. JUDGE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competition_judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Judge Details
  judge_role text DEFAULT 'judge' CHECK (judge_role IN ('judge', 'lead_judge', 'guest_judge')),
  expertise_area text,
  
  -- Status
  invitation_status text DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  is_active boolean DEFAULT true,
  
  -- Timestamps
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  
  -- Constraints
  UNIQUE(event_id, judge_id)
);

CREATE INDEX idx_judges_event ON competition_judges(event_id);
CREATE INDEX idx_judges_user ON competition_judges(judge_id);
CREATE INDEX idx_judges_active ON competition_judges(is_active) WHERE is_active = true;

-- ============================================
-- 5. JUDGE SCORES TABLE (Multi-Judge Support)
-- ============================================
CREATE TABLE IF NOT EXISTS judge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES competition_submissions(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Scoring Criteria (Flexible)
  criteria_scores jsonb NOT NULL, -- { "creativity": 9.5, "technique": 8.0, "originality": 10.0 }
  total_score decimal(10,4) NOT NULL,
  
  -- Feedback
  comments text,
  private_notes text, -- Only visible to admin/lead judge
  
  -- Status
  scoring_status text DEFAULT 'draft' CHECK (scoring_status IN ('draft', 'submitted', 'final')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(submission_id, judge_id)
);

CREATE INDEX idx_judge_scores_submission ON judge_scores(submission_id);
CREATE INDEX idx_judge_scores_judge ON judge_scores(judge_id);
CREATE INDEX idx_judge_scores_status ON judge_scores(scoring_status);

-- ============================================
-- 6. FILE UPLOAD REQUESTS TABLE (Security)
-- ============================================
CREATE TABLE IF NOT EXISTS submission_upload_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  event_id uuid NOT NULL REFERENCES events(id),
  
  -- Request Details
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  
  -- Security
  upload_token text UNIQUE NOT NULL,
  presigned_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  
  -- Status
  upload_status text DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'verified', 'failed', 'expired')),
  
  -- Verification (Lambda trigger)
  verified_at timestamptz,
  verification_result jsonb, -- { "mime_type": "...", "dimensions": {...} }
  
  -- S3 Details
  s3_key text,
  s3_bucket text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_upload_requests_user ON submission_upload_requests(user_id);
CREATE INDEX idx_upload_requests_token ON submission_upload_requests(upload_token);
CREATE INDEX idx_upload_requests_status ON submission_upload_requests(upload_status);
CREATE INDEX idx_upload_requests_expires ON submission_upload_requests(expires_at);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Calculate average score for a submission
CREATE OR REPLACE FUNCTION calculate_submission_average_score(p_submission_id uuid)
RETURNS void AS $$
DECLARE
  v_avg_score decimal(10,4);
  v_total_score decimal(10,4);
  v_judges_count integer;
BEGIN
  SELECT 
    AVG(total_score), 
    SUM(total_score),
    COUNT(*)
  INTO v_avg_score, v_total_score, v_judges_count
  FROM judge_scores
  WHERE submission_id = p_submission_id AND scoring_status = 'submitted';
  
  UPDATE competition_submissions
  SET 
    average_score = COALESCE(v_avg_score, 0),
    total_score = COALESCE(v_total_score, 0),
    judges_count = COALESCE(v_judges_count, 0),
    updated_at = now()
  WHERE id = p_submission_id;
END;
$$ LANGUAGE plpgsql;

-- Assign ranks to submissions after judging
CREATE OR REPLACE FUNCTION assign_submission_ranks(p_event_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_submission RECORD;
  v_rank integer := 1;
BEGIN
  -- Assign ranks based on average score (descending)
  FOR v_submission IN
    SELECT id 
    FROM competition_submissions
    WHERE event_id = p_event_id AND submission_status = 'approved'
    ORDER BY average_score DESC, total_score DESC
  LOOP
    UPDATE competition_submissions
    SET rank = v_rank
    WHERE id = v_submission.id;
    
    v_rank := v_rank + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ranks assigned successfully',
    'total_submissions', v_rank - 1
  );
END;
$$ LANGUAGE plpgsql;

-- Finalize competition winners
CREATE OR REPLACE FUNCTION finalize_competition_winners(
  p_event_id uuid,
  p_prize_distribution jsonb -- [{ "place": 1, "prize": 5000 }, ...]
)
RETURNS jsonb AS $$
DECLARE
  v_prize RECORD;
  v_submission_id uuid;
BEGIN
  -- First, assign ranks
  PERFORM assign_submission_ranks(p_event_id);
  
  -- Then assign prizes
  FOR v_prize IN SELECT * FROM jsonb_to_recordset(p_prize_distribution) AS x(place integer, prize decimal)
  LOOP
    SELECT id INTO v_submission_id
    FROM competition_submissions
    WHERE event_id = p_event_id AND rank = v_prize.place;
    
    IF FOUND THEN
      UPDATE competition_submissions
      SET 
        award_place = v_prize.place,
        prize_amount = v_prize.prize,
        updated_at = now()
      WHERE id = v_submission_id;
    END IF;
  END LOOP;
  
  -- Update event status to completed
  UPDATE events
  SET status = 'completed', updated_at = now()
  WHERE id = p_event_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Winners finalized successfully'
  );
END;
$$ LANGUAGE plpgsql;

-- Get event registration count
CREATE OR REPLACE FUNCTION get_event_registrations_count(p_event_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM event_registrations WHERE event_id = p_event_id AND registration_status = 'confirmed');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Update submission average when judge score is submitted
CREATE OR REPLACE FUNCTION trigger_update_submission_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scoring_status = 'submitted' THEN
    PERFORM calculate_submission_average_score(NEW.submission_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_judge_score_submitted
AFTER INSERT OR UPDATE ON judge_scores
FOR EACH ROW
EXECUTE FUNCTION trigger_update_submission_score();

-- Update timestamps
CREATE TRIGGER trigger_submissions_updated_at
BEFORE UPDATE ON competition_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_judge_scores_updated_at
BEFORE UPDATE ON judge_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_upload_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved public events
CREATE POLICY "Anyone can view public events"
ON events FOR SELECT
USING (is_approved = true AND status IN ('published', 'ongoing', 'completed'));

-- Users can view their own registrations
CREATE POLICY "Users can view their registrations"
ON event_registrations FOR SELECT
USING (user_id = auth.uid());

-- Users can create registrations
CREATE POLICY "Users can register for events"
ON event_registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Anyone can view public submissions
CREATE POLICY "Anyone can view public submissions"
ON competition_submissions FOR SELECT
USING (is_public = true AND submission_status = 'approved');

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
ON competition_submissions FOR SELECT
USING (user_id = auth.uid());

-- Users can create submissions
CREATE POLICY "Users can create submissions"
ON competition_submissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Judges can view judge scores
CREATE POLICY "Judges can view scores"
ON judge_scores FOR SELECT
USING (
  judge_id = auth.uid() OR
  EXISTS (SELECT 1 FROM competition_judges WHERE judge_id = auth.uid() AND judge_role = 'lead_judge')
);

-- Judges can create/update their own scores
CREATE POLICY "Judges can manage their scores"
ON judge_scores FOR ALL
USING (judge_id = auth.uid());

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE competition_submissions IS 'Secure submission system with file verification';
COMMENT ON TABLE judge_scores IS 'Multi-judge scoring with automatic average calculation';
COMMENT ON FUNCTION finalize_competition_winners IS 'Admin function: Assigns ranks and distributes prizes';
COMMENT ON COLUMN competition_submissions.submission_url IS 'Final URL after Lambda verification';

