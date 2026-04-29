-- Auto-create profile when user signs up
-- Run this in Supabase SQL Editor

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, handle, verified, follower_count, following_count, early_supporter, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1)),
    FALSE,
    0,
    0,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create profiles for existing users who don't have one
INSERT INTO public.profiles (id, username, handle, verified, follower_count, following_count, early_supporter, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'handle', split_part(au.email, '@', 1)),
  FALSE,
  0,
  0,
  FALSE,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
