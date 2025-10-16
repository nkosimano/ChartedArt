# Database Change Decision Tree - ChartedArt Project

**Use this decision tree for ANY database change request.**

---

## 🌳 Decision Tree

```
┌─────────────────────────────────────┐
│  Database Change Request Received   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Question 1: Is this a new migration │
│ file (02000+) or hotfix file?       │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
       YES           NO
        │             │
        ▼             ▼
   ┌────────┐   ┌──────────────────────────────┐
   │ STOP!  │   │ Question 2: Have you scanned │
   │ REJECT │   │ the codebase for references? │
   └────────┘   └──────────┬───────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                   NO            YES
                    │             │
                    ▼             ▼
         ┌──────────────────┐   ┌────────────────────────────┐
         │ SCAN CODEBASE:   │   │ Question 3: Does the       │
         │ - TypeScript     │   │ codebase need updates?     │
         │ - React          │   └──────────┬─────────────────┘
         │ - Backend        │              │
         │ - Mobile         │       ┌──────┴──────┐
         └──────────────────┘       │             │
                                   YES           NO
                                    │             │
                                    ▼             ▼
                    ┌────────────────────────┐   ┌──────────────────────┐
                    │ PROPOSE CODEBASE       │   │ Question 4: Which    │
                    │ UPDATES FIRST:         │   │ migration file to    │
                    │ 1. TypeScript types    │   │ edit?                │
                    │ 2. React components    │   └──────────┬───────────┘
                    │ 3. Backend functions   │              │
                    │ 4. Mobile code         │              ▼
                    └──────────┬─────────────┘   ┌──────────────────────┐
                               │                 │ SELECT FILE:         │
                               ▼                 │ - Core → 00200       │
                    ┌──────────────────────┐     │ - Admin → 00300      │
                    │ WAIT FOR USER        │     │ - Analytics → 00400  │
                    │ APPROVAL             │     │ - RLS → 01500        │
                    └──────────┬───────────┘     │ - Indexes → 01600    │
                               │                 │ - Functions → 01700  │
                               ▼                 │ - Triggers → 01800   │
                    ┌──────────────────────┐     │ - Views → 01900      │
                    │ UPDATE APPLICATION   │     └──────────┬───────────┘
                    │ CODE FIRST           │                │
                    └──────────┬───────────┘                │
                               │                            │
                               └────────────┬───────────────┘
                                            │
                                            ▼
                             ┌──────────────────────────────┐
                             │ Question 5: Are you using    │
                             │ correct naming conventions?  │
                             └──────────┬───────────────────┘
                                        │
                                 ┌──────┴──────┐
                                 │             │
                                NO            YES
                                 │             │
                                 ▼             ▼
                      ┌──────────────────┐   ┌────────────────────────┐
                      │ FIX NAMING:      │   │ Question 6: Are you    │
                      │ - snake_case     │   │ using correct data     │
                      │ - {table}_id     │   │ types?                 │
                      │ - idx_table_col  │   └──────────┬─────────────┘
                      └──────────────────┘              │
                                                 ┌──────┴──────┐
                                                 │             │
                                                NO            YES
                                                 │             │
                                                 ▼             ▼
                                      ┌──────────────────┐   ┌────────────────────┐
                                      │ FIX DATA TYPES:  │   │ Question 7: Are    │
                                      │ - UUID           │   │ you maintaining    │
                                      │ - TIMESTAMPTZ    │   │ idempotency?       │
                                      │ - DECIMAL(10,2)  │   └──────────┬─────────┘
                                      │ - TEXT           │              │
                                      └──────────────────┘       ┌──────┴──────┐
                                                                 │             │
                                                                NO            YES
                                                                 │             │
                                                                 ▼             ▼
                                                      ┌──────────────────┐   ┌────────────────┐
                                                      │ ADD IDEMPOTENCY: │   │ Question 8:    │
                                                      │ - IF NOT EXISTS  │   │ Foreign keys   │
                                                      │ - IF EXISTS      │   │ have ON DELETE?│
                                                      └──────────────────┘   └──────┬─────────┘
                                                                                    │
                                                                             ┌──────┴──────┐
                                                                             │             │
                                                                            NO            YES
                                                                             │             │
                                                                             ▼             ▼
                                                                  ┌──────────────────┐   ┌────────────┐
                                                                  │ ADD ON DELETE:   │   │ PROCEED    │
                                                                  │ - CASCADE        │   │ WITH       │
                                                                  │ - SET NULL       │   │ CHANGE     │
                                                                  │ - RESTRICT       │   └──────┬─────┘
                                                                  └──────────────────┘          │
                                                                                                ▼
                                                                                     ┌──────────────────┐
                                                                                     │ EDIT EXISTING    │
                                                                                     │ MIGRATION FILE   │
                                                                                     │ (00100-01900)    │
                                                                                     └──────┬───────────┘
                                                                                            │
                                                                                            ▼
                                                                                     ┌──────────────────┐
                                                                                     │ ✅ COMPLETE      │
                                                                                     └──────────────────┘
```

---

## 📋 Quick Decision Checklist

Use this checklist for every database change:

### ❌ STOP if:
- [ ] You're creating a new migration file (02000+)
- [ ] You're creating a hotfix file
- [ ] You're creating any new .sql file in migrations/

### ⏸️ PAUSE if:
- [ ] You haven't scanned the codebase yet
- [ ] You don't know which migration file to edit
- [ ] You're unsure about naming conventions
- [ ] You're unsure about data types
- [ ] You haven't proposed codebase updates first

### ✅ PROCEED if:
- [ ] You've scanned the codebase for references
- [ ] You've identified all files that need updates
- [ ] You've proposed codebase updates FIRST
- [ ] You've received user approval
- [ ] You've updated application code
- [ ] You're editing an existing migration file (00100-01900)
- [ ] You're using correct naming conventions
- [ ] You're using correct data types
- [ ] You're maintaining idempotency
- [ ] Foreign keys have ON DELETE behavior

---

## 🎯 Quick Reference: Which File to Edit?

```
Database Object Type → Migration File

┌─────────────────────────┬──────────────────────────┐
│ Tables                  │ Migration File           │
├─────────────────────────┼──────────────────────────┤
│ profiles, products      │ 00200_core_tables.sql    │
│ admin_users, messages   │ 00300_admin_system.sql   │
│ product_analytics       │ 00400_analytics.sql      │
│ notifications           │ 00700_notifications.sql  │
│ commission_requests     │ 00800_artist_portal.sql  │
│ user_follows            │ 00900_social_features.sql│
│ movements               │ 01000_movements_system.sql│
│ puzzle_pieces           │ 01100_puzzle_pieces.sql  │
│ event_registrations     │ 01200_events_competitions│
│ blog_posts              │ 01300_blog_seo.sql       │
└─────────────────────────┴──────────────────────────┘

┌─────────────────────────┬──────────────────────────┐
│ Infrastructure          │ Migration File           │
├─────────────────────────┼──────────────────────────┤
│ Storage buckets         │ 01400_storage_buckets.sql│
│ RLS policies            │ 01500_rls_policies.sql   │
│ Indexes                 │ 01600_indexes.sql        │
│ Functions               │ 01700_functions.sql      │
│ Triggers                │ 01800_triggers.sql       │
│ Views                   │ 01900_views.sql          │
└─────────────────────────┴──────────────────────────┘
```

---

## 🔍 Codebase Scan Checklist

Before modifying database, check these locations:

```
┌─────────────────────────────────────────────────────┐
│ File/Directory              │ What to Check         │
├─────────────────────────────┼───────────────────────┤
│ lib/supabase/types.ts       │ Type definitions      │
│ src/hooks/                  │ Data fetching hooks   │
│ src/components/             │ React components      │
│ src/pages/                  │ Page components       │
│ backend/src/                │ Lambda functions      │
│ mobile/src/                 │ Mobile app code       │
└─────────────────────────────┴───────────────────────┘

Search command:
grep -r "table_name" src/ backend/ mobile/ lib/
grep -r "column_name" src/ backend/ mobile/ lib/
grep -r "function_name" src/ backend/ mobile/ lib/
```

---

## 🚦 Traffic Light System

### 🔴 RED LIGHT - STOP IMMEDIATELY
- Creating new migration files (02000+)
- Modifying database without scanning codebase
- Using wrong data types (TIMESTAMP, SERIAL, FLOAT for money)
- Missing ON DELETE on foreign keys
- Not using idempotency (IF NOT EXISTS)

### 🟡 YELLOW LIGHT - PAUSE AND CHECK
- Haven't scanned codebase yet
- Unsure which migration file to edit
- Unsure about naming conventions
- Haven't proposed codebase updates
- Haven't received user approval

### 🟢 GREEN LIGHT - PROCEED
- Scanned codebase for references
- Proposed codebase updates first
- Received user approval
- Updated application code
- Editing existing migration file (00100-01900)
- Following naming conventions
- Using correct data types
- Maintaining idempotency

---

## 📊 Example Scenarios

### Scenario 1: Add New Column

```
Request: "Add a tags column to products table"

Decision Path:
1. New migration file? NO → Continue
2. Scanned codebase? NO → SCAN FIRST
   - Found: types.ts, ProductForm.tsx, products-create.js
3. Codebase needs updates? YES → PROPOSE UPDATES FIRST
4. User approval? WAIT
5. After approval → UPDATE CODE FIRST
6. Which file? 00200_core_tables.sql
7. Naming correct? tags (snake_case) ✅
8. Data type? TEXT[] ✅
9. Idempotent? ADD COLUMN IF NOT EXISTS ✅
10. PROCEED ✅
```

### Scenario 2: Add New Table

```
Request: "Create a product_reviews table"

Decision Path:
1. New migration file? NO → Continue
2. Scanned codebase? NO → SCAN FIRST
   - No existing references (new feature)
3. Codebase needs updates? YES → PROPOSE UPDATES FIRST
   - Need: types.ts, ReviewForm.tsx, reviews API
4. User approval? WAIT
5. After approval → UPDATE CODE FIRST
6. Which file? 00600_wishlists_reviews.sql
7. Naming correct? product_reviews (snake_case) ✅
8. Data types? UUID, TIMESTAMPTZ, TEXT ✅
9. Idempotent? CREATE TABLE IF NOT EXISTS ✅
10. Foreign keys? ON DELETE CASCADE ✅
11. PROCEED ✅
```

### Scenario 3: Add RLS Policy

```
Request: "Add RLS policy for product_reviews"

Decision Path:
1. New migration file? NO → Continue
2. Scanned codebase? YES (already exists)
3. Codebase needs updates? NO (just security)
4. Which file? 01500_rls_policies.sql
5. Naming correct? "Users can view own reviews" ✅
6. Idempotent? CREATE POLICY IF NOT EXISTS ✅
7. PROCEED ✅
```

---

## 🎯 Summary

**Before ANY database change:**

1. ❌ **NEVER** create new migration files
2. 🔍 **ALWAYS** scan codebase first
3. 💬 **ALWAYS** propose codebase updates before database changes
4. ⏸️ **ALWAYS** wait for user approval
5. 💻 **ALWAYS** update application code first
6. 📝 **ALWAYS** edit existing migration files (00100-01900)
7. ✅ **ALWAYS** follow naming conventions and data type standards
8. 🔒 **ALWAYS** maintain idempotency

---

**For full details, see:**
- `DATABASE_MIGRATION_GUARDRAILS.md` (comprehensive guide)
- `supabase/migrations/MIGRATION_GUARDRAILS_QUICK_REFERENCE.md` (quick reference)
- `AI_AGENT_SYSTEM_PROMPT_DATABASE.md` (AI agent configuration)

