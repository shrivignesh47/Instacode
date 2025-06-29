-- First, ensure the user_overall_stats table exists
CREATE TABLE IF NOT EXISTS user_overall_stats (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_problems_solved integer DEFAULT 0,
  easy_solved integer DEFAULT 0,
  medium_solved integer DEFAULT 0,
  hard_solved integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_solved_date date,
  total_points integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_overall_stats
ALTER TABLE user_overall_stats ENABLE ROW LEVEL SECURITY;

-- Fix the create_user_overall_stats_for_new_profile function with explicit schema reference
CREATE OR REPLACE FUNCTION create_user_overall_stats_for_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  schema_name text := 'public';
BEGIN
  -- Explicitly set search_path to ensure the function can find the table
  EXECUTE 'SET search_path TO ' || schema_name;
  
  -- Use explicit schema reference for the table
  EXECUTE format('
    INSERT INTO %I.user_overall_stats (
      user_id,
      total_problems_solved,
      easy_solved,
      medium_solved,
      hard_solved,
      current_streak,
      longest_streak,
      total_points
    ) VALUES (
      $1,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ) ON CONFLICT (user_id) DO NOTHING', schema_name)
  USING NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on profiles
DROP TRIGGER IF EXISTS create_user_overall_stats_trigger ON profiles;
CREATE TRIGGER create_user_overall_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_overall_stats_for_new_profile();

-- Ensure proper RLS policies for user_overall_stats
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view public overall stats" ON user_overall_stats;
  DROP POLICY IF EXISTS "Users can view their own overall stats" ON user_overall_stats;
  DROP POLICY IF EXISTS "Users can update their own overall stats" ON user_overall_stats;
  DROP POLICY IF EXISTS "Users can create their own overall stats" ON user_overall_stats;
  DROP POLICY IF EXISTS "Service role can insert overall stats" ON user_overall_stats;
  
  -- Create fresh policies
  CREATE POLICY "Anyone can view public overall stats" 
    ON user_overall_stats 
    FOR SELECT 
    TO public 
    USING (true);
    
  CREATE POLICY "Users can view their own overall stats" 
    ON user_overall_stats 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can update their own overall stats" 
    ON user_overall_stats 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can create their own overall stats" 
    ON user_overall_stats 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Service role can insert overall stats" 
    ON user_overall_stats 
    FOR INSERT 
    TO service_role 
    WITH CHECK (true);
END$$;

-- Fix the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert with more careful handling of NULL values
  INSERT INTO public.profiles (
    id,
    username,
    email,
    avatar_url,
    bio,
    display_name,
    github_url,
    linkedin_url,
    twitter_url,
    website,
    location,
    followers_count,
    following_count,
    posts_count,
    receive_follow_notifications,
    receive_message_notifications,
    receive_post_like_notifications,
    receive_post_comment_notifications,
    receive_new_post_from_followed_notifications
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(COALESCE(new.email, ''), '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.email, ''),
    'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
    'New developer on InstaCode!',
    COALESCE(new.raw_user_meta_data->>'username', split_part(COALESCE(new.email, ''), '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    '',
    '',
    '',
    '',
    '',
    0,
    0,
    0,
    true,
    true,
    true,
    true,
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix profile insert policies
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for authenticated users creating own profile" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;
  
  -- Create fresh policies
  CREATE POLICY "Enable insert for authenticated users creating own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
    
  CREATE POLICY "Enable insert for service role"
    ON profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);
END$$;

-- Ensure the updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_overall_stats updated_at
DROP TRIGGER IF EXISTS update_user_overall_stats_updated_at ON user_overall_stats;
CREATE TRIGGER update_user_overall_stats_updated_at
  BEFORE UPDATE ON user_overall_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';