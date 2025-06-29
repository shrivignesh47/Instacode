/*
  # Fix signup errors and user_challenge_stats issues

  1. New Tables
    - Create `user_challenge_stats` table if it doesn't exist
    - Ensure all related tables exist with proper relationships

  2. Functions
    - Fix or recreate all functions that reference user_challenge_stats
    - Ensure handle_new_user function works properly

  3. Triggers
    - Fix all triggers related to user creation and stats
    - Ensure proper cascade behavior
*/

-- First, create the user_challenge_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_challenge_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL,
  attempts integer DEFAULT 0,
  solved boolean DEFAULT false,
  best_execution_time_ms double precision,
  best_memory_used_mb double precision,
  points_earned integer DEFAULT 0,
  last_attempted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_challenge_stats_user_id_fkey' 
    AND table_name = 'user_challenge_stats'
  ) THEN
    ALTER TABLE user_challenge_stats 
    ADD CONSTRAINT user_challenge_stats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_challenge_stats_challenge_id_fkey' 
    AND table_name = 'user_challenge_stats'
  ) THEN
    ALTER TABLE user_challenge_stats 
    ADD CONSTRAINT user_challenge_stats_challenge_id_fkey 
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on user_challenge_stats
ALTER TABLE user_challenge_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user_challenge_stats
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_challenge_stats' AND policyname = 'Anyone can view challenge stats') THEN
    CREATE POLICY "Anyone can view challenge stats" 
      ON user_challenge_stats 
      FOR SELECT 
      TO public 
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_challenge_stats' AND policyname = 'Users can update their own challenge stats') THEN
    CREATE POLICY "Users can update their own challenge stats" 
      ON user_challenge_stats 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_challenge_stats' AND policyname = 'Users can create their own challenge stats') THEN
    CREATE POLICY "Users can create their own challenge stats" 
      ON user_challenge_stats 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Create trigger for updated_at on user_challenge_stats
DROP TRIGGER IF EXISTS update_user_challenge_stats_updated_at ON user_challenge_stats;
CREATE TRIGGER update_user_challenge_stats_updated_at
  BEFORE UPDATE ON user_challenge_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.email, ''),
    'https://ia801307.us.archive.org/1/items/instagram-plain-round/instagram%20dip%20in%20hair.jpg',
    'New developer on InstaCode!',
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
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

-- Create or replace the create_user_overall_stats_for_new_profile function
CREATE OR REPLACE FUNCTION create_user_overall_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_overall_stats (
    user_id,
    total_problems_solved,
    easy_solved,
    medium_solved,
    hard_solved,
    current_streak,
    longest_streak,
    total_points
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on profiles
DROP TRIGGER IF EXISTS create_user_overall_stats_trigger ON profiles;
CREATE TRIGGER create_user_overall_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_overall_stats_for_new_profile();

-- Fix profile insert policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users creating own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;

-- Create clear policies for profile insertion
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

-- Ensure other profile policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles') THEN
    CREATE POLICY "Users can view all profiles"
      ON profiles
      FOR SELECT
      TO public
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can delete their own profile') THEN
    CREATE POLICY "Users can delete their own profile"
      ON profiles
      FOR DELETE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_challenge_stats_user_id ON user_challenge_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_stats_challenge_id ON user_challenge_stats(challenge_id);
CREATE INDEX IF NOT EXISTS user_challenge_stats_user_id_challenge_id_key ON user_challenge_stats(user_id, challenge_id);

-- Add real-time for user_challenge_stats
ALTER PUBLICATION supabase_realtime ADD TABLE user_challenge_stats;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';