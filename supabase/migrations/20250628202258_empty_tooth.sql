/*
  # Fix Signup Errors by Removing References to user_challenge_stats

  1. Problem
    - Signup is failing with error: "relation user_challenge_stats does not exist"
    - This is happening during the user creation process
    - The error occurs in a trigger or function that's trying to access a non-existent table

  2. Solution
    - Drop ALL functions and triggers that might reference user_challenge_stats
    - Ensure handle_new_user function is properly defined
    - Fix profile creation policies
    - Ensure user_overall_stats table and its trigger are correctly set up
*/

-- First, drop ALL functions that might reference user_challenge_stats
DROP FUNCTION IF EXISTS update_user_challenge_stats_on_submission() CASCADE;
DROP FUNCTION IF EXISTS create_user_challenge_stats_for_new_profile() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_challenge_stats() CASCADE;
DROP FUNCTION IF EXISTS initialize_user_challenge_stats() CASCADE;

-- Drop any triggers on auth.users that might be problematic
DROP TRIGGER IF EXISTS on_auth_user_created_challenge_stats ON auth.users;

-- Ensure the user_overall_stats table exists
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

-- Clear out and recreate all policies for user_overall_stats
DROP POLICY IF EXISTS "Anyone can view public overall stats" ON user_overall_stats;
CREATE POLICY "Anyone can view public overall stats" 
  ON user_overall_stats 
  FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Users can view their own overall stats" ON user_overall_stats;
CREATE POLICY "Users can view their own overall stats" 
  ON user_overall_stats 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own overall stats" ON user_overall_stats;
CREATE POLICY "Users can update their own overall stats" 
  ON user_overall_stats 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own overall stats" ON user_overall_stats;
CREATE POLICY "Users can create their own overall stats" 
  ON user_overall_stats 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert overall stats" ON user_overall_stats;
CREATE POLICY "Service role can insert overall stats" 
  ON user_overall_stats 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Create a clean function to create user_overall_stats for new profiles
CREATE OR REPLACE FUNCTION create_user_overall_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple insert with no references to user_challenge_stats
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
    0, -- total_problems_solved
    0, -- easy_solved
    0, -- medium_solved
    0, -- hard_solved
    0, -- current_streak
    0, -- longest_streak
    0  -- total_points
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on profiles
DROP TRIGGER IF EXISTS create_user_overall_stats_trigger ON profiles;
CREATE TRIGGER create_user_overall_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_overall_stats_for_new_profile();

-- Fix the handle_new_user function to ensure it doesn't reference user_challenge_stats
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
    new.email,
    'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
    'New developer on InstaCode!',
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
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