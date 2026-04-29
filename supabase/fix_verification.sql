-- Fix verification setup
-- Run this in Supabase SQL Editor

-- 1. Add columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS early_supporter BOOLEAN DEFAULT FALSE;

-- 2. Create the is_verified_active function
CREATE OR REPLACE FUNCTION is_verified_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT verified, verified_type, verified_expires_at INTO profile_record
  FROM profiles WHERE id = user_id;
  
  IF NOT profile_record.verified THEN
    RETURN FALSE;
  END IF;
  
  IF profile_record.verified_type IN ('free', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  IF profile_record.verified_type = 'paid' THEN
    RETURN profile_record.verified_expires_at IS NULL OR profile_record.verified_expires_at > NOW();
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the verified_users view
CREATE OR REPLACE VIEW verified_users AS
SELECT 
  p.*,
  is_verified_active(p.id) as verification_active
FROM profiles p
WHERE p.verified = TRUE;

-- 4. Verify yourself (run this after the above)
-- UPDATE profiles 
-- SET verified = TRUE, verified_at = NOW(), verified_type = 'admin' 
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'Jacksonjfontes@gmail.com');

-- 5. Check your profile
SELECT id, username, handle, verified, verified_type, follower_count 
FROM profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'Jacksonjfontes@gmail.com');
