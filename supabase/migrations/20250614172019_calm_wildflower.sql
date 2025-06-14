/*
  # Create Real-time Messaging System

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant_1` (uuid, foreign key to profiles)
      - `participant_2` (uuid, foreign key to profiles)
      - `last_message_id` (uuid, foreign key to messages)
      - `last_message_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_id` (uuid, foreign key to profiles)
      - `content` (text, message content)
      - `message_type` (text, type: text, post_share, image, file)
      - `shared_post_id` (uuid, foreign key to posts, nullable)
      - `file_url` (text, for file attachments)
      - `is_read` (boolean, read status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `message_reads`
      - `id` (uuid, primary key)
      - `message_id` (uuid, foreign key to messages)
      - `user_id` (uuid, foreign key to profiles)
      - `read_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for participants to access their conversations
    - Add policies for message management

  3. Functions
    - Function to create or get conversation between two users
    - Function to mark messages as read
    - Function to get unread message count
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_id uuid,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 != participant_2)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'post_share', 'image', 'file')),
  shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  file_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create message_reads table for tracking read status
CREATE TABLE IF NOT EXISTS message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Add foreign key constraint for last_message_id
ALTER TABLE conversations 
ADD CONSTRAINT conversations_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Message reads policies
CREATE POLICY "Users can view message reads in their conversations"
  ON message_reads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_id 
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Ensure consistent ordering of participants
  IF user1_id > user2_id THEN
    SELECT user1_id, user2_id INTO user2_id, user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (participant_1 = user1_id AND participant_2 = user2_id)
     OR (participant_1 = user2_id AND participant_2 = user1_id);

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO message_reads (message_id, user_id)
  VALUES (message_id, user_id)
  ON CONFLICT (message_id, user_id) DO NOTHING;
  
  -- Update message read status if this is the recipient
  UPDATE messages 
  SET is_read = true 
  WHERE id = message_id AND sender_id != user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id uuid)
RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unread_count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.participant_1 = user_id OR c.participant_2 = user_id)
    AND m.sender_id != user_id
    AND m.is_read = false;
    
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is sent
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS conversations_participant_1_idx ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS conversations_participant_2_idx ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS message_reads_message_id_idx ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS message_reads_user_id_idx ON message_reads(user_id);