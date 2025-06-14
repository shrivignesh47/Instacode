/*
  # Fix RLS policies for file upload and post creation

  1. Storage Bucket Setup
    - Ensure media bucket exists with proper configuration
    - Note: Storage policies are managed through Supabase dashboard or API

  2. Posts Table Policies
    - Fix INSERT policy for authenticated users
    - Ensure all other policies exist

  3. Profiles Table Policies
    - Ensure proper policies for foreign key relationships
*/

-- First, ensure the media storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov', 'video/avi']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov', 'video/avi'];

-- Fix posts table policies
-- Drop and recreate the INSERT policy to ensure it works properly
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;

CREATE POLICY "Users can create their own posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify other posts policies exist and are correct
DO $$
BEGIN
  -- Check if SELECT policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Anyone can view posts'
  ) THEN
    CREATE POLICY "Anyone can view posts"
      ON posts
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Check if UPDATE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can update their own posts'
  ) THEN
    CREATE POLICY "Users can update their own posts"
      ON posts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if DELETE policy exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts"
      ON posts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure profiles table has proper policies
DO $$
BEGIN
  -- Check if profiles INSERT policy exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Check if profiles SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles"
      ON profiles
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Check if profiles UPDATE policy exists
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

-- Ensure likes table policies are correct
DO $$
BEGIN
  -- Check if likes policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' AND policyname = 'Anyone can view likes'
  ) THEN
    CREATE POLICY "Anyone can view likes"
      ON likes
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'likes' AND policyname = 'Users can manage their own likes'
  ) THEN
    CREATE POLICY "Users can manage their own likes"
      ON likes
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure comments table policies are correct
DO $$
BEGIN
  -- Check if comments policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Anyone can view comments'
  ) THEN
    CREATE POLICY "Anyone can view comments"
      ON comments
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Users can create comments'
  ) THEN
    CREATE POLICY "Users can create comments"
      ON comments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Users can update their own comments'
  ) THEN
    CREATE POLICY "Users can update their own comments"
      ON comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments"
      ON comments
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;