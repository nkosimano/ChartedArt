# Migration Guardrails - Quick Reference Card

**🚨 CRITICAL: NO NEW MIGRATION FILES - ONLY EDIT EXISTING 00100-01900**

---

## 🔍 Pre-Change Checklist

Before ANY database change:

1. ✅ **Scan codebase** for references to affected database object
2. ✅ **Identify impact** on TypeScript types, React components, backend, mobile
3. ✅ **Propose codebase updates FIRST** (before database changes)
4. ✅ **Wait for user approval**
5. ✅ **Update application code**
6. ✅ **Then edit existing migration file** (never create new)

---

## 📂 Which Migration File to Edit?

| What You're Changing | Edit This File |
|---------------------|----------------|
| Core tables (profiles, products, orders) | `00200_core_tables.sql` |
| Admin tables | `00300_admin_system.sql` |
| Analytics tables | `00400_analytics.sql` |
| Notification tables | `00700_notifications.sql` |
| Artist portal tables | `00800_artist_portal.sql` |
| Social feature tables | `00900_social_features.sql` |
| Movement tables | `01000_movements_system.sql` |
| Puzzle piece tables | `01100_puzzle_pieces.sql` |
| Event tables | `01200_events_competitions.sql` |
| Blog tables | `01300_blog_seo.sql` |
| Storage buckets | `01400_storage_buckets.sql` |
| **RLS policies** | `01500_rls_policies.sql` |
| **Indexes** | `01600_indexes.sql` |
| **Functions** | `01700_functions.sql` |
| **Triggers** | `01800_triggers.sql` |
| **Views** | `01900_views.sql` |

---

## 🎯 Naming Conventions

| Object | Convention | Example |
|--------|------------|---------|
| Tables | `snake_case` | `user_follows` |
| Columns | `snake_case` | `created_at` |
| Functions | `snake_case` | `get_business_overview` |
| Indexes | `idx_table_column` | `idx_products_artist_id` |
| Foreign Keys | `{table}_id` | `user_id`, `product_id` |

---

## 📊 Data Type Standards

| Use Case | Data Type |
|----------|-----------|
| Primary Keys | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign Keys | `UUID REFERENCES table(id) ON DELETE CASCADE` |
| Timestamps | `TIMESTAMPTZ DEFAULT NOW()` |
| Money | `DECIMAL(10,2)` |
| Text (unlimited) | `TEXT` |
| Booleans | `BOOLEAN DEFAULT FALSE` |
| JSON | `JSONB DEFAULT '{}'::jsonb` |

---

## 🔧 Standard Patterns

**Every table MUST have:**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Most tables SHOULD have:**
```sql
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Foreign keys MUST specify ON DELETE:**
```sql
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
```

**Always use idempotency:**
```sql
CREATE TABLE IF NOT EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
```

---

## 🔍 Codebase Scan Locations

Before modifying database, check these files:

- `lib/supabase/types.ts` - TypeScript type definitions
- `src/hooks/` - Frontend data hooks
- `src/components/` - React components
- `src/pages/` - Page components
- `backend/src/` - Lambda functions
- `mobile/src/` - Mobile app code

**Search command:**
```bash
grep -r "table_name" src/ backend/ mobile/ lib/
```

---

## ⚠️ Common Mistakes to Avoid

❌ Creating new migration files (02000+)  
❌ Modifying database without checking codebase  
❌ Using `TIMESTAMP` instead of `TIMESTAMPTZ`  
❌ Using `SERIAL` instead of `UUID`  
❌ Missing `ON DELETE` on foreign keys  
❌ Not using `IF NOT EXISTS` / `IF EXISTS`  
❌ Wrong naming convention (camelCase, PascalCase)  

---

## ✅ Correct Workflow

```
1. Analyze request
2. Scan codebase for references
3. Identify impact (types, components, backend, mobile)
4. Propose codebase updates FIRST
5. Wait for approval
6. Update application code
7. Edit existing migration file (00100-01900)
8. Maintain idempotency
9. Deploy code + database together
```

---

## 📚 Quick Templates

**Add new table:**
```sql
-- In appropriate migration file (e.g., 00200_core_tables.sql)
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Add column:**
```sql
ALTER TABLE table_name 
  ADD COLUMN IF NOT EXISTS column_name TEXT;
```

**Add index:**
```sql
-- In 01600_indexes.sql
CREATE INDEX IF NOT EXISTS idx_table_column 
  ON table_name(column_name);
```

**Add RLS policy:**
```sql
-- In 01500_rls_policies.sql
CREATE POLICY IF NOT EXISTS "Policy name"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

**Add trigger:**
```sql
-- In 01800_triggers.sql
CREATE TRIGGER trigger_name
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION function_name();
```

---

## 🚨 REMEMBER

**NO NEW MIGRATION FILES - ONLY EDIT EXISTING 00100-01900**

**ALWAYS CHECK CODEBASE FIRST - PROPOSE CODE UPDATES BEFORE DATABASE CHANGES**

---

**For full details, see:** `DATABASE_MIGRATION_GUARDRAILS.md`

