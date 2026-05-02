-- Verified Badge System Migration
-- Run this in Supabase SQL Editor

-- Add verification fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_type TEXT CHECK (verified_type IN ('free', 'paid', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS early_supporter BOOLEAN DEFAULT FALSE;

-- Create follows table for tracking followers
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Create index for faster follower queries
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Enable RLS on follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Follows: Users can see all, insert/delete own
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    -- Increment follower count for followed user
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    -- Auto-verify at 1K followers
    UPDATE profiles SET 
      verified = TRUE, 
      verified_at = NOW(),
      verified_type = COALESCE(verified_type, 'free')
    WHERE id = NEW.following_id 
    AND follower_count >= 1000 
    AND verified = FALSE;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    -- Decrement follower count for followed user
    UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update counts
DROP TRIGGER IF EXISTS update_counts_on_follow ON follows;
CREATE TRIGGER update_counts_on_follow
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- Function to check if verification is active
CREATE OR REPLACE FUNCTION is_verified_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT verified, verified_type, verified_expires_at INTO profile_record
  FROM profiles WHERE id = user_id;
  
  -- Not verified
  IF NOT profile_record.verified THEN
    RETURN FALSE;
  END IF;
  
  -- Free or admin verification never expires
  IF profile_record.verified_type IN ('free', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Paid verification check expiration
  IF profile_record.verified_type = 'paid' THEN
    RETURN profile_record.verified_expires_at IS NULL OR profile_record.verified_expires_at > NOW();
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- View for verified users with active status
CREATE OR REPLACE VIEW verified_users AS
SELECT 
  p.*,
  is_verified_active(p.id) as verification_active
FROM profiles p
WHERE p.verified = TRUE;

-- Policy to allow users to update their own profile (but not their verified status)
CREATE POLICY "Users can update own profile basics" 
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND verified = (SELECT verified FROM profiles WHERE id = auth.uid())
    AND verified_type = (SELECT verified_type FROM profiles WHERE id = auth.uid())
  );

-- Admin can verify users manually
CREATE POLICY "Admin can verify users"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND verified_type = 'admin'
    )
  );
