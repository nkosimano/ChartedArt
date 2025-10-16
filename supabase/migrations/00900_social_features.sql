-- ============================================
-- Migration: 00900_social_features.sql
-- Description: Social features (follows, likes, comments, collections, exhibitions)
-- Dependencies: 00200_core_tables.sql
-- ============================================

-- Rollback:
-- DROP TABLE IF EXISTS user_activities CASCADE;
-- DROP TABLE IF EXISTS artist_awards CASCADE;
-- DROP TABLE IF EXISTS artist_exhibitions CASCADE;
-- DROP TABLE IF EXISTS collection_products CASCADE;
-- DROP TABLE IF EXISTS user_collections CASCADE;
-- DROP TABLE IF EXISTS product_likes CASCADE;
-- DROP TABLE IF EXISTS comment_likes CASCADE;
-- DROP TABLE IF EXISTS product_comments CASCADE;
-- DROP TABLE IF EXISTS user_follows CASCADE;

-- ============================================
-- 1. USER FOLLOWS TABLE
-- ============================================
-- User follows/following system
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- 2. PRODUCT COMMENTS TABLE
-- ============================================
-- Product comments and reviews
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Comment Content
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Threading
  parent_comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. COMMENT LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one like per user per comment
  UNIQUE(user_id, comment_id)
);

-- ============================================
-- 4. PRODUCT LIKES TABLE
-- ============================================
-- Product likes/favorites
CREATE TABLE IF NOT EXISTS product_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one like per user per product
  UNIQUE(user_id, product_id)
);

-- ============================================
-- 5. USER COLLECTIONS TABLE
-- ============================================
-- User collections (like Pinterest boards)
CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Collection Details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Privacy
  is_public BOOLEAN DEFAULT true,
  
  -- Media
  cover_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. COLLECTION PRODUCTS TABLE
-- ============================================
-- Products in collections
CREATE TABLE IF NOT EXISTS collection_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES user_collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one product per collection
  UNIQUE(collection_id, product_id)
);

-- ============================================
-- 7. ARTIST EXHIBITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS artist_exhibitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Exhibition Details
  title VARCHAR(200) NOT NULL,
  venue VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Type
  type VARCHAR(20) CHECK (type IN ('solo', 'group')),
  
  -- Description
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. ARTIST AWARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS artist_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Award Details
  title VARCHAR(200) NOT NULL,
  organization VARCHAR(200) NOT NULL,
  year INTEGER NOT NULL,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. USER ACTIVITIES TABLE
-- ============================================
-- User activity feed
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  data JSONB,
  
  -- References
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- User Follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- Product Comments
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_user_id ON product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_id ON product_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);

-- Comment Likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Product Likes
CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_created_at ON product_likes(created_at DESC);

-- User Collections
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_public ON user_collections(is_public) WHERE is_public = true;

-- Collection Products
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON collection_products(product_id);

-- Artist Exhibitions
CREATE INDEX IF NOT EXISTS idx_artist_exhibitions_artist_id ON artist_exhibitions(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_exhibitions_dates ON artist_exhibitions(start_date, end_date);

-- Artist Awards
CREATE INDEX IF NOT EXISTS idx_artist_awards_artist_id ON artist_awards(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_awards_year ON artist_awards(year);

-- User Activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_product_id ON user_activities(product_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE user_follows IS 'User follow/following relationships';
COMMENT ON TABLE product_comments IS 'Product comments and reviews with threading support';
COMMENT ON TABLE comment_likes IS 'Likes on comments';
COMMENT ON TABLE product_likes IS 'Product likes/favorites';
COMMENT ON TABLE user_collections IS 'User collections (Pinterest-style boards)';
COMMENT ON TABLE collection_products IS 'Products saved to collections';
COMMENT ON TABLE artist_exhibitions IS 'Artist exhibition history';
COMMENT ON TABLE artist_awards IS 'Artist awards and recognitions';
COMMENT ON TABLE user_activities IS 'User activity feed for social features';

COMMENT ON COLUMN product_comments.parent_comment_id IS 'For threaded comments/replies';
COMMENT ON COLUMN user_activities.activity_type IS 'Activity types: product_like, new_follower, new_artwork, exhibition, etc.';

