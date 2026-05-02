-- Debug verification status
-- Run this in Supabase SQL Editor

-- Check all profiles
SELECT 
  id,
  username,
  handle,
  verified,
  verified_at,
  verified_type,
  follower_count,
  following_count
FROM profiles;

-- Check your specific profile (replace with your email)
SELECT 
  p.id,
  p.username,
  p.handle,
  p.verified,
  p.verified_at,
  p.verified_type,
  p.follower_count,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'Jacksonjfontes@gmail.com';

-- Check verified_users view
SELECT * FROM verified_users;

-- If empty, check if is_verified_active function works
SELECT is_verified_active(id) as is_active, * FROM profiles WHERE verified = TRUE;
