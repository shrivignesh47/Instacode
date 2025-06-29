/*
  # Add LeetCode username to profiles table

  1. Changes
    - Create user_ai_access table if it doesn't exist
    - Add policies with conditional checks to avoid duplicates
    - Add trigger for updated_at column
*/

-- Create user_ai_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_ai_access (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_used timestamptz,
  time_remaining integer DEFAULT 180,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_ai_access ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Check if insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_ai_access' AND policyname = 'Users can insert their own AI access'
  ) THEN
    CREATE POLICY "Users can insert their own AI access"
      ON user_ai_access
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_ai_access' AND policyname = 'Users can update their own AI access'
  ) THEN
    CREATE POLICY "Users can update their own AI access"
      ON user_ai_access
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Check if select policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_ai_access' AND policyname = 'Users can view their own AI access'
  ) THEN
    CREATE POLICY "Users can view their own AI access"
      ON user_ai_access
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger to update updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_user_ai_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS update_user_ai_access_updated_at ON user_ai_access;

-- Create trigger
CREATE TRIGGER update_user_ai_access_updated_at
BEFORE UPDATE ON user_ai_access
FOR EACH ROW
EXECUTE FUNCTION update_user_ai_access_updated_at();