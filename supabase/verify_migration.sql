-- Verification System Migration
-- Run this in Supabase SQL Editor after the main schema

-- Add verified column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users;

-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is the owner (you) - replace with your user ID
  -- Or check for admin role in the future
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND (verified = TRUE OR handle = 'jackson') -- fallback for initial setup
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for admin to verify users
CREATE POLICY "Admins can verify users"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Update your profile to be verified
-- Replace 'YOUR_USER_ID' with your actual Supabase user ID after signing up
-- UPDATE profiles SET verified = TRUE, verified_at = NOW() WHERE id = 'YOUR_USER_ID';
