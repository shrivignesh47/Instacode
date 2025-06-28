/*
  # Fix signup database error

  1. Issues Fixed
    - Remove problematic trigger that causes signup failures
    - Ensure proper RLS policies for user creation
    - Add missing user_overall_stats creation for new users
    
  2. Changes
    - Drop the problematic trigger that creates challenge stats
    - Create a simpler trigger for user_overall_stats
    - Ensure all necessary policies are in place
*/

-- Drop the problematic trigger that might be causing signup failures
DROP TRIGGER IF EXISTS create_user_challenge_stats_trigger ON profiles;

-- Create a simpler trigger to create user_overall_stats for new profiles
CREATE OR REPLACE FUNCTION create_user_overall_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_overall_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user_overall_stats
CREATE TRIGGER create_user_overall_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_overall_stats_for_new_profile();

-- Ensure proper RLS policies for profiles table
-- (These should already exist based on your schema, but let's make sure)

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a single, clear insert policy
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure user_overall_stats has proper policies
DROP POLICY IF EXISTS "Users can create their own overall stats" ON user_overall_stats;

CREATE POLICY "Users can create their own overall stats"
  ON user_overall_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also ensure the service role can insert (for triggers)
CREATE POLICY "Service role can insert overall stats"
  ON user_overall_stats
  FOR INSERT
  TO service_role
  WITH CHECK (true);