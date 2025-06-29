/*
  # Update Default Avatar URL in handle_new_user Function

  1. Changes
    - Updates the default avatar URL in the handle_new_user function
    - Uses a more consistent image URL for new user profiles
    - Ensures all new users get the same default avatar
*/

-- Update the handle_new_user function with the new default avatar URL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  INSERT INTO public.profiles (
    id,
    username,
    email,
    avatar_url,
    bio,
    display_name,
    github_url,
    linkedin_url,
    twitter_url,
    website,
    location,
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
    COALESCE(new.raw_user_meta_data->>'username', split_part(COALESCE(new.email, ''), '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.email, ''),
    'https://ia801307.us.archive.org/1/items/instagram-plain-round/instagram%20dip%20in%20hair.jpg',
    'New developer on InstaCode!',
    COALESCE(new.raw_user_meta_data->>'username', split_part(COALESCE(new.email, ''), '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    '',
    '',
    '',
    '',
    '',
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

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';