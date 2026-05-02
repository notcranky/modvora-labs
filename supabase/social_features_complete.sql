-- Complete Social Features Schema
-- Adds shares tracking and real-time capabilities

-- ===== SHARES TABLE =====
CREATE TABLE IF NOT EXISTS shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  platform TEXT, -- 'copy_link', 'twitter', 'facebook', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, post_id, platform)
);

-- Enable RLS
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Shares policies
CREATE POLICY IF NOT EXISTS "Anyone can create shares"
  ON shares FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can view share counts"
  ON shares FOR SELECT
  USING (true);

-- ===== REALTIME SUBSCRIPTIONS =====
-- Enable realtime for likes, comments, and shares
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE shares;

-- ===== FUNCTIONS FOR SOCIAL STATS =====

-- Get like count for a single post
CREATE OR REPLACE FUNCTION get_post_like_count(post_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM likes WHERE post_id = post_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get comment count for a single post  
CREATE OR REPLACE FUNCTION get_post_comment_count(post_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM comments WHERE post_id = post_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get share count for a single post
CREATE OR REPLACE FUNCTION get_post_share_count(post_uuid TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM shares WHERE post_id = post_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== VIEWS FOR EFFICIENT LOOKUPS =====

-- View: Post stats (likes, comments, shares)
CREATE OR REPLACE VIEW post_stats AS
SELECT 
  p.id as post_id,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT c.id) as comments_count,
  COUNT(DISTINCT s.id) as shares_count
FROM community_posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN shares s ON p.id = s.post_id
WHERE p.published = true
GROUP BY p.id;

-- Function: Get stats for multiple posts at once
CREATE OR REPLACE FUNCTION get_posts_stats(post_ids TEXT[])
RETURNS TABLE (
  post_id TEXT,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COUNT(DISTINCT l.id),
    COUNT(DISTINCT c.id),
    COUNT(DISTINCT s.id)
  FROM community_posts p
  LEFT JOIN likes l ON p.id = l.post_id
  LEFT JOIN comments c ON p.id = c.post_id
  LEFT JOIN shares s ON p.id = s.post_id
  WHERE p.id = ANY(post_ids)
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_post_id ON shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_stats_lookup ON likes(post_id);
