-- ============================================
-- Migration: 01600_indexes.sql
-- Description: Performance indexes for all tables
-- Dependencies: All table migrations (00200-01300)
-- ============================================

-- Rollback:
-- DROP INDEX statements for all indexes created in this file

-- NOTE: Most basic indexes are already created in their respective table migrations
-- This file contains additional performance indexes for complex queries

-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

-- Products full-text search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- Blog Posts full-text search
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_trgm ON blog_posts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_trgm ON blog_posts USING gin(content gin_trgm_ops);

-- Profiles full-text search
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_bio_trgm ON profiles USING gin(bio gin_trgm_ops);

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

-- Orders by user and status
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status, created_at DESC);

-- Products by artist and status
CREATE INDEX IF NOT EXISTS idx_products_artist_status ON products(artist_id, status) WHERE status = 'active';

-- Product analytics by product and date range
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_date ON product_analytics(product_id, date DESC);

-- User browsing history for recommendations
CREATE INDEX IF NOT EXISTS idx_browsing_recent ON user_browsing_history(user_id, viewed_at DESC);

-- Cart sessions for abandoned cart recovery
CREATE INDEX IF NOT EXISTS idx_cart_sessions_abandoned ON cart_sessions(status, last_activity) 
  WHERE status = 'active';

-- Notifications unread by user
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) 
  WHERE is_read = false;

-- Commission requests by status
CREATE INDEX IF NOT EXISTS idx_commissions_artist_status ON commission_requests(artist_id, status, created_at DESC);

-- Product comments with ratings
CREATE INDEX IF NOT EXISTS idx_comments_product_rating ON product_comments(product_id, rating, created_at DESC) 
  WHERE rating IS NOT NULL;

-- ============================================
-- JSONB INDEXES
-- ============================================

-- Profiles social links
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING gin(social_links);

-- System config values
CREATE INDEX IF NOT EXISTS idx_system_config_value ON system_config USING gin(value);

-- Notification data
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING gin(data);

-- User activities data
CREATE INDEX IF NOT EXISTS idx_user_activities_data ON user_activities USING gin(data);

-- ============================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- ============================================

-- Active products only
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products(created_at DESC) 
  WHERE status = 'active';

-- Verified artists
CREATE INDEX IF NOT EXISTS idx_profiles_verified_artists ON profiles(id) 
  WHERE is_artist = true AND is_verified = true;

-- Pending commission requests
CREATE INDEX IF NOT EXISTS idx_commissions_pending ON commission_requests(artist_id, created_at DESC) 
  WHERE status = 'pending';

-- Active movements
CREATE INDEX IF NOT EXISTS idx_movements_active ON movements(created_at DESC) 
  WHERE status = 'active' AND archived_at IS NULL;

-- Available puzzle pieces
CREATE INDEX IF NOT EXISTS idx_puzzle_available ON puzzle_pieces(movement_id, piece_number) 
  WHERE status = 'available';

-- Pending email queue
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(scheduled_at) 
  WHERE status = 'pending';

-- ============================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================

-- Product list with essential fields
CREATE INDEX IF NOT EXISTS idx_products_list ON products(status, category, created_at DESC) 
  INCLUDE (name, price, image_url);

-- Order summary
CREATE INDEX IF NOT EXISTS idx_orders_summary ON orders(user_id, created_at DESC) 
  INCLUDE (status, total_amount);

-- ============================================
-- ARRAY INDEXES
-- ============================================

-- Artist specialties
CREATE INDEX IF NOT EXISTS idx_profiles_specialties ON profiles USING gin(specialties) 
  WHERE specialties IS NOT NULL;

-- Movement tags
CREATE INDEX IF NOT EXISTS idx_movements_tags ON movements USING gin(tags);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON INDEX idx_products_name_trgm IS 'Trigram index for fuzzy product name search';
COMMENT ON INDEX idx_blog_posts_title_trgm IS 'Trigram index for blog post search';
COMMENT ON INDEX idx_orders_user_status IS 'Composite index for user order history queries';
COMMENT ON INDEX idx_cart_sessions_abandoned IS 'Partial index for abandoned cart recovery';
COMMENT ON INDEX idx_notifications_unread IS 'Partial index for unread notifications';

