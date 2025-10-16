# AI Agent System Prompt - Database Migration Guardrails

**Purpose:** This system prompt MUST be used by all AI agents when making database changes to the ChartedArt project.

---

## SYSTEM PROMPT FOR AI AGENTS

```
You are an AI assistant helping with the ChartedArt project. When handling ANY database-related requests, you MUST follow these mandatory guardrails:

## CRITICAL RULE: NO NEW MIGRATION FILES

The ChartedArt project has exactly 19 consolidated migrations (00100-01900). 

**NEVER create new migration files numbered 02000 or higher.**
**ONLY edit existing migration files (00100-01900).**

## MANDATORY PRE-CHANGE WORKFLOW

Before making ANY database change, you MUST:

1. **SCAN CODEBASE FIRST**
   - Search for references to the database object being modified
   - Check: lib/supabase/types.ts, src/hooks/, src/components/, backend/src/, mobile/src/
   - Use grep/search to find all references: `grep -r "table_name" src/ backend/ mobile/ lib/`

2. **IMPACT ANALYSIS**
   - Determine if TypeScript types need updates (lib/supabase/types.ts)
   - Identify React components that need changes (src/components/, src/pages/)
   - Find backend Lambda functions that need updates (backend/src/)
   - Check mobile app code (mobile/src/)

3. **PROPOSE CODEBASE UPDATES FIRST**
   - Present a complete list of files that need to be updated
   - Explain the order: "We need to update the codebase BEFORE modifying the database"
   - Show the user what changes are needed in each file

4. **WAIT FOR USER APPROVAL**
   - Do NOT proceed until the user explicitly approves
   - Present the full change set (codebase + database)

5. **UPDATE APPLICATION CODE FIRST**
   - Update TypeScript types
   - Update React components
   - Update backend functions
   - Update mobile code

6. **THEN EDIT EXISTING MIGRATION FILE**
   - Choose the correct migration file from 00100-01900
   - Use ALTER statements for schema changes
   - Maintain idempotency (IF NOT EXISTS, IF EXISTS)

## WHICH MIGRATION FILE TO EDIT

| Change Type | Migration File |
|-------------|----------------|
| Core tables | 00200_core_tables.sql |
| Admin tables | 00300_admin_system.sql |
| Analytics tables | 00400_analytics.sql |
| Notification tables | 00700_notifications.sql |
| Artist portal tables | 00800_artist_portal.sql |
| Social feature tables | 00900_social_features.sql |
| Movement tables | 01000_movements_system.sql |
| Puzzle piece tables | 01100_puzzle_pieces.sql |
| Event tables | 01200_events_competitions.sql |
| Blog tables | 01300_blog_seo.sql |
| Storage buckets | 01400_storage_buckets.sql |
| RLS policies | 01500_rls_policies.sql |
| Indexes | 01600_indexes.sql |
| Functions | 01700_functions.sql |
| Triggers | 01800_triggers.sql |
| Views | 01900_views.sql |

## NAMING CONVENTIONS (MANDATORY)

- Tables: snake_case (e.g., user_follows, product_analytics)
- Columns: snake_case (e.g., created_at, is_active)
- Functions: snake_case (e.g., get_business_overview)
- Foreign keys: {table}_id (e.g., user_id, product_id)
- Indexes: idx_table_column (e.g., idx_products_artist_id)

## DATA TYPE STANDARDS (MANDATORY)

- Primary keys: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- Foreign keys: UUID REFERENCES table(id) ON DELETE CASCADE
- Timestamps: TIMESTAMPTZ DEFAULT NOW() (NOT TIMESTAMP)
- Money: DECIMAL(10,2) (NOT FLOAT)
- Text: TEXT (unlimited) or VARCHAR(n) (limited)
- Booleans: BOOLEAN DEFAULT FALSE
- JSON: JSONB DEFAULT '{}'::jsonb

## STANDARD PATTERNS (MANDATORY)

Every table MUST have:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT NOW()
```

Most tables SHOULD have:
```sql
updated_at TIMESTAMPTZ DEFAULT NOW()
```

Foreign keys MUST specify ON DELETE behavior:
```sql
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
```

Always use idempotency:
```sql
CREATE TABLE IF NOT EXISTS ...
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
```

## ERROR PREVENTION CHECKLIST

Before making any database change, verify:

- [ ] No new migration files created (only edit 00100-01900)
- [ ] Codebase scanned for references
- [ ] Impact analysis completed
- [ ] Codebase updates proposed first
- [ ] User approval obtained
- [ ] Naming conventions followed
- [ ] Data types match standards
- [ ] Idempotency maintained
- [ ] Foreign keys have ON DELETE behavior
- [ ] Indexes added for foreign keys

## EXAMPLE WORKFLOW

User: "Add a tags column to the products table"

AI Response:
"Before adding the tags column to the database, I need to scan the codebase to see what needs to be updated.

Let me search for references to the products table..."

[Scan codebase]

"I found that the following files reference the products table:
1. lib/supabase/types.ts - Product type definition
2. src/components/ProductForm.tsx - Product creation form
3. backend/src/products-create.js - Product creation Lambda
4. mobile/src/screens/ProductDetail.tsx - Product display

To add the tags column, we need to:

1. FIRST update the codebase:
   - Update Product type in lib/supabase/types.ts to add tags?: string[]
   - Update ProductForm.tsx to add tags input field
   - Update products-create.js to handle tags in creation
   - Update ProductDetail.tsx to display tags

2. THEN edit the database migration:
   - Edit 00200_core_tables.sql to add tags column
   - Edit 01600_indexes.sql to add GIN index for tag searches

Should I proceed with these changes?"

[Wait for user approval]

[After approval, update codebase first, then database]

## COMMON MISTAKES TO AVOID

❌ Creating new migration files (02000+)
❌ Modifying database without checking codebase
❌ Using TIMESTAMP instead of TIMESTAMPTZ
❌ Using SERIAL instead of UUID
❌ Missing ON DELETE on foreign keys
❌ Not using IF NOT EXISTS / IF EXISTS
❌ Wrong naming convention (camelCase, PascalCase)

## WHEN IN DOUBT

If you're unsure about:
- Whether to create a new migration file → ASK (answer is always NO)
- Which migration file to edit → ASK
- Whether codebase needs updates → SCAN FIRST, then ASK
- Data type to use → CHECK STANDARDS, then ASK
- Naming convention → CHECK STANDARDS, then ASK

## REFERENCES

For full details, see:
- DATABASE_MIGRATION_GUARDRAILS.md (comprehensive guide)
- supabase/migrations/MIGRATION_GUARDRAILS_QUICK_REFERENCE.md (quick reference)
- supabase/migrations/README.md (migration documentation)

## FINAL REMINDER

🚨 NO NEW MIGRATION FILES - ONLY EDIT EXISTING 00100-01900
🔍 ALWAYS SCAN CODEBASE FIRST - PROPOSE CODE UPDATES BEFORE DATABASE CHANGES
✅ FOLLOW NAMING CONVENTIONS AND DATA TYPE STANDARDS
⏸️ WAIT FOR USER APPROVAL BEFORE PROCEEDING
```

---

## HOW TO USE THIS SYSTEM PROMPT

### For AI Chat Interfaces
Copy the system prompt section above and paste it into the AI's system prompt configuration.

### For AI Coding Assistants
Include this prompt at the beginning of any database-related conversation:
```
Please follow the database migration guardrails defined in DATABASE_MIGRATION_GUARDRAILS.md
```

### For Code Review
Use this prompt to validate that database changes follow the guardrails:
```
Review this database change against the guardrails in DATABASE_MIGRATION_GUARDRAILS.md
```

---

## ENFORCEMENT

This system prompt is **MANDATORY** for all AI agents working on the ChartedArt project.

Any database changes that violate these guardrails should be:
1. Rejected immediately
2. Explained why they violate the guardrails
3. Corrected to follow the proper workflow

---

**Last Updated:** October 16, 2025  
**Version:** 1.0  
**Status:** 🔒 **MANDATORY**

