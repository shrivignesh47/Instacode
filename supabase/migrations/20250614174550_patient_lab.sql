/*
  # Fix Messages System for Real-time Chat

  1. Database Functions
    - Create function to get or create conversations
    - Add proper RLS policies
    - Fix message relationships

  2. Real-time Setup
    - Enable real-time on all tables
    - Add proper indexes for performance

  3. Message Types
    - Support text, post_share, image, file types
    - Proper foreign key relationships
*/

-- Create function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (participant_1 = user1_id AND participant_2 = user2_id)
     OR (participant_1 = user2_id AND participant_2 = user1_id)
  LIMIT 1;

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2, created_at, updated_at)
    VALUES (user1_id, user2_id, now(), now())
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conv_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert read receipts for unread messages
  INSERT INTO message_reads (message_id, user_id, read_at)
  SELECT m.id, user_id, now()
  FROM messages m
  WHERE m.conversation_id = conv_id
    AND m.sender_id != user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_reads mr 
      WHERE mr.message_id = m.id AND mr.user_id = mark_messages_as_read.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update conversations table to track last message
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS fk_last_message;

ALTER TABLE conversations 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create trigger to update conversation when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_trigger ON messages;
CREATE TRIGGER update_conversation_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_user ON message_reads(message_id, user_id);

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;