# 🚀 Quick Start Guide - Database Migrations

## ⚡ TL;DR - Get Started in 3 Steps

### Step 1: Run Migrations

**Option A - Using Supabase CLI (Easiest)**
```bash
supabase db push
```

**Option B - Using Supabase Dashboard**
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste each migration file in order (00100 → 01900)
3. Click "Run" for each file

### Step 2: Validate Setup

**Option A - SQL Validation (Recommended)**
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste contents of `validate_migrations.sql`
3. Click "Run"
4. Review the output for any ❌ or ⚠️ warnings

**Option B - Node.js Validation**
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run validator
node supabase/migrations/validate_migrations.js
```

### Step 3: Verify Core Functionality

```sql
-- Quick smoke test
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;

-- Check RLS is working
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' LIMIT 10;

-- Check storage buckets
SELECT * FROM storage.buckets;
```

---

## 📋 Migration Files Overview

| File | Purpose | Tables Created |
|------|---------|----------------|
| `00100_extensions.sql` | PostgreSQL extensions | N/A (extensions only) |
| `00200_core_tables.sql` | Core business tables | 8 tables |
| `00300_admin_system.sql` | Admin infrastructure | 5 tables |
| `00400_analytics.sql` | Analytics & tracking | 5 tables |
| `00500_cart_analytics.sql` | Cart tracking | 2 tables |
| `00600_wishlists_reviews.sql` | Wishlists & reviews | 3 tables |
| `00700_notifications.sql` | Notification system | 7 tables |
| `00800_artist_portal.sql` | Artist features | 4 tables |
| `00900_social_features.sql` | Social features | 9 tables |
| `01000_movements_system.sql` | Social impact campaigns | 7 tables |
| `01100_puzzle_pieces.sql` | Puzzle piece system | 4 tables |
| `01200_events_competitions.sql` | Events & competitions | 5 tables |
| `01300_blog_seo.sql` | Blog with SEO | 4 tables |
| `01400_storage_buckets.sql` | File storage | 2 buckets |
| `01500_rls_policies.sql` | Security policies | 100+ policies |
| `01600_indexes.sql` | Performance indexes | 50+ indexes |
| `01700_functions.sql` | Database functions | 30+ functions |
| `01800_triggers.sql` | Automation triggers | 15+ triggers |
| `01900_views.sql` | Materialized views | 5+ views |

**Total:** 60+ tables, 100+ RLS policies, 50+ indexes, 30+ functions, 15+ triggers

---

## ✅ Validation Checklist

After running migrations, verify:

- [ ] All 60+ tables created
- [ ] RLS enabled on all tables
- [ ] Extensions installed (uuid-ossp, pg_trgm)
- [ ] Storage buckets created (product-images, artwork-images)
- [ ] Database functions created (30+)
- [ ] Triggers created (15+)
- [ ] No errors in Supabase logs

---

## 🐛 Common Issues & Solutions

### Issue: "relation already exists"
**Solution:** This is normal! All migrations use `IF NOT EXISTS` clauses. The migration will skip existing objects.

### Issue: "foreign key constraint violation"
**Solution:** Ensure migrations are run in numerical order (00100 → 01900).

### Issue: "permission denied for table"
**Solution:** Check RLS policies. You may need to use the service role key for admin operations.

### Issue: "function does not exist"
**Solution:** Ensure `01700_functions.sql` has been executed before using RPC functions.

### Issue: Storage bucket not found
**Solution:** Ensure `01400_storage_buckets.sql` has been executed.

---

## 🔄 Rollback Instructions

If you need to start fresh:

```sql
-- ⚠️ WARNING: This will delete ALL data!

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS blog_comments CASCADE;
DROP TABLE IF EXISTS blog_post_tags CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;
DROP TABLE IF EXISTS submission_upload_requests CASCADE;
DROP TABLE IF EXISTS judge_scores CASCADE;
DROP TABLE IF EXISTS competition_judges CASCADE;
DROP TABLE IF EXISTS competition_submissions CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS piece_reservations CASCADE;
DROP TABLE IF EXISTS puzzle_piece_transfers CASCADE;
DROP TABLE IF EXISTS puzzle_piece_collections CASCADE;
DROP TABLE IF EXISTS puzzle_pieces CASCADE;
DROP TABLE IF EXISTS movement_updates CASCADE;
DROP TABLE IF EXISTS movement_events CASCADE;
DROP TABLE IF EXISTS movement_products CASCADE;
DROP TABLE IF EXISTS movement_donations CASCADE;
DROP TABLE IF EXISTS movement_participants CASCADE;
DROP TABLE IF EXISTS movement_metrics CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS artist_awards CASCADE;
DROP TABLE IF EXISTS artist_exhibitions CASCADE;
DROP TABLE IF EXISTS collection_products CASCADE;
DROP TABLE IF EXISTS user_collections CASCADE;
DROP TABLE IF EXISTS product_likes CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS product_comments CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS artist_monthly_earnings CASCADE;
DROP TABLE IF EXISTS commission_messages CASCADE;
DROP TABLE IF EXISTS commission_requests CASCADE;
DROP TABLE IF EXISTS artist_portfolios CASCADE;
DROP TABLE IF EXISTS push_notification_log CASCADE;
DROP TABLE IF EXISTS notification_delivery_log CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS user_notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS cart_sessions CASCADE;
DROP TABLE IF EXISTS customer_segments CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_browsing_history CASCADE;
DROP TABLE IF EXISTS sales_metrics CASCADE;
DROP TABLE IF EXISTS product_analytics CASCADE;
DROP TABLE IF EXISTS inventory_alerts CASCADE;
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS gallery_submissions CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop storage buckets
DELETE FROM storage.buckets WHERE name IN ('product-images', 'artwork-images');

-- Then re-run all migrations in order
```

---

## 📞 Support

If you encounter issues:

1. Check the `README.md` for detailed documentation
2. Review `MIGRATION_CONSOLIDATION_ANALYSIS.md` for architecture details
3. Run `validate_migrations.sql` to identify specific issues
4. Check Supabase logs for error details

---

**Last Updated:** 2025-01-16  
**Database Version:** PostgreSQL 15 (Supabase)

