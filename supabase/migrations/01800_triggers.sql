-- ============================================
-- Migration: 01800_triggers.sql
-- Description: Database triggers for automation
-- Dependencies: 01700_functions.sql
-- ============================================

-- Rollback:
-- DROP TRIGGER statements for all triggers created in this file

-- ============================================
-- AUTH PROFILE CREATION TRIGGER
-- ============================================

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TIMESTAMP UPDATE TRIGGERS
-- ============================================

-- Products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Blog Posts
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- User Collections
CREATE TRIGGER update_user_collections_updated_at
  BEFORE UPDATE ON user_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Product Comments
CREATE TRIGGER update_product_comments_updated_at
  BEFORE UPDATE ON product_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Commission Requests
CREATE TRIGGER update_commission_requests_updated_at
  BEFORE UPDATE ON commission_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Movements
CREATE TRIGGER update_movements_updated_at
  BEFORE UPDATE ON movements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Puzzle Pieces
CREATE TRIGGER update_puzzle_pieces_updated_at
  BEFORE UPDATE ON puzzle_pieces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INVENTORY MANAGEMENT TRIGGERS
-- ============================================

-- Update product stock when order item is created
CREATE TRIGGER update_stock_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- ============================================
-- ACTIVITY TRACKING TRIGGERS
-- ============================================

-- Create activity when user likes a product
CREATE OR REPLACE FUNCTION create_like_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_activities (user_id, activity_type, title, product_id, data)
  SELECT 
    NEW.user_id,
    'product_like',
    'Liked ' || p.name,
    NEW.product_id,
    jsonb_build_object('product_name', p.name, 'product_image', p.image_url)
  FROM products p
  WHERE p.id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_activity_on_like
  AFTER INSERT ON product_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_activity();

-- Create activity when user follows another user
CREATE OR REPLACE FUNCTION create_follow_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_activities (user_id, activity_type, title, target_user_id, data)
  SELECT 
    NEW.follower_id,
    'new_follower',
    'Started following ' || p.full_name,
    NEW.following_id,
    jsonb_build_object('followed_user_name', p.full_name, 'followed_user_avatar', p.avatar_url)
  FROM profiles p
  WHERE p.id = NEW.following_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_activity_on_follow
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_activity();

-- Create activity when artist creates new artwork
CREATE OR REPLACE FUNCTION create_artwork_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO user_activities (user_id, activity_type, title, product_id, data)
    VALUES (
      NEW.artist_id,
      'new_artwork',
      'Published new artwork: ' || NEW.name,
      NEW.id,
      jsonb_build_object('product_name', NEW.name, 'product_image', NEW.image_url, 'price', NEW.price)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_activity_on_new_artwork
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_artwork_activity();

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Send notification when order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'order_' || NEW.status,
      'Order Status Updated',
      'Your order #' || NEW.id || ' is now ' || NEW.status,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'total_amount', NEW.total_amount)
    );
    
    -- Also log status change
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Send notification for new commission request
CREATE OR REPLACE FUNCTION notify_new_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.artist_id,
    'commission_request',
    'New Commission Request',
    'You have a new commission request',
    jsonb_build_object('commission_id', NEW.id, 'customer_id', NEW.customer_id, 'budget', NEW.budget)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_new_commission
  AFTER INSERT ON commission_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_commission();

-- Send notification when someone follows you
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    NEW.following_id,
    'new_follower',
    'New Follower',
    p.full_name || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id, 'follower_name', p.full_name, 'follower_avatar', p.avatar_url)
  FROM profiles p
  WHERE p.id = NEW.follower_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_new_follower
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- ============================================
-- ANALYTICS TRIGGERS
-- ============================================

-- Update product analytics on view
CREATE OR REPLACE FUNCTION update_product_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO product_analytics (product_id, date, views)
  VALUES (NEW.product_id, CURRENT_DATE, 1)
  ON CONFLICT (product_id, date)
  DO UPDATE SET 
    views = product_analytics.views + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_analytics_on_view
  AFTER INSERT ON user_browsing_history
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics();

-- Update cart session on cart item change
CREATE OR REPLACE FUNCTION update_cart_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO cart_sessions (user_id, session_id, status, last_activity, item_count, total_value)
  SELECT 
    NEW.user_id,
    gen_random_uuid(),
    'active',
    NOW(),
    COUNT(*),
    SUM(p.price * ci.quantity)
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = NEW.user_id
  GROUP BY ci.user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity = NOW(),
    item_count = EXCLUDED.item_count,
    total_value = EXCLUDED.total_value,
    status = 'active';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_session_on_cart_change
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_session();

-- ============================================
-- MOVEMENT METRICS TRIGGERS
-- ============================================

-- Update movement metrics on donation
CREATE OR REPLACE FUNCTION update_movement_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE movement_metrics
    SET 
      total_raised = total_raised + NEW.amount,
      total_donations = total_donations + 1,
      average_donation = (total_raised + NEW.amount) / (total_donations + 1),
      largest_donation = GREATEST(largest_donation, NEW.amount)
    WHERE movement_id = NEW.movement_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_metrics_on_donation
  AFTER INSERT ON movement_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_movement_metrics();

-- ============================================
-- ADMIN SECURITY TRIGGERS
-- ============================================

-- Trigger to create alert on new admin user
CREATE OR REPLACE FUNCTION trigger_new_admin_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM create_security_alert(
    'new_admin_user',
    'high',
    NEW.id,
    jsonb_build_object(
      'email', (SELECT email FROM profiles WHERE id = NEW.user_id),
      'role', NEW.role,
      'created_by', NEW.created_by
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER new_admin_user_alert
  AFTER INSERT ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_admin_alert();

-- Trigger to create alert on role change
CREATE OR REPLACE FUNCTION trigger_role_change_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    PERFORM create_security_alert(
      'role_change',
      'high',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'email', (SELECT email FROM profiles WHERE id = NEW.user_id)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_role_change_alert
  AFTER UPDATE ON admin_users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION trigger_role_change_alert();

-- Trigger to create alert on MFA disabled
CREATE OR REPLACE FUNCTION trigger_mfa_disabled_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.mfa_enabled = true AND NEW.mfa_enabled = false THEN
    PERFORM create_security_alert(
      'mfa_disabled',
      'high',
      NEW.id,
      jsonb_build_object(
        'email', (SELECT email FROM profiles WHERE id = NEW.user_id),
        'disabled_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_mfa_disabled_alert
  AFTER UPDATE ON admin_users
  FOR EACH ROW
  WHEN (OLD.mfa_enabled IS DISTINCT FROM NEW.mfa_enabled)
  EXECUTE FUNCTION trigger_mfa_disabled_alert();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TRIGGER update_products_updated_at ON products IS 'Automatically update updated_at timestamp';
COMMENT ON TRIGGER update_stock_on_order ON order_items IS 'Decrease product stock when order is placed';
COMMENT ON TRIGGER create_activity_on_like ON product_likes IS 'Create user activity when product is liked';
COMMENT ON TRIGGER notify_on_order_status_change ON orders IS 'Send notification when order status changes';
COMMENT ON TRIGGER update_analytics_on_view ON user_browsing_history IS 'Update product analytics on view';
COMMENT ON TRIGGER new_admin_user_alert ON admin_users IS 'Create security alert when new admin user is added';
COMMENT ON TRIGGER admin_role_change_alert ON admin_users IS 'Create security alert when admin role changes';
COMMENT ON TRIGGER admin_mfa_disabled_alert ON admin_users IS 'Create security alert when MFA is disabled';

