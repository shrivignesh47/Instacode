/*
  # Add LeetCode username to profiles table

  1. Changes
    - Add leetcode_username column to profiles table
    - This allows users to connect their LeetCode accounts
    - Enables LeetCode stats integration in user profiles
*/

-- Add leetcode_username column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS leetcode_username TEXT DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_leetcode_username ON profiles(leetcode_username);

-- Update RLS policies to ensure they apply to the new column
DO $$
BEGIN
  -- Check if profiles UPDATE policy exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;