-- Advanced Engagement Features Schema
-- Stories, notifications, enhanced social features

-- ===== STORIES (EPHEMERAL CONTENT) =====
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  user_name TEXT,
  user_handle TEXT,
  user_avatar TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  viewed_by UUID[] DEFAULT '{}'
);

-- Auto-cleanup expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run cleanup every hour (you can schedule this with pg_cron or trigger)
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_stories_user ON stories(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are viewable by everyone"
  ON stories FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories (view tracking)"
  ON stories FOR UPDATE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stories;

-- ===== NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'share', 'build_complete')),
  actor_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  post_title TEXT,
  comment_text TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, read) WHERE read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications (mark read)"
  ON notifications FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (TRUE);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to auto-create notification on like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner UUID;
BEGIN
  -- Get post owner
  SELECT author_id INTO post_owner
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if liking own post
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO notifications (recipient_id, type, actor_id, post_id)
    VALUES (post_owner, 'like', NEW.user_id, NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for like notifications
DROP TRIGGER IF EXISTS on_like_notification ON likes;
CREATE TRIGGER on_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Function to auto-create notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner UUID;
  mentioned_users TEXT[];
  handle TEXT;
BEGIN
  -- Get post owner
  SELECT author_id INTO post_owner
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Notify post owner (if not commenter)
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO notifications (recipient_id, type, actor_id, post_id, comment_text)
    VALUES (post_owner, 'comment', NEW.user_id, NEW.post_id, NEW.text);
  END IF;
  
  -- Extract mentions
  mentioned_users := regexp_matches(NEW.text, '@(\w+)', 'g');
  
  -- Notify mentioned users
  FOREACH handle IN ARRAY mentioned_users
  LOOP
    INSERT INTO notifications (recipient_id, type, actor_id, post_id, comment_text)
    SELECT p.id, 'mention', NEW.user_id, NEW.post_id, NEW.text
    FROM profiles p
    WHERE p.handle = handle
    AND p.id != NEW.user_id
    AND p.id != post_owner; -- Don't double-notify
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment notifications
DROP TRIGGER IF EXISTS on_comment_notification ON comments;
CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ===== VIEWS TRACKING (for engagement rate) =====
CREATE TABLE IF NOT EXISTS post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  viewer_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, viewer_ip)
);

CREATE INDEX idx_post_views_post ON post_views(post_id);

-- Enable RLS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create view records"
  ON post_views FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Only system can read view counts"
  ON post_views FOR SELECT USING (FALSE);

-- Function to get post engagement stats
CREATE OR REPLACE FUNCTION get_post_engagement_stats(post_uuid TEXT)
RETURNS TABLE (
  views BIGINT,
  unique_viewers BIGINT,
  engagement_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as views,
    COUNT(DISTINCT COALESCE(user_id::TEXT, viewer_ip))::BIGINT as unique_viewers,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ((SELECT COUNT(*) FROM likes WHERE post_id = post_uuid) +
         (SELECT COUNT(*) FROM comments WHERE post_id = post_uuid) * 3 +
         (SELECT COUNT(*) FROM shares WHERE post_id = post_uuid) * 5)::NUMERIC / COUNT(*)
      ELSE 0
    END as engagement_rate
  FROM post_views
  WHERE post_id = post_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
