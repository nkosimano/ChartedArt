# SQL Migration Consolidation - Complete Analysis

## 📊 DISCOVERY PHASE COMPLETE

### Current State Summary
- **Total SQL Files:** 24 files (~230KB)
- **Locations:** 3 different directories (root, database/, supabase/migrations/)
- **Issues:** Scattered organization, duplicates, unclear execution order

---

## ✅ ACTIVELY USED TABLES (Verified in Codebase)

### **Core Tables** (8 tables)
✅ `profiles` - User profiles (extends auth.users)
✅ `products` - Product catalog with extended schema (name, description, stock_quantity, status, image_url, category, artist_id)
✅ `orders` - Customer orders
✅ `order_items` - Order line items
✅ `cart_items` - Shopping cart (referenced in CartPage.tsx, useCart.ts)
✅ `testimonials` - Customer testimonials
✅ `events` - Events and exhibitions
✅ `blog_posts` - Blog content

### **Admin & Analytics** (5 tables)
✅ `admin_users` - Admin role management (referenced in backend/utils/supabase.js)
✅ `messages` - Admin messaging system
✅ `inventory_alerts` - Low stock alerts
✅ `product_analytics` - Product performance metrics (referenced in useAdminDashboard.ts)
✅ `cart_sessions` - Cart analytics (database/migrations/create_cart_analytics.sql)

### **Notifications** (6 tables)
✅ `notifications` - User notifications (referenced in useNotifications.ts)
✅ `user_notification_preferences` - Notification settings
✅ `push_subscriptions` - Web push subscriptions
✅ `notification_templates` - Notification templates
✅ `email_queue` - Email delivery queue
✅ `notification_delivery_log` - Delivery tracking
✅ `push_notification_log` - Push notification tracking (database/migrations/create_push_notification_log.sql)
✅ `order_status_history` - Order status audit trail

### **Artist Portal** (4 tables)
✅ `artist_portfolios` - Artist portfolio items (database/artist_portal_schema.sql)
✅ `commission_requests` - Commission requests (referenced in shop/CommissionRequest.tsx)
✅ `commission_messages` - Commission communication
✅ `artist_monthly_earnings` - Artist earnings tracking

### **Social Features** (10 tables)
✅ `user_follows` - Follow/following system
✅ `product_comments` - Product comments/reviews
✅ `comment_likes` - Comment likes
✅ `product_likes` - Product favorites
✅ `user_collections` - User collections (Pinterest-style)
✅ `collection_products` - Products in collections
✅ `artist_exhibitions` - Artist exhibition history
✅ `artist_awards` - Artist awards
✅ `user_activities` - Activity feed

### **Advanced Features - 2025 Migrations** (20+ tables)
✅ `movements` - Social impact campaigns (referenced in backend/handlers/movements-get.js, useMovements.ts)
✅ `movement_metrics` - Movement analytics
✅ `movement_participants` - Movement participation
✅ `movement_donations` - Donation tracking
✅ `movement_products` - Products linked to movements
✅ `movement_events` - Events linked to movements
✅ `movement_updates` - Movement blog/news

✅ `puzzle_pieces` - Puzzle piece NFT-style system (referenced in backend/handlers/puzzle-pieces-list.js)
✅ `puzzle_piece_collections` - User puzzle collections
✅ `puzzle_piece_transfers` - Transfer history
✅ `piece_reservations` - Atomic reservations

✅ `event_registrations` - Event registration system
✅ `competition_submissions` - Competition entries
✅ `competition_judges` - Judge assignments
✅ `judge_scores` - Judging scores
✅ `submission_upload_requests` - Secure upload tokens

✅ `blog_categories` - Blog categories (referenced in supabase/migrations/20251016_004_blog_seo_system.sql)
✅ `blog_tags` - Blog tags
✅ `blog_post_tags` - Many-to-many relationship
✅ `blog_comments` - Blog comments

### **Analytics & Personalization** (11 tables)
✅ `user_browsing_history` - User behavior tracking
✅ `wishlists` - User wishlists
✅ `wishlist_items` - Wishlist items
✅ `product_reviews` - Product reviews
✅ `customer_segments` - Customer segmentation
✅ `sales_metrics` - Daily sales metrics
✅ `user_sessions` - Session tracking

### **Storage & Configuration** (3 tables)
✅ `system_config` - System configuration
✅ `idempotency_keys` - API idempotency
✅ Storage buckets: `product-images`, `artwork-images`

---

## ❌ LEGACY/UNUSED TABLES (NOT FOUND IN CODEBASE)

### **Potentially Legacy** (Need Verification)
⚠️ `gallery_submissions` - Defined in types.ts but no active usage found
⚠️ `carts` - Referenced in CartPage.tsx but may be replaced by cart_items

**Note:** The `products` table schema has evolved:
- **Old schema:** `size`, `frame_type`, `base_price` (from complete_foundation_migration.sql)
- **New schema:** `name`, `description`, `price`, `stock_quantity`, `status`, `image_url`, `category`, `artist_id` (from 20241016_fix_products_schema.sql)
- **Current usage:** New schema is actively used in codebase

---

## 📋 RECOMMENDED CONSOLIDATION STRUCTURE

```
supabase/migrations/
├── README.md (Execution guide & documentation)
├── 00100_extensions.sql (PostgreSQL extensions)
├── 00200_core_tables.sql (profiles, products, orders, order_items, cart_items)
├── 00300_admin_system.sql (admin_users, messages, system_config, idempotency_keys)
├── 00400_analytics.sql (product_analytics, sales_metrics, user_browsing_history, user_sessions, customer_segments)
├── 00500_cart_analytics.sql (cart_sessions, cart analytics views)
├── 00600_wishlists_reviews.sql (wishlists, wishlist_items, product_reviews)
├── 00700_notifications.sql (notifications, preferences, push, email queue)
├── 00800_artist_portal.sql (artist_portfolios, commissions, earnings)
├── 00900_social_features.sql (follows, likes, comments, collections, exhibitions, awards, activities)
├── 01000_movements_system.sql (movements + 6 related tables)
├── 01100_puzzle_pieces.sql (puzzle_pieces + 3 related tables)
├── 01200_events_competitions.sql (event_registrations, competitions, judges, scores)
├── 01300_blog_seo.sql (blog_categories, blog_tags, blog enhancements)
├── 01400_storage_buckets.sql (Supabase storage configuration)
├── 01500_rls_policies.sql (All Row-Level Security policies)
├── 01600_indexes.sql (Performance indexes)
├── 01700_functions.sql (Database functions & RPC)
├── 01800_triggers.sql (Triggers for automation)
└── 01900_views.sql (Materialized views)
```

### Benefits of This Structure:
✅ Sequential numbering ensures correct execution order
✅ Logical grouping by feature domain
✅ Dependency-aware (extensions → tables → policies → indexes → functions → triggers)
✅ Idempotent scripts (safe to re-run with IF NOT EXISTS)
✅ Complete database recreation from scratch
✅ Backward compatible with existing database
✅ Clear separation of concerns
✅ Easy to understand and maintain

---

## 🎯 NEXT STEPS

1. **Create consolidated migration files** in the recommended structure
2. **Add comprehensive README.md** with execution instructions
3. **Archive old scattered SQL files** to `database/legacy/` folder
4. **Test migrations** on a fresh Supabase instance
5. **Update documentation** to reference new migration structure

---

## 📝 NOTES

- All migrations will use `CREATE TABLE IF NOT EXISTS` for idempotency
- All migrations will include proper comments and documentation
- RLS policies separated for easier management
- Functions and triggers separated for clarity
- No legacy/unused tables will be included
- Products table will use the NEW schema (with name, description, etc.)

