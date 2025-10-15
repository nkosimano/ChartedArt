-- Migration: Add push token support to profiles table
-- Date: 2025-10-14
-- Description: Adds push notification token storage for mobile app

-- Add push_token column to store Expo push tokens
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add timestamp to track when the token was last updated
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_profiles_push_token 
ON profiles(push_token) 
WHERE push_token IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.push_token IS 'Expo push notification token for mobile app';
COMMENT ON COLUMN profiles.push_token_updated_at IS 'Timestamp when push token was last registered or updated';

-- Verification: Check if columns were added successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'push_token'
  ) THEN
    RAISE NOTICE 'Column push_token added successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'push_token_updated_at'
  ) THEN
    RAISE NOTICE 'Column push_token_updated_at added successfully';
  END IF;
END $$;
