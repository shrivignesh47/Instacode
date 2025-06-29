/*
  # Create user_ai_access table

  1. New Tables
    - `user_ai_access`
      - `user_id` (uuid, primary key)
      - `last_used` (timestamp)
      - `time_remaining` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `user_ai_access` table
    - Add policies for authenticated users to manage their own AI access
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

-- Create policies
CREATE POLICY "Users can insert their own AI access"
  ON user_ai_access
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update their own AI access"
  ON user_ai_access
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Users can view their own AI access"
  ON user_ai_access
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_user_ai_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_ai_access_updated_at
BEFORE UPDATE ON user_ai_access
FOR EACH ROW
EXECUTE FUNCTION update_user_ai_access_updated_at();