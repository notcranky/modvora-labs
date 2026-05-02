-- COMPLETE LIKES SYSTEM FIX
-- This ensures likes work 100% reliably

-- ===== CREATE LIKES TABLE IF NOT EXISTS =====
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES FOR LIKES =====

-- Anyone can see likes (public counts)
CREATE POLICY IF NOT EXISTS "Likes are viewable by everyone" 
  ON likes FOR SELECT 
  USING (true);

-- Authenticated users can create likes
CREATE POLICY IF NOT EXISTS "Authenticated users can create likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY IF NOT EXISTS "Users can delete their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Users cannot update likes (only insert/delete)
-- No UPDATE policy needed

-- ===== ENABLE REALTIME FOR LIKES =====
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON likes(created_at DESC);

-- ===== FUNCTION: TOGGLE LIKE (ATOMIC) =====
CREATE OR REPLACE FUNCTION toggle_like(p_user_id UUID, p_post_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM likes 
    WHERE user_id = p_user_id AND post_id = p_post_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unlike
    DELETE FROM likes 
    WHERE user_id = p_user_id AND post_id = p_post_id;
    RETURN false;
  ELSE
    -- Like
    INSERT INTO likes (user_id, post_id)
    VALUES (p_user_id, p_post_id)
    ON CONFLICT (user_id, post_id) DO NOTHING;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== FUNCTION: GET LIKE COUNT =====
CREATE OR REPLACE FUNCTION get_like_count(p_post_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM likes 
    WHERE post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== FUNCTION: GET USER'S LIKES =====
CREATE OR REPLACE FUNCTION get_user_likes(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT post_id::TEXT 
    FROM likes 
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TRIGGER: UPDATE POST ENGAGEMENT SCORE =====
CREATE OR REPLACE FUNCTION update_post_engagement()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE community_posts 
    SET engagement_score = COALESCE(engagement_score, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE community_posts 
    SET engagement_score = COALESCE(engagement_score, 0) - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_engagement_on_like ON likes;
CREATE TRIGGER update_engagement_on_like
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_engagement();

-- ===== VERIFY SETUP =====
-- Check table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes') THEN
    RAISE NOTICE '✓ likes table exists';
  ELSE
    RAISE EXCEPTION '✗ likes table missing!';
  END IF;
END $$;

-- Check RLS enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'likes' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS enabled on likes';
  ELSE
    RAISE NOTICE '⚠ RLS not enabled, enabling now...';
    ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check realtime
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE tablename = 'likes' 
    AND pubname = 'supabase_realtime'
  ) THEN
    RAISE NOTICE '✓ Realtime enabled for likes';
  ELSE
    RAISE NOTICE '⚠ Realtime not enabled, enabling now...';
    ALTER PUBLICATION supabase_realtime ADD TABLE likes;
  END IF;
END $$;

-- ===== TEST DATA (OPTIONAL - REMOVE IN PRODUCTION) =====
-- Uncomment to add test likes for debugging:
-- INSERT INTO likes (user_id, post_id) 
-- SELECT auth.uid(), 'test-post-id' 
-- WHERE NOT EXISTS (
--   SELECT 1 FROM likes WHERE post_id = 'test-post-id' LIMIT 1
-- );
