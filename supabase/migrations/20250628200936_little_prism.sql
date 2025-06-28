/*
  # Drop Obsolete Database Function

  1. Changes
    - Drop the `update_user_challenge_stats_on_submission` function that's causing signup errors
    - Drop any triggers that might be using this function
    - Ensure the `user_overall_stats` table exists and has proper RLS policies
    - Fix any other related issues that might be causing signup failures
*/

-- Drop the obsolete function that's causing signup errors
DROP FUNCTION IF EXISTS update_user_challenge_stats_on_submission();

-- Also drop any potential triggers that might be using this function
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname, relname
        FROM pg_trigger
        JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
        WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'update_user_challenge_stats_on_submission')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 
                      trigger_record.tgname, 
                      trigger_record.relname);
    END LOOP;
END$$;

-- Drop any other problematic functions or triggers
DROP FUNCTION IF EXISTS create_user_challenge_stats_for_new_profile() CASCADE;

-- Ensure the user_overall_stats table exists (it's referenced in previous migrations)
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

-- Enable RLS on the table if it exists
ALTER TABLE user_overall_stats ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_overall_stats' AND policyname = 'Anyone can view public overall stats') THEN
    CREATE POLICY "Anyone can view public overall stats" 
      ON user_overall_stats 
      FOR SELECT 
      TO public 
      USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_overall_stats' AND policyname = 'Users can view their own overall stats') THEN
    CREATE POLICY "Users can view their own overall stats" 
      ON user_overall_stats 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_overall_stats' AND policyname = 'Users can update their own overall stats') THEN
    CREATE POLICY "Users can update their own overall stats" 
      ON user_overall_stats 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_overall_stats' AND policyname = 'Users can create their own overall stats') THEN
    CREATE POLICY "Users can create their own overall stats" 
      ON user_overall_stats 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_overall_stats' AND policyname = 'Service role can insert overall stats') THEN
    CREATE POLICY "Service role can insert overall stats" 
      ON user_overall_stats 
      FOR INSERT 
      TO service_role 
      WITH CHECK (true);
  END IF;
END$$;

-- Fix profile insert policies to ensure signup works properly
DO $$
BEGIN
  -- Drop potentially conflicting policies
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for authenticated users creating own profile" ON profiles;
  
  -- Create clear policies for profile insertion
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable insert for authenticated users creating own profile') THEN
    CREATE POLICY "Enable insert for authenticated users creating own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable insert for service role') THEN
    CREATE POLICY "Enable insert for service role"
      ON profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END$$;

-- Ensure the trigger function exists for creating user_overall_stats
CREATE OR REPLACE FUNCTION create_user_overall_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_overall_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user_overall_stats when profile is created
DROP TRIGGER IF EXISTS create_user_overall_stats_trigger ON profiles;
CREATE TRIGGER create_user_overall_stats_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_overall_stats_for_new_profile();