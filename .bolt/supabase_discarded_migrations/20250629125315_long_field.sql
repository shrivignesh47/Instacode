/*
  # Fix user_ai_access table and policies

  1. Changes
    - Ensure user_ai_access table exists with proper structure
    - Fix RLS policies to use auth.uid() instead of uid()
    - Add proper trigger for updated_at column
    - Add real-time for the table
*/

-- Create user_ai_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_ai_access (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_used timestamptz,
  time_remaining integer DEFAULT 180, -- 3 minutes in seconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_ai_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own AI access" ON user_ai_access;
DROP POLICY IF EXISTS "Users can update their own AI access" ON user_ai_access;
DROP POLICY IF EXISTS "Users can insert their own AI access" ON user_ai_access;

-- Create policies with auth.uid()
CREATE POLICY "Users can view their own AI access"
  ON user_ai_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI access"
  ON user_ai_access
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI access"
  ON user_ai_access
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_user_ai_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_user_ai_access_updated_at ON user_ai_access;

-- Create trigger
CREATE TRIGGER update_user_ai_access_updated_at
  BEFORE UPDATE ON user_ai_access
  FOR EACH ROW EXECUTE FUNCTION update_user_ai_access_updated_at();

-- Add real-time for the table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_ai_access'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_ai_access;
  END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';