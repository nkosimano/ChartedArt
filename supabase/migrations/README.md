# ChartedArt Database Migrations

## 📋 Overview

This directory contains the consolidated database migrations for ChartedArt. All migrations are:
- ✅ **Idempotent** - Safe to re-run multiple times
- ✅ **Sequential** - Numbered for correct execution order
- ✅ **Dependency-aware** - Organized to respect foreign key relationships
- ✅ **Well-documented** - Each file includes comments and purpose

## 🗂️ Migration Structure

```
00100_extensions.sql          - PostgreSQL extensions (uuid-ossp, etc.)
00200_core_tables.sql          - Core tables (profiles, products, orders, cart_items)
00300_admin_system.sql         - Admin infrastructure (admin_users, messages, config)
00400_analytics.sql            - Analytics tables (product_analytics, sales_metrics)
00500_cart_analytics.sql       - Cart tracking and abandoned cart recovery
00600_wishlists_reviews.sql    - Wishlists and product reviews
00700_notifications.sql        - Notification system (8 tables)
00800_artist_portal.sql        - Artist features (portfolios, commissions)
00900_social_features.sql      - Social features (follows, likes, comments, collections)
01000_movements_system.sql     - Social impact campaigns (7 tables)
01100_puzzle_pieces.sql        - Puzzle piece NFT-style system (4 tables)
01200_events_competitions.sql  - Events and competitions (5 tables)
01300_blog_seo.sql             - Blog system with SEO (4 tables)
01400_storage_buckets.sql      - Supabase storage configuration
01500_rls_policies.sql         - Row-Level Security policies
01600_indexes.sql              - Performance indexes
01700_functions.sql            - Database functions and RPC endpoints
01800_triggers.sql             - Triggers for automation
01900_views.sql                - Materialized views
```

## 🚀 Quick Start

### Option 1: Using Supabase CLI (Recommended)

```bash
# From project root
supabase db push
```

This will automatically execute all migrations in order.

### Option 2: Manual Execution via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Execute migrations **in numerical order** (00100 → 00200 → ... → 01900)
4. Verify each migration completes successfully before proceeding

### Option 3: Using the Validation Script

```bash
# Run validation script to check migration status
node supabase/migrations/validate_migrations.js
```

## ✅ Validation

After running migrations, verify the setup:

```sql
-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check extensions
SELECT * FROM pg_extension;

-- Check storage buckets
SELECT * FROM storage.buckets;
```

## 🔄 Migration Execution Order

**Critical:** Migrations MUST be executed in numerical order due to dependencies:

1. **Extensions** (00100) - Required by all other migrations
2. **Core Tables** (00200) - Referenced by most other tables
3. **Admin System** (00300) - Independent but foundational
4. **Analytics** (00400-00600) - Depends on core tables
5. **Features** (00700-01300) - Depends on core tables and profiles
6. **Infrastructure** (01400-01900) - Depends on all tables being created

## 📊 Database Schema Summary

### Total Objects Created:
- **60+ Tables** across all domains
- **30+ Functions** for business logic and RPC
- **15+ Triggers** for automation
- **50+ Indexes** for performance
- **100+ RLS Policies** for security
- **2 Storage Buckets** for file uploads
- **5+ Materialized Views** for analytics

### Key Features:
- ✅ Row-Level Security on all tables
- ✅ Soft deletes with `archived_at` timestamps
- ✅ Audit trails with `created_at`/`updated_at`
- ✅ Foreign key constraints for data integrity
- ✅ Check constraints for data validation
- ✅ Full-text search capabilities
- ✅ Real-time subscriptions support
- ✅ Atomic operations with triggers

## 🛠️ Development Workflow

### Creating a New Migration

1. Create a new file with the next sequential number:
   ```
   02000_your_feature_name.sql
   ```

2. Use idempotent syntax:
   ```sql
   CREATE TABLE IF NOT EXISTS your_table (...);
   ALTER TABLE your_table ADD COLUMN IF NOT EXISTS new_column ...;
   ```

3. Include rollback instructions in comments:
   ```sql
   -- Rollback: DROP TABLE IF EXISTS your_table CASCADE;
   ```

4. Test on a local Supabase instance first

### Rolling Back a Migration

Migrations are designed to be idempotent, but if you need to rollback:

```sql
-- Each migration file includes rollback instructions in comments
-- Look for "Rollback:" comments at the top of each file
```

## 🔒 Security Notes

- All tables have RLS enabled (see `01500_rls_policies.sql`)
- Admin operations require `admin_users` table membership
- Sensitive operations use RPC functions with security checks
- Storage buckets have access policies configured

## 📝 Maintenance

### Regular Tasks:
- Monitor slow queries and add indexes as needed
- Review RLS policies for security
- Update materialized views periodically
- Clean up expired notifications and sessions

### Performance Optimization:
- Indexes are created in `01600_indexes.sql`
- Materialized views in `01900_views.sql`
- Consider partitioning large tables (orders, analytics) as data grows

## 🐛 Troubleshooting

### Migration Fails with "relation already exists"
- This is normal if re-running migrations
- All migrations use `IF NOT EXISTS` clauses
- Check for syntax errors in the specific migration

### Foreign Key Constraint Errors
- Ensure migrations are run in numerical order
- Check that referenced tables exist
- Verify RLS policies aren't blocking inserts

### RLS Policy Errors
- Ensure user is authenticated
- Check policy conditions match your use case
- Review `01500_rls_policies.sql` for policy definitions

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🔗 Related Files

- `MIGRATION_CONSOLIDATION_ANALYSIS.md` - Detailed analysis of migration structure
- `validate_migrations.js` - Validation script
- `database/legacy/` - Archived old SQL files (for reference only)

---

**Last Updated:** 2025-01-16  
**Database Version:** PostgreSQL 15 (Supabase)  
**Total Migrations:** 19 files

