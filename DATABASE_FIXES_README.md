# Database Fixes for ChartedArt

This document outlines the fixes applied to resolve the errors you encountered in the product management system.

## Issues Fixed

1. **Products table missing `category` column** - Error: `Could not find the 'category' column of 'products' in the schema cache`
2. **Missing `get_business_overview` RPC function** - Error: `POST .../rpc/get_business_overview 404 (Not Found)`
3. **Added file upload functionality** - Replaced simple image URL input with drag-and-drop file upload

## Database Migrations to Run

You need to run these SQL migrations in your Supabase SQL Editor in this order:

### 1. Fix Products Table Schema
**File:** `supabase/migrations/20241016_fix_products_schema.sql`

This migration:
- Adds missing columns: `name`, `description`, `stock_quantity`, `status`, `image_url`, `category`, `artist_id`
- Renames `base_price` to `price` for consistency
- Updates existing products with default values
- Adds proper indexes and RLS policies
- Adds `is_artist` and `commission_rate` columns to profiles table

### 2. Create Storage Buckets
**File:** `supabase/migrations/20241016_create_storage_buckets.sql`

This migration:
- Creates `product-images` bucket for new uploads
- Creates `artwork-images` bucket for legacy support
- Sets up proper RLS policies for image upload/access
- Configures file size limits and allowed mime types

### 3. Movements System (Optional but Recommended)
**File:** `supabase/migrations/20251016_001_movements_system.sql`

This migration:
- Creates all tables for the social impact/movements feature
- Includes triggers, functions, and RLS policies
- **Note:** If you see errors about the `movements` table, you need to run this migration
- This won't affect product management - it's a separate feature

## Code Changes Made

### ProductManagement.tsx Updates

1. **Added file upload functionality:**
   - Import statements for image upload utilities
   - File selection and preview state management
   - Drag-and-drop upload UI with image preview
   - Integration with Supabase storage for image uploads
   - Upload progress indicators

2. **Enhanced form handling:**
   - File validation before upload
   - Image compression and optimization
   - Fallback to URL input for manual image links
   - Better error handling and user feedback

### Key Features Added

- **Drag-and-drop file upload** with visual feedback
- **Image preview** before submission
- **File validation** (10MB limit, image formats only)
- **Progress indicators** during upload and product creation
- **Fallback URL input** for users who prefer manual image links
- **Image compression** to optimize file sizes automatically

## How to Apply the Fixes

1. **Run the database migrations:**
   ```sql
   -- Copy and paste the contents of these files into your Supabase SQL Editor:
   -- 1. supabase/migrations/20241016_fix_products_schema.sql
   -- 2. supabase/migrations/20241016_create_storage_buckets.sql
   ```

2. **Verify the migrations worked:**
   - Check that the `products` table now has all required columns
   - Test that the `get_business_overview` function exists (or fallback works)
   - Verify that storage buckets are created in Supabase Storage

3. **Test the application:**
   - Try adding a new product with the file upload
   - Verify the dashboard loads without errors
   - Check that product images display correctly

## Expected Behavior After Fixes

- ✅ Product creation form should work without errors
- ✅ File uploads should process and store images in Supabase Storage
- ✅ Dashboard statistics should load correctly (with fallback queries)
- ✅ Product listings should display properly with all data
- ✅ Image previews should work in the upload form

## Notes

- The `get_business_overview` RPC function already exists in your migrations, but the dashboard has fallback logic if it's not available
- The products table migration is designed to be safe - it won't delete existing data
- File uploads are compressed automatically to optimize storage usage
- The system supports both file uploads and manual URL input for flexibility

## Troubleshooting

If you still encounter issues after applying these fixes:

1. **Check Supabase logs** for detailed error messages
2. **Verify RLS policies** are correctly applied in the Auth section
3. **Test storage permissions** by manually uploading to the buckets
4. **Check network connectivity** to Supabase services

The SalesDashboard component already has fallback logic for missing RPC functions, so it should work even if some functions aren't available.