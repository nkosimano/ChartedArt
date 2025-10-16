# Database Migration Guardrails - ChartedArt Project

**Version:** 1.0  
**Last Updated:** October 16, 2025  
**Status:** 🔒 **MANDATORY - ALL DATABASE CHANGES MUST FOLLOW THESE RULES**

---

## 🚨 CRITICAL RULE: NO NEW MIGRATION FILES

**The ChartedArt project has exactly 19 consolidated migrations (00100-01900).**

### ❌ **NEVER DO THIS:**
- Create new migration files numbered 02000 or higher
- Create hotfix migration files
- Create patch migration files
- Create any new `.sql` files in `supabase/migrations/`

### ✅ **ALWAYS DO THIS:**
- Edit existing migration files (00100-01900)
- Use `ALTER TABLE` statements within existing migrations
- Maintain idempotency with `IF NOT EXISTS` / `IF EXISTS` clauses
- Update the appropriate migration file based on feature domain

---

## 📋 PRE-MIGRATION VALIDATION CHECKLIST

Before making ANY database changes, the AI agent MUST complete this checklist:

### Step 1: Analyze the Request
- [ ] Understand what database change is needed (table, column, function, trigger, policy, etc.)
- [ ] Identify which migration file should be edited (00100-01900)
- [ ] Determine if this is a schema change, data change, or infrastructure change

### Step 2: Scan Application Codebase
**CRITICAL:** Check the codebase BEFORE modifying database migrations.

Scan these locations for references to the database object being modified:

- [ ] **TypeScript Types:** `lib/supabase/types.ts`
  - Check for type definitions that reference the table/column
  - Verify if types need to be updated

- [ ] **Frontend Hooks:** `src/hooks/`
  - Search for hooks that query the affected table
  - Check for hardcoded column names or queries

- [ ] **React Components:** `src/components/`, `src/pages/`
  - Find components that display or modify the affected data
  - Check for form fields that map to database columns

- [ ] **Backend Lambda Functions:** `backend/src/`
  - Search for Lambda handlers that interact with the table
  - Check for SQL queries or Supabase client calls

- [ ] **API Integrations:** `src/api/`
  - Check for API calls that reference the database object
  - Verify request/response types

- [ ] **Mobile App:** `mobile/src/`
  - Search for mobile screens/components using the data
  - Check for mobile-specific queries

**Search Commands:**
```bash
# Search for table references
grep -r "table_name" src/ backend/ mobile/ lib/

# Search for column references
grep -r "column_name" src/ backend/ mobile/ lib/

# Search for function calls
grep -r "function_name" src/ backend/ mobile/ lib/
```

### Step 3: Impact Analysis
Determine if the proposed database change requires updates to:

- [ ] **TypeScript Types** - Does `lib/supabase/types.ts` need updates?
- [ ] **Frontend Code** - Do React components/hooks need changes?
- [ ] **Backend Code** - Do Lambda functions need updates?
- [ ] **API Contracts** - Do API request/response types change?
- [ ] **Mobile Code** - Does the mobile app need updates?
- [ ] **Documentation** - Do README files need updates?

### Step 4: Recommend Codebase Updates First
**IMPORTANT:** If application code changes are needed, propose them BEFORE modifying database migrations.

**Workflow:**
1. **Propose codebase updates** (TypeScript types, React components, backend functions)
2. **Wait for user approval**
3. **Make codebase changes**
4. **Test codebase changes**
5. **THEN modify database migration**
6. **Deploy in sync** (code + database together)

**Rationale:** This ensures the application code is ready for the database change and prevents runtime errors.

### Step 5: Get User Approval
- [ ] Present the full impact analysis to the user
- [ ] Show which files need to be updated (codebase + database)
- [ ] Explain the order of changes (codebase first, then database)
- [ ] Wait for explicit approval before proceeding

---

## 📂 MIGRATION FILE MANAGEMENT RULES

### Migration File Structure (LOCKED)
```
supabase/migrations/
├── 00100_extensions.sql           ← PostgreSQL extensions
├── 00200_core_tables.sql          ← Core tables (profiles, products, orders, etc.)
├── 00300_admin_system.sql         ← Admin infrastructure
├── 00400_analytics.sql            ← Analytics tables
├── 00500_cart_analytics.sql       ← Cart tracking
├── 00600_wishlists_reviews.sql    ← Wishlists and reviews
├── 00700_notifications.sql        ← Notification system
├── 00800_artist_portal.sql        ← Artist portal
├── 00900_social_features.sql      ← Social features
├── 01000_movements_system.sql     ← Social impact campaigns
├── 01100_puzzle_pieces.sql        ← Puzzle pieces (NFT-style)
├── 01200_events_competitions.sql  ← Events and competitions
├── 01300_blog_seo.sql             ← Blog and SEO
├── 01400_storage_buckets.sql      ← Supabase storage
├── 01500_rls_policies.sql         ← Row-Level Security policies
├── 01600_indexes.sql              ← Performance indexes
├── 01700_functions.sql            ← Database functions
├── 01800_triggers.sql             ← Automation triggers
└── 01900_views.sql                ← Views and materialized views
```

### Which File to Edit?

| Change Type | Migration File | Examples |
|-------------|----------------|----------|
| Add/modify core table | `00200_core_tables.sql` | profiles, products, orders |
| Add/modify admin table | `00300_admin_system.sql` | admin_users, system_config |
| Add/modify analytics table | `00400_analytics.sql` | product_analytics, sales_metrics |
| Add/modify notification table | `00700_notifications.sql` | notifications, email_queue |
| Add/modify artist table | `00800_artist_portal.sql` | commission_requests, portfolios |
| Add/modify social table | `00900_social_features.sql` | user_follows, product_likes |
| Add/modify movement table | `01000_movements_system.sql` | movements, movement_metrics |
| Add/modify puzzle table | `01100_puzzle_pieces.sql` | puzzle_pieces, collections |
| Add/modify event table | `01200_events_competitions.sql` | event_registrations, submissions |
| Add/modify blog table | `01300_blog_seo.sql` | blog_posts, blog_categories |
| Add storage bucket | `01400_storage_buckets.sql` | Storage buckets and policies |
| Add RLS policy | `01500_rls_policies.sql` | Row-Level Security policies |
| Add index | `01600_indexes.sql` | Performance indexes |
| Add function | `01700_functions.sql` | Database functions, RPC endpoints |
| Add trigger | `01800_triggers.sql` | Automation triggers |
| Add view | `01900_views.sql` | Views, materialized views |

### Editing Existing Migrations

**Pattern for Adding New Tables:**
```sql
-- Add to appropriate migration file (e.g., 00200_core_tables.sql)

-- ============================================
-- NEW TABLE: table_name
-- ============================================
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns here
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE table_name IS 'Description of table purpose';
```

**Pattern for Modifying Existing Tables:**
```sql
-- Add to appropriate migration file

-- ============================================
-- MODIFY TABLE: table_name
-- ============================================

-- Add new column
ALTER TABLE table_name 
  ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Modify column (if safe)
-- Note: Be careful with ALTER COLUMN - may require data migration
ALTER TABLE table_name 
  ALTER COLUMN existing_column SET DEFAULT 'new_default';

-- Add constraint
ALTER TABLE table_name 
  ADD CONSTRAINT IF NOT EXISTS constraint_name 
  CHECK (condition);
```

**Pattern for Adding Indexes:**
```sql
-- Add to 01600_indexes.sql

CREATE INDEX IF NOT EXISTS idx_table_column 
  ON table_name(column_name);

CREATE INDEX IF NOT EXISTS idx_table_composite 
  ON table_name(column1, column2);
```

**Pattern for Adding RLS Policies:**
```sql
-- Add to 01500_rls_policies.sql

-- Enable RLS on table (if not already enabled)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY IF NOT EXISTS "policy_name"
  ON table_name
  FOR SELECT
  USING (condition);
```

---

## 🎯 CONSISTENCY STANDARDS

### Naming Conventions (MANDATORY)

| Object Type | Convention | Examples |
|-------------|------------|----------|
| **Tables** | `snake_case` | `user_follows`, `product_analytics`, `order_items` |
| **Columns** | `snake_case` | `created_at`, `is_active`, `user_id` |
| **Functions** | `snake_case` | `get_business_overview`, `update_product_stock` |
| **Triggers** | `snake_case` | `update_updated_at_trigger`, `create_activity_trigger` |
| **Indexes** | `idx_table_column` | `idx_products_artist_id`, `idx_orders_user_status` |
| **Policies** | `"Descriptive name"` | `"Users can view own data"`, `"Public read access"` |
| **Enums** | `snake_case` | `product_status`, `order_status`, `notification_type` |
| **Foreign Keys** | `{table}_id` | `user_id`, `product_id`, `artist_id` |

### Data Type Standards (MANDATORY)

| Use Case | Data Type | Example |
|----------|-----------|---------|
| **Primary Keys** | `UUID` | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| **Foreign Keys** | `UUID` | `user_id UUID REFERENCES profiles(id)` |
| **Timestamps** | `TIMESTAMPTZ` | `created_at TIMESTAMPTZ DEFAULT NOW()` |
| **Money/Prices** | `DECIMAL(10,2)` | `price DECIMAL(10,2) NOT NULL` |
| **Text (unlimited)** | `TEXT` | `description TEXT` |
| **Text (limited)** | `VARCHAR(n)` | `email VARCHAR(255)` |
| **Booleans** | `BOOLEAN` | `is_active BOOLEAN DEFAULT TRUE` |
| **Integers** | `INTEGER` | `stock_quantity INTEGER DEFAULT 0` |
| **JSON Data** | `JSONB` | `metadata JSONB DEFAULT '{}'::jsonb` |
| **Arrays** | `TEXT[]` | `tags TEXT[]` |
| **Enums** | `ENUM` | `status product_status DEFAULT 'draft'` |

### Standard Column Patterns (MANDATORY)

**Every table MUST have:**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT NOW()
```

**Most tables SHOULD have:**
```sql
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Soft delete pattern:**
```sql
archived_at TIMESTAMPTZ,
archived_by UUID REFERENCES profiles(id)
```

**User ownership pattern:**
```sql
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
```

**Status pattern:**
```sql
status status_enum DEFAULT 'active' NOT NULL
```

### Foreign Key Standards (MANDATORY)

**Always specify ON DELETE behavior:**
```sql
-- Cascade delete (delete child when parent deleted)
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE

-- Set null (keep child, nullify reference)
artist_id UUID REFERENCES profiles(id) ON DELETE SET NULL

-- Restrict (prevent parent deletion if children exist)
product_id UUID REFERENCES products(id) ON DELETE RESTRICT
```

**Always create indexes on foreign keys:**
```sql
-- In 01600_indexes.sql
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
```

---

## 🔄 WORKFLOW FOR DATABASE CHANGES

### Complete Workflow (MANDATORY)

```
1. ANALYZE REQUEST
   ↓
2. SCAN CODEBASE (TypeScript, React, Backend, Mobile)
   ↓
3. IMPACT ANALYSIS (What needs to change?)
   ↓
4. PROPOSE CODEBASE UPDATES FIRST
   ↓
5. WAIT FOR USER APPROVAL
   ↓
6. UPDATE APPLICATION CODE (Types, Components, Functions)
   ↓
7. TEST APPLICATION CODE
   ↓
8. EDIT EXISTING MIGRATION FILE (Never create new file)
   ↓
9. MAINTAIN IDEMPOTENCY (IF NOT EXISTS, IF EXISTS)
   ↓
10. UPDATE DOCUMENTATION (If needed)
    ↓
11. DEPLOY CODE + DATABASE TOGETHER
```

### Example: Adding a New Column

**❌ WRONG APPROACH:**
```sql
-- Just add column to database without checking codebase
ALTER TABLE products ADD COLUMN tags TEXT[];
```

**✅ CORRECT APPROACH:**

**Step 1:** Scan codebase for `products` table references
```bash
grep -r "products" src/ backend/ mobile/ lib/
```

**Step 2:** Identify files that need updates
- `lib/supabase/types.ts` - Add `tags?: string[]` to Product type
- `src/components/ProductForm.tsx` - Add tags input field
- `backend/src/products-create.js` - Handle tags in creation
- `mobile/src/screens/ProductDetail.tsx` - Display tags

**Step 3:** Propose changes to user
```
To add the `tags` column to the products table, we need to:

1. Update TypeScript types (lib/supabase/types.ts)
2. Update ProductForm component (src/components/ProductForm.tsx)
3. Update backend Lambda (backend/src/products-create.js)
4. Update mobile app (mobile/src/screens/ProductDetail.tsx)
5. Edit migration file (00200_core_tables.sql)

Should I proceed with these changes?
```

**Step 4:** After approval, update codebase first

**Step 5:** Then edit migration file
```sql
-- In 00200_core_tables.sql

-- ============================================
-- MODIFY TABLE: products - Add tags column
-- ============================================
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for tag searches
-- (This goes in 01600_indexes.sql)
CREATE INDEX IF NOT EXISTS idx_products_tags 
  ON products USING GIN(tags);
```

---

## ⚠️ ERROR PREVENTION CHECKLIST

Before making any database change, verify:

- [ ] **No new migration files created** (only edit 00100-01900)
- [ ] **No standalone SQL scripts created** (no hotfix.sql, apply_functions.sql, etc.)
- [ ] **Codebase scanned** for references to affected objects
- [ ] **Impact analysis completed** (TypeScript, React, Backend, Mobile)
- [ ] **Codebase updates proposed first** (before database changes)
- [ ] **User approval obtained** for the full change set
- [ ] **Naming conventions followed** (snake_case, proper patterns)
- [ ] **Data types match standards** (UUID, TIMESTAMPTZ, DECIMAL, etc.)
- [ ] **Idempotency maintained** (IF NOT EXISTS, IF EXISTS)
- [ ] **Foreign keys have ON DELETE** behavior specified
- [ ] **Indexes added** for new foreign keys
- [ ] **RLS policies added** to 01500_rls_policies.sql
- [ ] **Triggers added** to 01800_triggers.sql (if needed)
- [ ] **Functions added** to 01700_functions.sql (if needed)
- [ ] **Documentation updated** (if needed)

---

## 🚫 COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Creating New Migration Files
```bash
# NEVER DO THIS
supabase/migrations/02000_hotfix_critical_issues.sql  ❌
supabase/migrations/02100_add_tags_column.sql         ❌
supabase/migrations/hotfix_products.sql               ❌
```

**✅ Instead:** Edit existing migration file (e.g., `00200_core_tables.sql`)

### ❌ Mistake 1b: Creating Standalone SQL Scripts
```bash
# NEVER DO THIS
apply_functions.sql                                   ❌
hotfix_database.sql                                   ❌
add_missing_functions.sql                             ❌
fix_customer_analytics.sql                            ❌
```

**✅ Instead:** Edit existing migration file, then deploy via Supabase SQL Editor or `db reset`

### ❌ Mistake 2: Modifying Database Without Checking Codebase
```sql
-- NEVER DO THIS without checking codebase first
ALTER TABLE products DROP COLUMN size;  ❌
```

**✅ Instead:** Scan codebase for `size` references, update code first, then modify database

### ❌ Mistake 3: Wrong Data Types
```sql
-- WRONG
created_at TIMESTAMP                    ❌ (use TIMESTAMPTZ)
id SERIAL PRIMARY KEY                   ❌ (use UUID)
price FLOAT                             ❌ (use DECIMAL(10,2))
description VARCHAR(255)                ❌ (use TEXT for unlimited)
```

**✅ Correct:**
```sql
created_at TIMESTAMPTZ DEFAULT NOW()
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
price DECIMAL(10,2) NOT NULL
description TEXT
```

### ❌ Mistake 4: Missing ON DELETE Behavior
```sql
-- WRONG
user_id UUID REFERENCES profiles(id)    ❌
```

**✅ Correct:**
```sql
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
```

### ❌ Mistake 5: Not Using Idempotency
```sql
-- WRONG (fails if already exists)
CREATE TABLE products (...);            ❌
ALTER TABLE products ADD COLUMN tags;   ❌
```

**✅ Correct:**
```sql
CREATE TABLE IF NOT EXISTS products (...);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
```

---

## 🚀 DEPLOYING EDITED MIGRATIONS

**IMPORTANT:** This project has NO local database. All development is done directly on the remote Supabase database.

When you edit an existing migration file that was already applied to the remote database, you have two options:

### **Option 1: Supabase SQL Editor (RECOMMENDED for small changes)**

1. Open Supabase Dashboard → SQL Editor
2. Copy the new SQL from the edited migration file
3. Paste and run in SQL Editor
4. Verify the changes

**When to use:** Adding functions, triggers, indexes, or RLS policies to existing migrations

**Example:**
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
```

### **Option 2: Remote Database Reset (for major changes)**

1. **WARNING:** This will drop and recreate your ENTIRE REMOTE database
2. All data will be lost
3. Command: `npx supabase db reset --linked --yes`

**When to use:**
- Major schema changes
- Testing full migration suite
- Reapplying edited migrations that were already applied

**⚠️ This resets the REMOTE database, not local (there is no local database)!**

**Note:** The `--yes` flag auto-confirms the reset prompt. Omit it if you want to be prompted for confirmation.

### **What NOT to do:**

❌ **DO NOT create standalone SQL scripts** like:
- `apply_functions.sql`
- `hotfix_database.sql`
- `add_missing_functions.sql`

❌ **DO NOT create new migration files** like:
- `02000_add_missing_functions.sql`
- `hotfix_customer_analytics.sql`

✅ **ALWAYS edit the existing migration file** and deploy via SQL Editor or reset

---

## 📚 REFERENCE: EXISTING SCHEMA PATTERNS

### Standard Table Template
```sql
CREATE TABLE IF NOT EXISTS table_name (
  -- Primary key (MANDATORY)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys (with ON DELETE behavior)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Data columns
  name TEXT NOT NULL,
  description TEXT,
  status status_enum DEFAULT 'active' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps (MANDATORY)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Soft delete (OPTIONAL)
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Table comment
COMMENT ON TABLE table_name IS 'Description of table purpose';

-- Indexes (add to 01600_indexes.sql)
CREATE INDEX IF NOT EXISTS idx_table_user_id ON table_name(user_id);
CREATE INDEX IF NOT EXISTS idx_table_status ON table_name(status);

-- RLS policies (add to 01500_rls_policies.sql)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Triggers (add to 01800_triggers.sql)
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## 🎯 SUMMARY: KEY RULES

1. **NEVER create new migration files** (only edit 00100-01900)
2. **ALWAYS scan codebase first** before modifying database
3. **ALWAYS propose codebase updates first** (before database changes)
4. **ALWAYS wait for user approval** before proceeding
5. **ALWAYS follow naming conventions** (snake_case, proper patterns)
6. **ALWAYS use correct data types** (UUID, TIMESTAMPTZ, DECIMAL, etc.)
7. **ALWAYS maintain idempotency** (IF NOT EXISTS, IF EXISTS)
8. **ALWAYS specify ON DELETE** behavior for foreign keys
9. **ALWAYS add indexes** for foreign keys
10. **ALWAYS update appropriate files** (RLS → 01500, Triggers → 01800, etc.)

---

**This document is MANDATORY for all database changes in the ChartedArt project.**

**Last Updated:** October 16, 2025  
**Version:** 1.0  
**Status:** 🔒 **LOCKED - FOLLOW THESE RULES**

