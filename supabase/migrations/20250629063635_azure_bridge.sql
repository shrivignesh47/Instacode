-- First drop the existing function to avoid return type error
DROP FUNCTION IF EXISTS create_notification(uuid, uuid, text, uuid, text);

-- Create notification function with explicit schema reference
CREATE OR REPLACE FUNCTION create_notification(
  recipient_id uuid,
  sender_id uuid,
  notification_type text,
  entity_id uuid,
  content_text text
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
  recipient_settings record;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Get recipient notification settings
  SELECT 
    receive_follow_notifications,
    receive_message_notifications,
    receive_post_like_notifications,
    receive_post_comment_notifications,
    receive_new_post_from_followed_notifications
  INTO recipient_settings
  FROM public.profiles
  WHERE id = recipient_id;
  
  -- Check if the user wants to receive this type of notification
  IF (notification_type = 'follow' AND recipient_settings.receive_follow_notifications = false) OR
     (notification_type = 'message' AND recipient_settings.receive_message_notifications = false) OR
     (notification_type = 'post_like' AND recipient_settings.receive_post_like_notifications = false) OR
     (notification_type = 'post_comment' AND recipient_settings.receive_post_comment_notifications = false) OR
     (notification_type = 'new_post_from_followed' AND recipient_settings.receive_new_post_from_followed_notifications = false) THEN
    RETURN NULL;
  END IF;
  
  -- Don't create notifications for self-actions
  IF recipient_id = sender_id THEN
    RETURN NULL;
  END IF;
  
  -- Insert notification
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    type,
    entity_id,
    content,
    is_read
  ) VALUES (
    recipient_id,
    sender_id,
    notification_type,
    entity_id,
    content_text,
    false
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing notification functions to avoid conflicts
DROP FUNCTION IF EXISTS notify_new_follower() CASCADE;
DROP FUNCTION IF EXISTS notify_new_message() CASCADE;
DROP FUNCTION IF EXISTS notify_post_like() CASCADE;
DROP FUNCTION IF EXISTS notify_post_comment() CASCADE;
DROP FUNCTION IF EXISTS notify_new_post_from_followed() CASCADE;

-- Create function for new follower notifications
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  sender_username text;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM public.profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification
  PERFORM create_notification(
    NEW.followed_id,
    NEW.follower_id,
    'follow',
    NEW.follower_id,
    sender_username || ' started following you'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  sender_username text;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Get conversation participants
  SELECT 
    CASE 
      WHEN c.participant_1 = NEW.sender_id THEN c.participant_2
      ELSE c.participant_1
    END INTO recipient_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM public.profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification
  PERFORM create_notification(
    recipient_id,
    NEW.sender_id,
    'message',
    NEW.conversation_id,
    sender_username || ' sent you a message'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for post like notifications
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  sender_username text;
  post_title text;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Get post title/content
  SELECT COALESCE(project_title, SUBSTRING(content, 1, 30)) INTO post_title
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Create notification
  PERFORM create_notification(
    post_owner_id,
    NEW.user_id,
    'post_like',
    NEW.post_id,
    sender_username || ' liked your post: ' || post_title
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for post comment notifications
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  sender_username text;
  post_title text;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Get post owner
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Get post title/content
  SELECT COALESCE(project_title, SUBSTRING(content, 1, 30)) INTO post_title
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Create notification
  PERFORM create_notification(
    post_owner_id,
    NEW.user_id,
    'post_comment',
    NEW.post_id,
    sender_username || ' commented on your post: ' || post_title
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for new post from followed user notifications
CREATE OR REPLACE FUNCTION notify_new_post_from_followed()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  sender_username text;
  post_title text;
BEGIN
  -- Set search_path to include both public and auth schemas
  SET search_path TO public, auth;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Get post title/content
  SELECT COALESCE(project_title, SUBSTRING(content, 1, 30)) INTO post_title
  FROM public.posts
  WHERE id = NEW.id;
  
  -- Create notification for each follower
  FOR follower_record IN 
    SELECT follower_id 
    FROM public.followers 
    WHERE followed_id = NEW.user_id
  LOOP
    PERFORM create_notification(
      follower_record.follower_id,
      NEW.user_id,
      'new_post_from_followed',
      NEW.id,
      sender_username || ' shared a new post: ' || post_title
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_notify_new_follower ON followers;
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
DROP TRIGGER IF EXISTS trigger_notify_post_like ON likes;
DROP TRIGGER IF EXISTS trigger_notify_post_comment ON comments;
DROP TRIGGER IF EXISTS trigger_notify_new_post_from_followed ON posts;

-- Create triggers for notifications
CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON followers
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER trigger_notify_post_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_post_like();

CREATE TRIGGER trigger_notify_post_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

CREATE TRIGGER trigger_notify_new_post_from_followed
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION notify_new_post_from_followed();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  entity_id uuid,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = recipient_id);

-- Fixed: Replace role() with auth.role() for Supabase
CREATE POLICY "Users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = sender_id) OR (auth.role() = 'service_role'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- Add real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';