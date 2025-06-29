/*
  # Fix search_path in database functions

  1. Changes
    - Update handle_new_user function to explicitly set search_path
    - Update create_user_overall_stats_for_new_profile function to set search_path
    - Update update_profile_follower_counts function to set search_path
    - These changes ensure functions can properly access tables in both public and auth schemas
*/

-- Fix handle_new_user function with explicit search_path
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

-- Fix create_user_overall_stats_for_new_profile function with explicit search_path
CREATE OR REPLACE FUNCTION create_user_overall_stats_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  INSERT INTO public.user_overall_stats (
    user_id,
    total_problems_solved,
    easy_solved,
    medium_solved,
    hard_solved,
    current_streak,
    longest_streak,
    total_points
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_profile_follower_counts function with explicit search_path
CREATE OR REPLACE FUNCTION update_profile_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for followed user
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.followed_id;
    
    -- Increment following count for follower user
    UPDATE public.profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for followed user
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.followed_id;
    
    -- Decrement following count for follower user
    UPDATE public.profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_user_problem_stats function with explicit search_path
CREATE OR REPLACE FUNCTION update_user_problem_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Check if stats exist for this user and problem
  IF EXISTS (SELECT 1 FROM public.user_problem_stats WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id) THEN
    -- Update existing stats
    UPDATE public.user_problem_stats
    SET 
      attempts = attempts + 1,
      solved = CASE WHEN NEW.status = 'accepted' THEN true ELSE solved END,
      best_execution_time_ms = CASE 
        WHEN NEW.status = 'accepted' AND (best_execution_time_ms IS NULL OR NEW.execution_time_ms < best_execution_time_ms)
        THEN NEW.execution_time_ms
        ELSE best_execution_time_ms
      END,
      best_memory_used_mb = CASE 
        WHEN NEW.status = 'accepted' AND (best_memory_used_mb IS NULL OR NEW.memory_used_mb < best_memory_used_mb)
        THEN NEW.memory_used_mb
        ELSE best_memory_used_mb
      END,
      points_earned = CASE 
        WHEN NEW.status = 'accepted' AND solved = false
        THEN (SELECT points FROM public.problems WHERE id = NEW.problem_id)
        ELSE points_earned
      END,
      last_attempted_at = now(),
      updated_at = now()
    WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id;
  ELSE
    -- Create new stats
    INSERT INTO public.user_problem_stats (
      user_id,
      problem_id,
      attempts,
      solved,
      best_execution_time_ms,
      best_memory_used_mb,
      points_earned,
      last_attempted_at
    ) VALUES (
      NEW.user_id,
      NEW.problem_id,
      1,
      NEW.status = 'accepted',
      CASE WHEN NEW.status = 'accepted' THEN NEW.execution_time_ms ELSE NULL END,
      CASE WHEN NEW.status = 'accepted' THEN NEW.memory_used_mb ELSE NULL END,
      CASE WHEN NEW.status = 'accepted' THEN (SELECT points FROM public.problems WHERE id = NEW.problem_id) ELSE 0 END,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_challenge_leaderboard_ranks function with explicit search_path
CREATE OR REPLACE FUNCTION update_challenge_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Update ranks for the affected challenge
  UPDATE public.coding_challenge_leaderboards
  SET rank = ranks.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY challenge_id 
      ORDER BY total_points DESC, problems_solved DESC, problems_attempted ASC
    ) as rank
    FROM public.coding_challenge_leaderboards
    WHERE challenge_id = NEW.challenge_id
  ) ranks
  WHERE coding_challenge_leaderboards.id = ranks.id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_post_counts function with explicit search_path
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
      RETURN OLD;
    END IF;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_updated_at_column function with explicit search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_conversation_on_message function with explicit search_path
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  UPDATE public.conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix mark_messages_as_read function with explicit search_path
CREATE OR REPLACE FUNCTION mark_messages_as_read(conv_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Insert read receipts for unread messages
  INSERT INTO public.message_reads (message_id, user_id, read_at)
  SELECT m.id, user_id, now()
  FROM public.messages m
  WHERE m.conversation_id = conv_id
    AND m.sender_id != user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.message_reads mr 
      WHERE mr.message_id = m.id AND mr.user_id = mark_messages_as_read.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_or_create_conversation function with explicit search_path
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE (participant_1 = user1_id AND participant_2 = user2_id)
     OR (participant_1 = user2_id AND participant_2 = user1_id)
  LIMIT 1;

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1, participant_2, created_at, updated_at)
    VALUES (user1_id, user2_id, now(), now())
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';