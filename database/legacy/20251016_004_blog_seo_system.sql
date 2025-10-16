-- ============================================
-- BLOG & SEO SYSTEM MIGRATION
-- ============================================
-- Purpose: SEO-optimized content platform with full-text search
-- Architecture Principle: Permanent categories, dynamic tags, stable URLs
-- Key Feature: PostgreSQL tsvector for performant full-text search
-- ============================================

-- ============================================
-- 1. BLOG CATEGORIES TABLE (Fixed Set)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  
  -- SEO
  meta_title text,
  meta_description text,
  
  -- Display
  icon text, -- Icon name or emoji
  color text, -- Hex color for UI
  display_order integer DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_active ON blog_categories(is_active) WHERE is_active = true;

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, display_order) VALUES
  ('Artist Spotlights', 'artist-spotlights', 'Featuring talented South African artists', 1),
  ('Behind the Scenes', 'behind-the-scenes', 'Our process and stories', 2),
  ('Art Techniques', 'art-techniques', 'Tutorials and guides', 3),
  ('Community Stories', 'community-stories', 'Stories from our community', 4),
  ('Social Impact', 'social-impact', 'Our movements and causes', 5),
  ('News & Updates', 'news-updates', 'Latest from ChartedArt', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. BLOG TAGS TABLE (Dynamic)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  
  -- Usage Stats
  usage_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_tags_usage ON blog_tags(usage_count DESC);

-- ============================================
-- 3. ENHANCED BLOG POSTS TABLE
-- ============================================
-- Extend existing blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES blog_categories(id);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS read_time_minutes integer;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- SEO Fields
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_keywords text[];
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image text; -- Open Graph image

-- Content Structure
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_json jsonb; -- Structured content (blocks)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS table_of_contents jsonb; -- Generated TOC

-- Publishing
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Full-Text Search (tsvector)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON blog_posts(views_count DESC);

-- Full-text search index (GIN)
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING gin(search_vector);

-- ============================================
-- 4. BLOG POST TAGS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- ============================================
-- 5. BLOG POST ASSOCIATIONS
-- ============================================
-- Link blog posts to movements, events, products
CREATE TABLE IF NOT EXISTS blog_post_associations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Polymorphic association
  associated_type text NOT NULL CHECK (associated_type IN ('movement', 'event', 'product', 'artist')),
  associated_id uuid NOT NULL,
  
  -- Metadata
  association_label text, -- E.g., "Featured in", "About", "Related to"
  display_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(post_id, associated_type, associated_id)
);

CREATE INDEX idx_blog_associations_post ON blog_post_associations(post_id);
CREATE INDEX idx_blog_associations_target ON blog_post_associations(associated_type, associated_id);

-- ============================================
-- 6. BLOG COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Comment Details
  content text NOT NULL,
  parent_comment_id uuid REFERENCES blog_comments(id) ON DELETE CASCADE, -- For threaded comments
  
  -- Moderation
  is_approved boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  moderation_notes text,
  
  -- Engagement
  likes_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent ON blog_comments(parent_comment_id);
CREATE INDEX idx_blog_comments_approved ON blog_comments(is_approved) WHERE is_approved = true;

-- ============================================
-- 7. BLOG LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_blog_likes_post ON blog_likes(post_id);
CREATE INDEX idx_blog_likes_user ON blog_likes(user_id);

-- ============================================
-- 8. BLOG READING HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS blog_reading_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Session
  session_id text,
  
  -- Reading Metrics
  time_spent_seconds integer DEFAULT 0,
  scroll_percentage decimal(5,2) DEFAULT 0.00,
  completed_reading boolean DEFAULT false,
  
  -- Timestamps
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reading_history_post ON blog_reading_history(post_id);
CREATE INDEX idx_reading_history_user ON blog_reading_history(user_id);
CREATE INDEX idx_reading_history_session ON blog_reading_history(session_id);

-- ============================================
-- 9. FULL-TEXT SEARCH FUNCTIONS
-- ============================================

-- Update search vector on blog post changes
CREATE OR REPLACE FUNCTION update_blog_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.meta_keywords, ' '), '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_post_search_vector
BEFORE INSERT OR UPDATE OF title, excerpt, content, meta_keywords ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_blog_post_search_vector();

-- Search blog posts with ranking
CREATE OR REPLACE FUNCTION search_blog_posts(
  p_query text,
  p_category_slug text DEFAULT NULL,
  p_tag_slugs text[] DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  post_id uuid,
  title text,
  slug text,
  excerpt text,
  featured_image text,
  category_name text,
  published_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.featured_image,
    bc.name as category_name,
    bp.published_at,
    ts_rank(bp.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM blog_posts bp
  LEFT JOIN blog_categories bc ON bp.category_id = bc.id
  LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
  LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
  WHERE bp.status = 'published'
    AND bp.search_vector @@ websearch_to_tsquery('english', p_query)
    AND (p_category_slug IS NULL OR bc.slug = p_category_slug)
    AND (p_tag_slugs IS NULL OR bt.slug = ANY(p_tag_slugs))
  GROUP BY bp.id, bc.name
  ORDER BY rank DESC, bp.published_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Autocomplete suggestions
CREATE OR REPLACE FUNCTION blog_search_suggestions(
  p_query text,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  suggestion_type text,
  suggestion_text text,
  slug text
) AS $$
BEGIN
  -- Return post titles
  RETURN QUERY
  SELECT 
    'post'::text as suggestion_type,
    bp.title as suggestion_text,
    bp.slug
  FROM blog_posts bp
  WHERE bp.status = 'published'
    AND bp.title ILIKE '%' || p_query || '%'
  ORDER BY bp.views_count DESC
  LIMIT p_limit;
  
  -- Return tags
  RETURN QUERY
  SELECT 
    'tag'::text as suggestion_type,
    bt.name as suggestion_text,
    bt.slug
  FROM blog_tags bt
  WHERE bt.name ILIKE '%' || p_query || '%'
  ORDER BY bt.usage_count DESC
  LIMIT p_limit;
  
  -- Return categories
  RETURN QUERY
  SELECT 
    'category'::text as suggestion_type,
    bc.name as suggestion_text,
    bc.slug
  FROM blog_categories bc
  WHERE bc.is_active = true
    AND bc.name ILIKE '%' || p_query || '%'
  ORDER BY bc.display_order
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views(p_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET views_count = views_count + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate read time
CREATE OR REPLACE FUNCTION calculate_read_time(p_content text)
RETURNS integer AS $$
DECLARE
  v_word_count integer;
  v_words_per_minute integer := 200;
BEGIN
  v_word_count := array_length(regexp_split_to_array(p_content, '\s+'), 1);
  RETURN GREATEST(1, ROUND(v_word_count::decimal / v_words_per_minute));
END;
$$ LANGUAGE plpgsql;

-- Update read time on content change
CREATE OR REPLACE FUNCTION update_blog_post_read_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.read_time_minutes := calculate_read_time(NEW.content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_read_time
BEFORE UPDATE OF content ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_blog_post_read_time();

-- Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tag_usage
AFTER INSERT OR DELETE ON blog_post_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

-- Update likes count
CREATE OR REPLACE FUNCTION update_blog_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_likes_count
AFTER INSERT OR DELETE ON blog_likes
FOR EACH ROW
EXECUTE FUNCTION update_blog_likes_count();

-- Update comments count
CREATE OR REPLACE FUNCTION update_blog_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_approved = true THEN
    UPDATE blog_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_approved = false AND NEW.is_approved = true THEN
    UPDATE blog_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_approved = true AND NEW.is_approved = false THEN
    UPDATE blog_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_approved = true THEN
    UPDATE blog_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blog_comments_count
AFTER INSERT OR UPDATE OR DELETE ON blog_comments
FOR EACH ROW
EXECUTE FUNCTION update_blog_comments_count();

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_reading_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view active categories
CREATE POLICY "Anyone can view categories"
ON blog_categories FOR SELECT
USING (is_active = true);

-- Anyone can view tags
CREATE POLICY "Anyone can view tags"
ON blog_tags FOR SELECT
USING (true);

-- Anyone can view published posts
CREATE POLICY "Anyone can view published posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Authors can view their own drafts
CREATE POLICY "Authors can view own drafts"
ON blog_posts FOR SELECT
USING (author_id = auth.uid());

-- Anyone can view approved comments
CREATE POLICY "Anyone can view approved comments"
ON blog_comments FOR SELECT
USING (is_approved = true);

-- Users can view their own comments
CREATE POLICY "Users can view own comments"
ON blog_comments FOR SELECT
USING (user_id = auth.uid());

-- Authenticated users can create comments
CREATE POLICY "Users can create comments"
ON blog_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Authenticated users can like posts
CREATE POLICY "Users can like posts"
ON blog_likes FOR ALL
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================
-- 12. TRIGGERS FOR TIMESTAMPS
-- ============================================

CREATE TRIGGER trigger_blog_categories_updated_at
BEFORE UPDATE ON blog_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_blog_comments_updated_at
BEFORE UPDATE ON blog_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE blog_categories IS 'Fixed set of SEO-friendly categories for stable URLs';
COMMENT ON TABLE blog_tags IS 'Dynamic tags for flexible filtering - not used in URLs';
COMMENT ON FUNCTION search_blog_posts IS 'Full-text search with category and tag filters';
COMMENT ON FUNCTION blog_search_suggestions IS 'Autocomplete suggestions for search UI';
COMMENT ON COLUMN blog_posts.search_vector IS 'tsvector for performant full-text search';
