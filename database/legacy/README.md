# Legacy SQL Files

This folder contains the original SQL scripts that were scattered throughout the codebase before consolidation.

## ⚠️ Important Notice

**These files are kept for reference only and should NOT be executed directly.**

All functionality from these files has been consolidated into the new migration structure located in `supabase/migrations/`.

## Migration Consolidation

On **October 16, 2025**, all SQL scripts were consolidated into a sequential, well-organized migration structure:

### New Migration Location
```
supabase/migrations/
├── 00100_extensions.sql
├── 00200_core_tables.sql
├── 00300_admin_system.sql
├── 00400_analytics.sql
├── 00500_cart_analytics.sql
├── 00600_wishlists_reviews.sql
├── 00700_notifications.sql
├── 00800_artist_portal.sql
├── 00900_social_features.sql
├── 01000_movements_system.sql
├── 01100_puzzle_pieces.sql
├── 01200_events_competitions.sql
├── 01300_blog_seo.sql
├── 01400_storage_buckets.sql
├── 01500_rls_policies.sql
├── 01600_indexes.sql
├── 01700_functions.sql
├── 01800_triggers.sql
└── 01900_views.sql
```

## Legacy Files Mapping

### Root Directory Files (Manual/Ad-hoc Scripts)
- `complete_foundation_migration.sql` → Consolidated into 00200-00400
- `phase_0_foundation_manual.sql` → Consolidated into 00400
- `fix_database_functions.sql` → Consolidated into 01700
- `verify_and_setup_admin.sql` → Consolidated into 00300
- `dashboard_test_queries.sql` → Reference only (test queries)

### database/ Directory Files (Feature Schemas)
- `admin_dashboard_functions.sql` → Consolidated into 01700
- `artist_portal_schema.sql` → Consolidated into 00800
- `notifications_schema.sql` → Consolidated into 00700
- `recommendation_functions.sql` → Consolidated into 01700
- `social_features_schema.sql` → Consolidated into 00900
- `analytics_schema.sql` → Consolidated into 00400

### supabase/migrations/ Directory Files (2025 Updates)
- `20251016_001_movements_system.sql` → Renamed to 01000
- `20251016_002_puzzle_pieces_system.sql` → Renamed to 01100
- `20251016_003_events_competitions.sql` → Renamed to 01200
- `20251016_004_blog_seo_system.sql` → Renamed to 01300
- `20241016_create_storage_buckets.sql` → Renamed to 01400
- `create_cart_analytics.sql` → Consolidated into 00500
- `create_push_notification_log.sql` → Consolidated into 00700

## Why These Files Were Archived

### Problems with Old Structure
1. **Scattered Organization** - Files in 3 different locations (root, database/, supabase/migrations/)
2. **No Clear Execution Order** - Unclear which files to run first
3. **Duplicates** - Same tables/functions defined in multiple files
4. **Mixed Purposes** - Migration scripts mixed with test queries and manual fixes
5. **Inconsistent Naming** - No standard naming convention
6. **No Rollback Scripts** - Difficult to undo changes
7. **Idempotency Issues** - Not all scripts safe to re-run
8. **Missing Documentation** - Unclear dependencies and purposes

### Benefits of New Structure
✅ **Sequential Numbering** - Clear execution order (00100 → 01900)
✅ **Logical Grouping** - Organized by feature/domain
✅ **Dependency-Aware** - Dependencies documented in each file
✅ **Idempotent Scripts** - Safe to re-run using IF NOT EXISTS
✅ **Complete Recreation** - Can rebuild entire database from scratch
✅ **Rollback Support** - Each file includes rollback commands
✅ **Comprehensive Documentation** - README, QUICK_START, and validation scripts
✅ **Validation Tools** - SQL and Node.js validation scripts

## How to Use New Migrations

### Option 1: Supabase CLI (Recommended)
```bash
# Apply all migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/00200_core_tables.sql
```

### Option 2: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy content from migration file
3. Execute in order (00100 → 01900)

### Option 3: Manual Execution
```bash
psql $DATABASE_URL -f supabase/migrations/00100_extensions.sql
psql $DATABASE_URL -f supabase/migrations/00200_core_tables.sql
# ... continue in order
```

## Validation

After running migrations, validate with:

```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/validate_migrations.sql
```

Or use Node.js validator:

```bash
node supabase/migrations/validate_migrations.js
```

## Reference Documentation

For complete documentation on the new migration structure, see:
- `supabase/migrations/README.md` - Comprehensive migration guide
- `supabase/migrations/QUICK_START.md` - Quick reference guide
- `MIGRATION_CONSOLIDATION_ANALYSIS.md` - Detailed analysis of consolidation

## Questions?

If you need to reference the original implementation of a feature, these legacy files are preserved here for that purpose. However, always use the new consolidated migrations for actual database changes.

---

**Last Updated:** October 16, 2025  
**Consolidation Performed By:** Database Migration Consolidation Project

