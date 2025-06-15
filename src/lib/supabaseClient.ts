import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          website: string | null;
          location: string | null;
          followers_count: number;
          following_count: number;
          posts_count: number;
          verified: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          website?: string | null;
          location?: string | null;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          website?: string | null;
          location?: string | null;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          type: 'code' | 'image' | 'video' | 'project';
          content: string;
          tags: string[];
          code_language: string | null;
          code_content: string | null;
          project_title: string | null;
          project_description: string | null;
          project_live_url: string | null;
          project_github_url: string | null;
          project_tech_stack: string[];
          media_url: string | null;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'code' | 'image' | 'video' | 'project';
          content: string;
          tags?: string[];
          code_language?: string | null;
          code_content?: string | null;
          project_title?: string | null;
          project_description?: string | null;
          project_live_url?: string | null;
          project_github_url?: string | null;
          project_tech_stack?: string[];
          media_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'code' | 'image' | 'video' | 'project';
          content?: string;
          tags?: string[];
          code_language?: string | null;
          code_content?: string | null;
          project_title?: string | null;
          project_description?: string | null;
          project_live_url?: string | null;
          project_github_url?: string | null;
          project_tech_stack?: string[];
          media_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'post_share' | 'image' | 'file';
          shared_post_id: string | null;
          media_url: string | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'post_share' | 'image' | 'file';
          shared_post_id?: string | null;
          media_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'post_share' | 'image' | 'file';
          shared_post_id?: string | null;
          media_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      followers: {
        Row: {
          id: string;
          follower_id: string;
          followed_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          followed_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          followed_id?: string;
          created_at?: string;
        };
      };
      forums: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          color: string;
          members_count: number;
          topics_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          color?: string;
          members_count?: number;
          topics_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          color?: string;
          members_count?: number;
          topics_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      forum_members: {
        Row: {
          id: string;
          forum_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          forum_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          forum_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      forum_topics: {
        Row: {
          id: string;
          forum_id: string;
          user_id: string;
          title: string;
          content: string;
          tags: string[];
          is_pinned: boolean;
          replies_count: number;
          views_count: number;
          last_activity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          forum_id: string;
          user_id: string;
          title: string;
          content: string;
          tags?: string[];
          is_pinned?: boolean;
          replies_count?: number;
          views_count?: number;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          forum_id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          tags?: string[];
          is_pinned?: boolean;
          replies_count?: number;
          views_count?: number;
          last_activity?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      forum_replies: {
        Row: {
          id: string;
          topic_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper types for posts with user information
export type PostWithUser = Database['public']['Tables']['posts']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  user_liked?: boolean;
};

export type CommentWithUser = Database['public']['Tables']['comments']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

// Forum helper types
export type ForumWithMembership = Database['public']['Tables']['forums']['Row'] & {
  is_member?: boolean;
};

export type ForumTopicWithUser = Database['public']['Tables']['forum_topics']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export type ForumReplyWithUser = Database['public']['Tables']['forum_replies']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

// Add SQL function for incrementing topic replies
export const createIncrementTopicRepliesFunction = async () => {
  const { error } = await supabase.rpc('create_increment_topic_replies_function');
  if (error) {
    console.log('Function may already exist:', error.message);
  }
};