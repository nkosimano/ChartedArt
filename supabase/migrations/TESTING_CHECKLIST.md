# Migration Testing Checklist

Use this checklist to validate the consolidated database migrations.

## ✅ Pre-Testing Setup

- [ ] **Backup existing database** (if testing on production data)
- [ ] **Create fresh test database** (recommended for first test)
- [ ] **Set environment variables** (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] **Install Supabase CLI** (if using CLI method)

---

## 📋 Migration Execution Tests

### Test 1: Sequential Execution
Execute migrations in order and verify no errors:

- [ ] **00100_extensions.sql** - PostgreSQL extensions
  - Verify: `SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'pgcrypto');`
  
- [ ] **00200_core_tables.sql** - Core tables
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('profiles', 'products', 'orders');`
  
- [ ] **00300_admin_system.sql** - Admin system
  - Verify: `SELECT COUNT(*) FROM system_config;` (should return 6 default configs)
  
- [ ] **00400_analytics.sql** - Analytics tables
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%analytics%';`
  
- [ ] **00500_cart_analytics.sql** - Cart analytics
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('cart_sessions', 'order_status_history');`
  
- [ ] **00600_wishlists_reviews.sql** - Wishlists and reviews
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('wishlists', 'product_reviews');`
  
- [ ] **00700_notifications.sql** - Notification system
  - Verify: `SELECT COUNT(*) FROM notification_templates;` (should return 4 default templates)
  
- [ ] **00800_artist_portal.sql** - Artist portal
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'artist_%' OR table_name LIKE 'commission_%';`
  
- [ ] **00900_social_features.sql** - Social features
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('user_follows', 'product_likes', 'user_collections');`
  
- [ ] **01000_movements_system.sql** - Movements
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'movement%';`
  
- [ ] **01100_puzzle_pieces.sql** - Puzzle pieces
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'puzzle%';`
  
- [ ] **01200_events_competitions.sql** - Events and competitions
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%competition%' OR table_name LIKE 'event_%';`
  
- [ ] **01300_blog_seo.sql** - Blog system
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'blog_%';`
  
- [ ] **01400_storage_buckets.sql** - Storage buckets
  - Verify: `SELECT COUNT(*) FROM storage.buckets WHERE id IN ('product-images', 'artwork-images');`
  
- [ ] **01500_rls_policies.sql** - RLS policies
  - Verify: `SELECT COUNT(*) FROM pg_policies;` (should be 100+)
  
- [ ] **01600_indexes.sql** - Performance indexes
  - Verify: `SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';` (should be 50+)
  
- [ ] **01700_functions.sql** - Database functions
  - Verify: `SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace;`
  
- [ ] **01800_triggers.sql** - Triggers
  - Verify: `SELECT COUNT(*) FROM pg_trigger WHERE tgname NOT LIKE 'RI_%';`
  
- [ ] **01900_views.sql** - Views
  - Verify: `SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';`

---

## 🔍 Validation Tests

### Test 2: Run Validation Script
- [ ] **Execute validate_migrations.sql**
  ```sql
  \i supabase/migrations/validate_migrations.sql
  ```
  - Verify all checks pass (✅)
  - No missing tables (❌)
  - All expected extensions present
  - All storage buckets created

### Test 3: Run Node.js Validator (Optional)
- [ ] **Execute validate_migrations.js**
  ```bash
  node supabase/migrations/validate_migrations.js
  ```
  - Exit code 0 (success)
  - All tables present
  - All functions created

---

## 🧪 Functional Tests

### Test 4: Core Functionality
- [ ] **Insert test profile**
  ```sql
  INSERT INTO profiles (id, email, full_name) 
  VALUES (gen_random_uuid(), 'test@example.com', 'Test User');
  ```
  
- [ ] **Insert test product**
  ```sql
  INSERT INTO products (name, description, price, stock_quantity, status, category) 
  VALUES ('Test Art', 'Test Description', 100.00, 10, 'active', 'painting');
  ```
  
- [ ] **Create test order**
  ```sql
  INSERT INTO orders (user_id, total_amount, status) 
  VALUES ((SELECT id FROM profiles LIMIT 1), 100.00, 'pending');
  ```

### Test 5: RLS Policies
- [ ] **Test public read access**
  ```sql
  SET ROLE anon;
  SELECT COUNT(*) FROM products WHERE status = 'active';
  RESET ROLE;
  ```
  
- [ ] **Test authenticated user access**
  ```sql
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '<user-id>';
  SELECT COUNT(*) FROM cart_items WHERE user_id = '<user-id>';
  RESET ROLE;
  ```

### Test 6: Functions
- [ ] **Test get_business_overview()**
  ```sql
  SELECT get_business_overview(NOW() - INTERVAL '30 days', NOW());
  ```
  
- [ ] **Test get_product_recommendations()**
  ```sql
  SELECT * FROM get_product_recommendations('<user-id>', 10);
  ```

### Test 7: Triggers
- [ ] **Test timestamp update trigger**
  ```sql
  UPDATE products SET name = 'Updated Name' WHERE id = '<product-id>';
  SELECT updated_at FROM products WHERE id = '<product-id>';
  -- Verify updated_at changed
  ```
  
- [ ] **Test stock update trigger**
  ```sql
  -- Create order item
  INSERT INTO order_items (order_id, product_id, quantity, price)
  VALUES ('<order-id>', '<product-id>', 2, 100.00);
  -- Verify stock decreased by 2
  SELECT stock_quantity FROM products WHERE id = '<product-id>';
  ```

### Test 8: Views
- [ ] **Test product_performance_summary view**
  ```sql
  SELECT * FROM product_performance_summary LIMIT 5;
  ```
  
- [ ] **Test customer_lifetime_value view**
  ```sql
  SELECT * FROM customer_lifetime_value LIMIT 5;
  ```
  
- [ ] **Refresh materialized views**
  ```sql
  SELECT refresh_all_materialized_views();
  SELECT * FROM artist_sales_analytics LIMIT 5;
  ```

---

## 🔄 Idempotency Tests

### Test 9: Re-run Migrations
- [ ] **Re-execute all migrations** (should complete without errors)
- [ ] **Verify no duplicate data** (check system_config, notification_templates)
- [ ] **Verify no duplicate constraints** (check pg_constraint)

---

## 🚀 Application Integration Tests

### Test 10: Frontend Integration
- [ ] **Test product listing** (verify products display)
- [ ] **Test cart functionality** (add/remove items)
- [ ] **Test user authentication** (login/signup)
- [ ] **Test artist portal** (view earnings, products)
- [ ] **Test notifications** (receive notifications)

### Test 11: Backend Integration
- [ ] **Test API endpoints** (verify all endpoints work)
- [ ] **Test Lambda functions** (movements, puzzle pieces, etc.)
- [ ] **Test file uploads** (product images, artwork images)

---

## 📊 Performance Tests

### Test 12: Query Performance
- [ ] **Test product search** (with full-text search)
  ```sql
  EXPLAIN ANALYZE 
  SELECT * FROM products WHERE name ILIKE '%art%';
  ```
  
- [ ] **Test order history** (with indexes)
  ```sql
  EXPLAIN ANALYZE 
  SELECT * FROM orders WHERE user_id = '<user-id>' ORDER BY created_at DESC;
  ```
  
- [ ] **Test analytics queries** (with materialized views)
  ```sql
  EXPLAIN ANALYZE 
  SELECT * FROM artist_sales_analytics WHERE artist_id = '<artist-id>';
  ```

---

## 🔒 Security Tests

### Test 13: RLS Policy Enforcement
- [ ] **Verify users can't access other users' data**
- [ ] **Verify admins can access all data**
- [ ] **Verify public can only see published content**
- [ ] **Verify storage bucket policies work**

---

## ✅ Final Verification

### Test 14: Complete Validation
- [ ] **All 60+ tables created**
- [ ] **All 30+ functions working**
- [ ] **All 15+ triggers firing**
- [ ] **All 50+ indexes created**
- [ ] **All 100+ RLS policies active**
- [ ] **All 2 storage buckets configured**
- [ ] **All views accessible**
- [ ] **No errors in logs**

---

## 📝 Test Results

### Database Information
- **Database URL:** _______________________
- **Test Date:** _______________________
- **Tester:** _______________________

### Results Summary
- **Total Tests:** 14
- **Passed:** ___ / 14
- **Failed:** ___ / 14
- **Skipped:** ___ / 14

### Issues Found
1. _______________________
2. _______________________
3. _______________________

### Notes
_______________________
_______________________
_______________________

---

## 🎉 Sign-off

- [ ] **All tests passed**
- [ ] **No critical issues found**
- [ ] **Application works correctly**
- [ ] **Ready for production deployment**

**Approved by:** _______________________  
**Date:** _______________________

---

## 📚 Additional Resources

- See `README.md` for detailed migration documentation
- See `QUICK_START.md` for quick reference
- See `MIGRATION_CONSOLIDATION_COMPLETE.md` for project summary
- See `database/legacy/README.md` for legacy file mapping

