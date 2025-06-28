/*
  # Fix signup RLS policies for profiles table

  1. Security Updates
    - Update RLS policies on profiles table to allow proper user creation during signup
    - Add policy to allow service role to insert profiles during signup process
    - Ensure authenticated users can create their own profiles

  2. Changes
    - Drop existing restrictive INSERT policies
    - Add new policies that work with the signup flow
    - Maintain security while allowing proper user creation
*/

-- Drop existing INSERT policies that might be too restrictive
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a new policy that allows users to insert their own profile during signup
CREATE POLICY "Enable insert for authenticated users creating own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow service role to insert profiles (needed for some signup flows)
CREATE POLICY "Enable insert for service role"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure the trigger function exists for creating user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    email,
    avatar_url,
    bio,
    display_name,
    followers_count,
    following_count,
    posts_count,
    receive_follow_notifications,
    receive_message_notifications,
    receive_post_like_notifications,
    receive_post_comment_notifications,
    receive_new_post_from_followed_notifications
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
    'New developer on InstaCode!',
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    0,
    0,
    0,
    true,
    true,
    true,
    true,
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();