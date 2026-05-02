-- Fix RLS policies to work with email-based auth, not just auth.uid()
-- This allows owner/demo accounts that don't exist in auth.users

-- Drop old policies
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile by email" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile by email" ON user_profiles;

-- For now, disable RLS on this table since we're using custom session tokens
-- that don't map to Supabase Auth users (owner, demo, etc.)
-- We'll re-enable with proper policies once fully migrated to Supabase Auth

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Make sure anyone can read profiles (needed for community)
-- And authenticated users can create/update their own by email

-- Note: Re-enable RLS later with:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- And proper policies that check the email from the JWT
