/*
  # User AI Access Table

  1. New Tables
    - `user_ai_access` - Stores user AI usage information
      - `user_id` (uuid, primary key)
      - `last_used` (timestamptz)
      - `time_remaining` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `user_ai_access` table
    - Add policies for authenticated users to manage their own AI access
  3. Changes
    - Add trigger for updating the updated_at column
    - Conditionally add table to realtime publication
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

-- Check if table is already in the publication before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_ai_access'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_ai_access;
  END IF;
END $$;