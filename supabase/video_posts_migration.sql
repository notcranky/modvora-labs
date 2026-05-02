-- Video Posts + Automated Moderation System
-- Run this in Supabase SQL Editor

-- 1. Extend community_posts to support videos
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'mixed'));
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS video_duration INTEGER; -- seconds

-- 2. Moderation status tracking
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected'));
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderation_score NUMERIC(4,3); -- 0.000 to 1.000 (AI confidence)
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users;

-- 3. Create moderation queue table for flagged content
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  flagged_by TEXT NOT NULL, -- 'ai', 'report', 'system'
  reason TEXT NOT NULL,
  ai_score NUMERIC(4,3),
  ai_categories JSONB, -- ['nsfw', 'violence', 'spam', etc]
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Create moderation reports table (users reporting content)
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users,
  reporter_ip TEXT, -- for anonymous reports
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON community_posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_media_type ON community_posts(media_type);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_post ON moderation_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);

-- 6. Create function to auto-flag posts based on AI score
CREATE OR REPLACE FUNCTION auto_moderate_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve images (for now, videos get flagged for review)
  IF NEW.media_type = 'image' OR NEW.media_type IS NULL THEN
    NEW.moderation_status := 'approved';
    NEW.moderated_at := NOW();
  ELSIF NEW.media_type = 'video' THEN
    -- Videos always go to moderation queue initially
    NEW.moderation_status := 'pending';
    
    -- Insert into moderation queue
    INSERT INTO moderation_queue (post_id, flagged_by, reason, status)
    VALUES (NEW.id, 'system', 'New video upload requires review', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for auto-moderation
DROP TRIGGER IF EXISTS auto_moderate_post_trigger ON community_posts;
CREATE TRIGGER auto_moderate_post_trigger
  BEFORE INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_moderate_post();

-- 8. RLS policies for moderation queue (admin only)
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view moderation queue"
  ON moderation_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (verified_type = 'admin' OR verified = TRUE)
    )
  );

CREATE POLICY "Only admins can update moderation queue"
  ON moderation_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (verified_type = 'admin' OR verified = TRUE)
    )
  );

CREATE POLICY "Users can create reports"
  ON moderation_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view reports"
  ON moderation_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (verified_type = 'admin' OR verified = TRUE)
    )
  );

-- 9. View for pending moderation (admin dashboard)
CREATE OR REPLACE VIEW pending_moderation AS
SELECT 
  mq.*,
  cp.title as post_title,
  cp.author_id,
  cp.media_type,
  cp.video_url,
  cp.created_at as post_created_at
FROM moderation_queue mq
JOIN community_posts cp ON mq.post_id = cp.id
WHERE mq.status = 'pending'
ORDER BY mq.created_at DESC;

-- 10. Function to approve/reject content (admin action)
CREATE OR REPLACE FUNCTION moderate_content(
  queue_id UUID,
  action TEXT, -- 'approve' or 'reject'
  admin_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update moderation queue
  UPDATE moderation_queue
  SET 
    status = action,
    reviewed_by = admin_id,
    reviewed_at = NOW(),
    notes = COALESCE(notes, notes)
  WHERE id = queue_id;
  
  -- Update the post status
  UPDATE community_posts
  SET 
    moderation_status = action,
    moderated_at = NOW(),
    moderated_by = admin_id
  WHERE id = (SELECT post_id FROM moderation_queue WHERE id = queue_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Storage bucket for videos (requires Supabase Storage setup)
-- Note: Create bucket via Supabase Dashboard or API
-- Bucket name: 'videos'
-- Public: false (require auth)
-- Allowed mime types: video/mp4, video/quicktime, video/webm
-- Max file size: 100MB

-- 12. Function to check if user can view post (must be approved or owner)
CREATE OR REPLACE FUNCTION can_view_post(post_id TEXT, viewer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  post_record RECORD;
BEGIN
  SELECT moderation_status, author_id INTO post_record
  FROM community_posts WHERE id = post_id;
  
  -- If no post found, deny
  IF post_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Always allow if approved
  IF post_record.moderation_status = 'approved' THEN
    RETURN TRUE;
  END IF;
  
  -- Allow owner to view their own pending/rejected posts
  IF post_record.author_id = viewer_id THEN
    RETURN TRUE;
  END IF;
  
  -- Allow admins to view all
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = viewer_id 
    AND (verified_type = 'admin' OR verified = TRUE)
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Update existing posts to approved status (backward compatibility)
UPDATE community_posts 
SET moderation_status = 'approved', 
    moderated_at = NOW() 
WHERE moderation_status IS NULL OR moderation_status = 'pending';
