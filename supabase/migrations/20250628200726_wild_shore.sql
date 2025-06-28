/*
  # Drop Obsolete Database Function

  1. Changes
    - Drop the `update_user_challenge_stats_on_submission` function that's causing signup errors
    - This function is referencing the non-existent `user_challenge_stats` table
    - The function has been replaced by newer functions in the updated schema
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
END$$;