/*
  # Add followers count triggers and functions

  1. New Functions
    - `update_profile_follower_counts` - Updates follower and following counts when followers table changes

  2. Triggers
    - `increment_follower_counts` - Trigger to increment counts when a follow relationship is created
    - `decrement_follower_counts` - Trigger to decrement counts when a follow relationship is deleted

  3. Changes
    - Adds real-time follower and following count updates
    - Ensures counts are always accurate
*/

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_profile_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for followed user
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.followed_id;
    
    -- Increment following count for follower user
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for followed user
    UPDATE profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.followed_id;
    
    -- Decrement following count for follower user
    UPDATE profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to increment follower counts
CREATE TRIGGER increment_follower_counts
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_follower_counts();

-- Create trigger to decrement follower counts
CREATE TRIGGER decrement_follower_counts
  AFTER DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_follower_counts();

-- Create followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS followers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  followed_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, followed_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_followed ON followers(followed_id);

-- Enable RLS on followers table
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Create policies for followers table
DO $$
BEGIN
  -- Check if policies exist, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'followers' AND policyname = 'Users can follow others'
  ) THEN
    CREATE POLICY "Users can follow others"
      ON followers
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'followers' AND policyname = 'Users can unfollow others'
  ) THEN
    CREATE POLICY "Users can unfollow others"
      ON followers
      FOR DELETE
      TO authenticated
      USING (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'followers' AND policyname = 'Anyone can view followers'
  ) THEN
    CREATE POLICY "Anyone can view followers"
      ON followers
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;