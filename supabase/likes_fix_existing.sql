-- Add missing pieces to existing likes table
-- Use this if you get "already exists" errors

-- 1. Ensure RLS is enabled (safe to run even if already enabled)
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 2. Add missing policies (use OR REPLACE or check if exists)
DO $$
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' 
    AND policyname = 'Users can create likes'
  ) THEN
    CREATE POLICY "Users can create likes" 
      ON likes FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' 
    AND policyname = 'Users can delete their own likes'
  ) THEN
    CREATE POLICY "Users can delete their own likes" 
      ON likes FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Enable realtime (safe to run even if already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- 4. Add indexes for performance (will skip if already exist)
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);

-- 5. Verify everything is set up
SELECT 
  'Likes table exists' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'likes') as policy_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'likes') as index_count;
