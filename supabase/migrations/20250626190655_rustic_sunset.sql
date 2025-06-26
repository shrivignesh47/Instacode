/*
  # Add User AI Access Control Table

  1. New Table
    - `user_ai_access` - Tracks user access to AI features
      - `user_id` (uuid, primary key, references profiles)
      - `last_used` (timestamp, when the user last used the AI)
      - `time_remaining` (integer, seconds remaining in their daily quota)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for user access control
*/

-- Create user_ai_access table
CREATE TABLE IF NOT EXISTS user_ai_access (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_used timestamptz,
  time_remaining integer DEFAULT 180, -- 3 minutes in seconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_ai_access ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Trigger for updated_at
CREATE TRIGGER update_user_ai_access_updated_at
  BEFORE UPDATE ON user_ai_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE user_ai_access;