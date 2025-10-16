-- Social Features Database Schema
-- Run this in your Supabase SQL editor to add social functionality

-- User follows/following system
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Product comments and reviews
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  parent_comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Product likes/favorites
CREATE TABLE IF NOT EXISTS product_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- User collections (like Pinterest boards)
CREATE TABLE IF NOT EXISTS user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products in collections
CREATE TABLE IF NOT EXISTS collection_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES user_collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, product_id)
);

-- Artist exhibitions
CREATE TABLE IF NOT EXISTS artist_exhibitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  start_date DATE NOT NULL,
  end_date DATE,
  type VARCHAR(20) CHECK (type IN ('solo', 'group')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist awards
CREATE TABLE IF NOT EXISTS artist_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  year INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity feed
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  data JSONB,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend profiles table for social features
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS website VARCHAR(200),
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS artist_statement TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS years_active INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepts_commissions BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at);

CREATE INDEX IF NOT EXISTS idx_product_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_product_likes_product ON product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_user ON product_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_public ON user_collections(is_public);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product ON collection_products(product_id);

CREATE INDEX IF NOT EXISTS idx_artist_exhibitions_artist ON artist_exhibitions(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_exhibitions_dates ON artist_exhibitions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_artist_awards_artist ON artist_awards(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_awards_year ON artist_awards(year);

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_product ON user_activities(product_id);

-- Row Level Security (RLS) Policies

-- User follows policies
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- Product comments policies
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON product_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON product_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON product_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON product_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Comment likes policies
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comment likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- Product likes policies
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product likes" ON product_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own product likes" ON product_likes
  FOR ALL USING (auth.uid() = user_id);

-- User collections policies
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public collections and own collections" ON user_collections
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own collections" ON user_collections
  FOR ALL USING (auth.uid() = user_id);

-- Collection products policies
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in public collections" ON collection_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_collections 
      WHERE id = collection_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage products in their own collections" ON collection_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_collections 
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- Artist exhibitions policies
ALTER TABLE artist_exhibitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exhibitions" ON artist_exhibitions
  FOR SELECT USING (true);

CREATE POLICY "Artists can manage their own exhibitions" ON artist_exhibitions
  FOR ALL USING (auth.uid() = artist_id);

-- Artist awards policies
ALTER TABLE artist_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view awards" ON artist_awards
  FOR SELECT USING (true);

CREATE POLICY "Artists can manage their own awards" ON artist_awards
  FOR ALL USING (auth.uid() = artist_id);

-- User activities policies
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities from public users or followed users" ON user_activities
  FOR SELECT USING (
    -- User's own activities
    auth.uid() = user_id
    OR
    -- Activities from users they follow
    EXISTS (
      SELECT 1 FROM user_follows 
      WHERE follower_id = auth.uid() AND following_id = user_activities.user_id
    )
    OR
    -- Public activities (for discovery)
    activity_type IN ('product_like', 'new_artwork', 'exhibition')
  );

CREATE POLICY "Users can create their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic activity creation

-- Function to create activity when user likes a product
CREATE OR REPLACE FUNCTION create_like_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activities (
    user_id,
    activity_type,
    title,
    description,
    product_id,
    data
  ) VALUES (
    NEW.user_id,
    'product_like',
    'Liked an artwork',
    'Liked an artwork',
    NEW.product_id,
    jsonb_build_object('product_id', NEW.product_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when user follows someone
CREATE OR REPLACE FUNCTION create_follow_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activities (
    user_id,
    activity_type,
    title,
    description,
    target_user_id,
    data
  ) VALUES (
    NEW.follower_id,
    'user_follow',
    'Started following an artist',
    'Started following an artist',
    NEW.following_id,
    jsonb_build_object('following_id', NEW.following_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when artist adds new artwork
CREATE OR REPLACE FUNCTION create_artwork_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO user_activities (
      user_id,
      activity_type,
      title,
      description,
      product_id,
      data
    ) VALUES (
      NEW.artist_id,
      'new_artwork',
      'Added new artwork',
      'Added "' || NEW.name || '" to their collection',
      NEW.id,
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.name,
        'category', NEW.category
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic activity creation
CREATE TRIGGER trigger_like_activity
  AFTER INSERT ON product_likes
  FOR EACH ROW EXECUTE FUNCTION create_like_activity();

CREATE TRIGGER trigger_follow_activity
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_activity();

CREATE TRIGGER trigger_artwork_activity
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION create_artwork_activity();

-- Function to get social feed for a user
CREATE OR REPLACE FUNCTION get_social_feed(
  user_id UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  activity_type VARCHAR,
  title VARCHAR,
  description TEXT,
  data JSONB,
  product_id UUID,
  target_user_id UUID,
  created_at TIMESTAMPTZ,
  user_profile JSONB,
  product_info JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.user_id,
    ua.activity_type,
    ua.title,
    ua.description,
    ua.data,
    ua.product_id,
    ua.target_user_id,
    ua.created_at,
    jsonb_build_object(
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'is_verified', p.is_verified,
      'is_artist', p.is_artist
    ) as user_profile,
    CASE 
      WHEN ua.product_id IS NOT NULL THEN
        jsonb_build_object(
          'id', pr.id,
          'name', pr.name,
          'image_url', pr.image_url,
          'price', pr.price,
          'currency', pr.currency
        )
      ELSE NULL
    END as product_info
  FROM user_activities ua
  LEFT JOIN profiles p ON p.id = ua.user_id
  LEFT JOIN products pr ON pr.id = ua.product_id
  WHERE 
    -- User's own activities
    ua.user_id = get_social_feed.user_id
    OR
    -- Activities from users they follow
    EXISTS (
      SELECT 1 FROM user_follows uf
      WHERE uf.follower_id = get_social_feed.user_id 
      AND uf.following_id = ua.user_id
    )
  ORDER BY ua.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;