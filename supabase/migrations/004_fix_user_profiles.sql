-- Fix user_profiles to allow standalone inserts
-- Owner/demo accounts don't exist in auth.users, so we need flexibility

-- Drop the foreign key constraint (if it exists)
ALTER TABLE IF EXISTS user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Make id auto-generated
ALTER TABLE IF EXISTS user_profiles 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure email is unique for lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
  ON user_profiles(email);

-- Ensure handle uniqueness (but allow nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_handle 
  ON user_profiles(handle) 
  WHERE handle IS NOT NULL;

-- Add index for faster handle lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_handle_lookup 
  ON user_profiles(handle);
