/*
  # Fix user_ai_access table and policies

  1. Create user_ai_access table if it doesn't exist
  2. Enable RLS
  3. Drop existing policies if they exist
  4. Create new policies with proper auth.uid() checks
  5. Create or replace trigger function
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the insert policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_ai_access' AND policyname = 'Users can insert their own AI access'
  ) THEN
    DROP POLICY "Users can insert their own AI access" ON user_ai_access;
  END IF;

  -- Drop the update policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_ai_access' AND policyname = 'Users can update their own AI access'
  ) THEN
    DROP POLICY "Users can update their own AI access" ON user_ai_access;
  END IF;

  -- Drop the select policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_ai_access' AND policyname = 'Users can view their own AI access'
  ) THEN
    DROP POLICY "Users can view their own AI access" ON user_ai_access;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Users can insert their own AI access"
  ON user_ai_access
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI access"
  ON user_ai_access
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI access"
  ON user_ai_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_user_ai_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_user_ai_access_updated_at ON user_ai_access;

-- Create the trigger
CREATE TRIGGER update_user_ai_access_updated_at
BEFORE UPDATE ON user_ai_access
FOR EACH ROW
EXECUTE FUNCTION update_user_ai_access_updated_at();

-- Add table to realtime publication if needed
ALTER PUBLICATION supabase_realtime ADD TABLE user_ai_access;