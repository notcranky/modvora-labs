-- Partner Moderator Role Setup
-- Run this in Supabase SQL Editor

-- 1. Add moderator role to profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verified_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_verified_type_check 
  CHECK (verified_type IN ('free', 'paid', 'admin', 'moderator'));

-- 2. Create function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION is_moderator_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND verified = TRUE 
    AND verified_type IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update moderation queue policies for moderators
DROP POLICY IF EXISTS "Moderators can view moderation queue" ON moderation_queue;
DROP POLICY IF EXISTS "Moderators can update moderation queue" ON moderation_queue;

CREATE POLICY "Moderators can view moderation queue"
  ON moderation_queue FOR SELECT
  USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can update moderation queue"
  ON moderation_queue FOR UPDATE
  USING (is_moderator_or_admin(auth.uid()));

-- 4. Update reports policies for moderators
DROP POLICY IF EXISTS "Moderators can view reports" ON moderation_reports;
DROP POLICY IF EXISTS "Moderators can update reports" ON moderation_reports;

CREATE POLICY "Moderators can view reports"
  ON moderation_reports FOR SELECT
  USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can update reports"
  ON moderation_reports FOR UPDATE
  USING (is_moderator_or_admin(auth.uid()));

-- 5. Allow moderators to view all posts (including pending)
DROP POLICY IF EXISTS "Moderators can view all posts" ON community_posts;

CREATE POLICY "Moderators can view all posts"
  ON community_posts FOR SELECT
  USING (
    is_moderator_or_admin(auth.uid()) OR
    moderation_status = 'approved' OR
    author_id = auth.uid()
  );

-- 6. View for moderator dashboard stats
CREATE OR REPLACE VIEW moderator_stats AS
SELECT 
  (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending') as pending_reviews,
  (SELECT COUNT(*) FROM moderation_reports WHERE status = 'open') as open_reports,
  (SELECT COUNT(*) FROM moderation_queue WHERE status = 'approved' AND reviewed_at > NOW() - INTERVAL '24 hours') as approved_today,
  (SELECT COUNT(*) FROM moderation_queue WHERE status = 'rejected' AND reviewed_at > NOW() - INTERVAL '24 hours') as rejected_today,
  (SELECT COUNT(*) FROM moderation_queue WHERE reviewed_by = auth.uid() AND reviewed_at > NOW() - INTERVAL '24 hours') as my_actions_today;

-- 7. Enhanced pending moderation view with more details
CREATE OR REPLACE VIEW pending_moderation_full AS
SELECT 
  mq.*,
  cp.title as post_title,
  cp.description as post_description,
  cp.author_id,
  cp.media_type,
  cp.video_url,
  cp.hero_image,
  cp.created_at as post_created_at,
  p.username as author_username,
  p.handle as author_handle,
  p.verified as author_verified,
  p.verified_type as author_verified_type
FROM moderation_queue mq
JOIN community_posts cp ON mq.post_id = cp.id
LEFT JOIN profiles p ON cp.author_id = p.id
WHERE mq.status = 'pending'
ORDER BY mq.created_at DESC;

-- 8. Function to create moderator user (run this manually for each partner)
-- Usage: SELECT create_moderator('partner@email.com', 'PartnerName', 'partner_handle');
CREATE OR REPLACE FUNCTION create_moderator(
  user_email TEXT,
  user_name TEXT,
  user_handle TEXT
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create auth user
  new_user_id := gen_random_uuid();
  
  -- Note: You need to use Supabase Auth API or Dashboard to create the auth user
  -- This function assumes auth user already exists
  
  -- Create profile with moderator role
  INSERT INTO profiles (id, username, handle, verified, verified_at, verified_type, follower_count)
  VALUES (
    (SELECT id FROM auth.users WHERE email = user_email),
    user_name,
    user_handle,
    TRUE,
    NOW(),
    'moderator',
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    verified = TRUE,
    verified_at = NOW(),
    verified_type = 'moderator';
    
  RETURN (SELECT id FROM auth.users WHERE email = user_email);
END;
$$ LANGUAGE plpgsql;

-- 9. Create partner moderator account (fill in real values)
-- Uncomment and run after creating auth user in Supabase Dashboard:
-- SELECT create_moderator('moderator@partner.com', 'Partner Name', 'partner_handle');
