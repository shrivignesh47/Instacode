
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
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