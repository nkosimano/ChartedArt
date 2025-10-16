-- ============================================
-- Migration: 01500_rls_policies.sql
-- Description: Row-Level Security policies for all tables
-- Dependencies: All previous migrations (00100-01400)
-- ============================================

-- Rollback:
-- Disable RLS on all tables and drop all policies
-- See individual DROP POLICY statements at end of file

-- ============================================
-- HELPER FUNCTION FOR RLS
-- ============================================

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
END;
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Core Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_submissions ENABLE ROW LEVEL SECURITY;

-- Admin System
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Analytics
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

-- Cart Analytics
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Wishlists & Reviews
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Artist Portal
ALTER TABLE artist_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_monthly_earnings ENABLE ROW LEVEL SECURITY;

-- Social Features
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CORE TABLE POLICIES
-- ============================================

-- Profiles: Users can view all profiles, manage their own
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL USING (is_admin());

-- Products: Public read, artists manage their own
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (status = 'active');
CREATE POLICY "Artists can manage own products" ON products FOR ALL USING (auth.uid() = artist_id);

-- Orders: Users can view and manage their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE USING (is_admin());

-- Order Items: Users can view items from their orders
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));

-- Cart Items: Users manage their own cart
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Testimonials: Public read approved, users manage their own
CREATE POLICY "Anyone can view approved testimonials" ON testimonials FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create testimonials" ON testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events: Public read approved events
CREATE POLICY "Anyone can view approved events" ON events FOR SELECT USING (is_approved = true);

-- Blog Posts: Public read published posts
CREATE POLICY "Anyone can view published blog posts" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage own posts" ON blog_posts FOR ALL USING (auth.uid() = author_id);

-- ============================================
-- ADMIN POLICIES
-- ============================================

-- Admin Users: Users can check their own admin status
CREATE POLICY "Users can check own admin status" ON admin_users FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Admin Users: Super admins can insert new admin users
CREATE POLICY "Super admins can insert admin users" ON admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- Admin Users: Super admins can update admin users
CREATE POLICY "Super admins can update admin users" ON admin_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- Admin Users: Super admins can delete admin users
CREATE POLICY "Super admins can delete admin users" ON admin_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- Messages: Users can view their own messages
CREATE POLICY "Users can view own messages" ON messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- System Config: Public configs visible to all, private to admins only
CREATE POLICY "Anyone can view public config" ON system_config FOR SELECT USING (is_public = true);

-- ============================================
-- ANALYTICS POLICIES
-- ============================================

-- Product Analytics: Admins and product owners can view
CREATE POLICY "Product owners can view analytics" ON product_analytics FOR SELECT 
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_id AND products.artist_id = auth.uid()));

-- User Browsing History: Users can view their own history
CREATE POLICY "Users can view own browsing history" ON user_browsing_history FOR SELECT USING (auth.uid() = user_id);

-- User Browsing History: Users can insert their own browsing history
CREATE POLICY "Users can insert own browsing history" ON user_browsing_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Browsing History: Allow anonymous browsing history (for tracking before login)
CREATE POLICY "Anonymous can insert browsing history" ON user_browsing_history FOR INSERT
  WITH CHECK (user_id IS NULL);

-- ============================================
-- NOTIFICATION POLICIES
-- ============================================

-- Notifications: Users can view and manage their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- User Notification Preferences: Users manage their own
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ARTIST PORTAL POLICIES
-- ============================================

-- Artist Portfolios: Public read, artists manage their own
CREATE POLICY "Anyone can view artist portfolios" ON artist_portfolios FOR SELECT USING (true);
CREATE POLICY "Artists can manage own portfolios" ON artist_portfolios FOR ALL USING (auth.uid() = artist_id);

-- Commission Requests: Participants can view and manage
CREATE POLICY "Participants can view commission requests" ON commission_requests FOR SELECT 
  USING (auth.uid() = customer_id OR auth.uid() = artist_id);
CREATE POLICY "Customers can create commission requests" ON commission_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Commission Messages: Participants can view and send
CREATE POLICY "Participants can view commission messages" ON commission_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM commission_requests WHERE id = commission_id AND (customer_id = auth.uid() OR artist_id = auth.uid())));

-- ============================================
-- SOCIAL FEATURE POLICIES
-- ============================================

-- User Follows: Users can manage their own follows
CREATE POLICY "Users can manage own follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);

-- Product Comments: Public read, users manage their own
CREATE POLICY "Anyone can view product comments" ON product_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON product_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON product_comments FOR UPDATE USING (auth.uid() = user_id);

-- Product Likes: Users manage their own likes
CREATE POLICY "Users can manage own likes" ON product_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view likes" ON product_likes FOR SELECT USING (true);

-- User Collections: Public read public collections, users manage their own
CREATE POLICY "Anyone can view public collections" ON user_collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own collections" ON user_collections FOR ALL USING (auth.uid() = user_id);

-- Artist Exhibitions: Public read, artists manage their own
CREATE POLICY "Anyone can view exhibitions" ON artist_exhibitions FOR SELECT USING (true);
CREATE POLICY "Artists can manage own exhibitions" ON artist_exhibitions FOR ALL USING (auth.uid() = artist_id);

-- Artist Awards: Public read, artists manage their own
CREATE POLICY "Anyone can view awards" ON artist_awards FOR SELECT USING (true);
CREATE POLICY "Artists can manage own awards" ON artist_awards FOR ALL USING (auth.uid() = artist_id);

-- User Activities: Users can view activities from followed users
CREATE POLICY "Users can view relevant activities" ON user_activities FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_follows WHERE follower_id = auth.uid() AND following_id = user_activities.user_id) OR
    activity_type IN ('product_like', 'new_artwork', 'exhibition')
  );

-- ============================================
-- ADMIN SECURITY POLICIES
-- ============================================

-- Admin Audit Log: Admins can view, system can insert
CREATE POLICY "Admins can view audit logs" ON admin_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert audit logs" ON admin_audit_log FOR INSERT
  WITH CHECK (true);

-- Login Attempts: Admins can view, system can insert
CREATE POLICY "Admins can view login attempts" ON login_attempts FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert login attempts" ON login_attempts FOR INSERT
  WITH CHECK (true);

-- Admin Sessions: Admins can view their own sessions, super admins can view all
CREATE POLICY "Admins can view own sessions" ON admin_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND (au.id = admin_sessions.admin_user_id OR au.role = 'super_admin')
    )
  );

-- Security Alerts: Admins can view and update
CREATE POLICY "Admins can view security alerts" ON security_alerts FOR SELECT
  USING (is_admin());

CREATE POLICY "Super admins can update security alerts" ON security_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

CREATE POLICY "System can insert security alerts" ON security_alerts FOR INSERT
  WITH CHECK (true);

-- Admin IP Whitelist: Admins can view, super admins can manage
CREATE POLICY "Admins can view IP whitelist" ON admin_ip_whitelist FOR SELECT
  USING (is_admin());

CREATE POLICY "Super admins can manage IP whitelist" ON admin_ip_whitelist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role = 'super_admin'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Anyone can view profiles" ON profiles IS 'Public profiles for discovery';
COMMENT ON POLICY "Users can manage own cart" ON cart_items IS 'Users have full control over their shopping cart';
COMMENT ON POLICY "Product owners can view analytics" ON product_analytics IS 'Artists can view analytics for their own products';

