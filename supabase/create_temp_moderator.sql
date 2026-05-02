-- Create temporary partner moderator
-- Run this in Supabase SQL Editor

-- Step 1: Create auth user (this creates the entry in auth.users)
-- The password will be 'temp123' (hashed)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'moderator@temp.modvora',  -- Temporary email
  crypt('temp123', gen_salt('bf')),  -- Password: temp123
  NOW(),  -- Email confirmed
  '{"name": "Temp Moderator"}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id;

-- After running above, copy the returned UUID and use it below:
-- Step 2: Create profile with moderator role (replace YOUR_UUID with the id from above)
-- INSERT INTO profiles (id, username, handle, verified, verified_at, verified_type, follower_count)
-- VALUES (
--   'YOUR_UUID_HERE',
--   'TempMod',
--   'temp_moderator',
--   TRUE,
--   NOW(),
--   'moderator',
--   0
-- );
