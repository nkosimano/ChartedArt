-- Migration: Create storage buckets for product images
-- Created: 2025-10-16
-- Description: Creates storage buckets with proper policies for product image uploads

-- =====================================================
-- 1. Create product-images bucket
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Create RLS policies for product-images bucket
-- =====================================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'product-images' AND 
  (auth.uid()::text = (storage.foldername(name))[2] OR 
   -- Allow uploads to products folder structure
   name ~ '^products/[a-f0-9\-]+/')
);

-- Allow public read access to all product images
CREATE POLICY "Public can view product images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'product-images');

-- Artists can update/delete their own product images
CREATE POLICY "Artists can manage own product images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'product-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Artists can delete own product images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'product-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Admins can manage all product images
CREATE POLICY "Admins can manage all product images" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  )
);

-- =====================================================
-- 3. Create artwork-images bucket (fallback for legacy)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artwork-images',
  'artwork-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policies for artwork-images bucket
CREATE POLICY "Authenticated users can upload artwork images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'artwork-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Public can view artwork images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'artwork-images');

CREATE POLICY "Users can manage own artwork images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'artwork-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete own artwork images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'artwork-images' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- =====================================================
-- 4. Comments for documentation
-- =====================================================
COMMENT ON BUCKET 'product-images' IS 'Storage for product images with 10MB limit and image format restrictions';
COMMENT ON BUCKET 'artwork-images' IS 'Legacy bucket for artwork images, maintained for backwards compatibility';