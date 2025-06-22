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
          receive_follow_notifications: boolean;
          receive_message_notifications: boolean;
          receive_post_like_notifications: boolean;
          receive_post_comment_notifications: boolean;
          receive_new_post_from_followed_notifications: boolean;
          leetcode_username: string | null;
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
          receive_follow_notifications?: boolean;
          receive_message_notifications?: boolean;
          receive_post_like_notifications?: boolean;
          receive_post_comment_notifications?: boolean;
          receive_new_post_from_followed_notifications?: boolean;
          leetcode_username?: string | null;
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
          receive_follow_notifications?: boolean;
          receive_message_notifications?: boolean;
          receive_post_like_notifications?: boolean;
          receive_post_comment_notifications?: boolean;
          receive_new_post_from_followed_notifications?: boolean;
          leetcode_username?: string | null;
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
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          type: string;
          entity_id: string | null;
          content: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          sender_id?: string | null;
          type: string;
          entity_id?: string | null;
          content?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          sender_id?: string | null;
          type?: string;
          entity_id?: string | null;
          content?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      // New tables for coding problems and challenges
      problems: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category: string | null;
          tags: string[];
          starter_code: string | null;
          solution_code: string | null;
          time_limit_ms: number;
          memory_limit_mb: number;
          points: number;
          created_by: string;
          is_approved: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string;
          description: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category?: string | null;
          tags?: string[];
          starter_code?: string | null;
          solution_code?: string | null;
          time_limit_ms?: number;
          memory_limit_mb?: number;
          points?: number;
          created_by: string;
          is_approved?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          category?: string | null;
          tags?: string[];
          starter_code?: string | null;
          solution_code?: string | null;
          time_limit_ms?: number;
          memory_limit_mb?: number;
          points?: number;
          created_by?: string;
          is_approved?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      coding_challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          category: string | null;
          tags: string[];
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          category?: string | null;
          tags?: string[];
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          difficulty?: 'easy' | 'medium' | 'hard' | null;
          category?: string | null;
          tags?: string[];
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      coding_challenge_problems: {
        Row: {
          id: string;
          challenge_id: string;
          problem_id: string;
          order_index: number;
          points_multiplier: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          problem_id: string;
          order_index?: number;
          points_multiplier?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          problem_id?: string;
          order_index?: number;
          points_multiplier?: number;
          created_at?: string;
        };
      };
      problem_test_cases: {
        Row: {
          id: string;
          problem_id: string;
          input: string;
          expected_output: string;
          is_sample: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          input: string;
          expected_output: string;
          is_sample?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          problem_id?: string;
          input?: string;
          expected_output?: string;
          is_sample?: boolean;
          order_index?: number;
          created_at?: string;
        };
      };
      problem_submissions: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          challenge_id: string | null;
          code: string;
          language: string;
          status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
          execution_time_ms: number | null;
          memory_used_mb: number | null;
          test_cases_passed: number;
          test_cases_total: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          challenge_id?: string | null;
          code: string;
          language: string;
          status?: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
          execution_time_ms?: number | null;
          memory_used_mb?: number | null;
          test_cases_passed?: number;
          test_cases_total?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          challenge_id?: string | null;
          code?: string;
          language?: string;
          status?: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
          execution_time_ms?: number | null;
          memory_used_mb?: number | null;
          test_cases_passed?: number;
          test_cases_total?: number;
          error_message?: string | null;
          created_at?: string;
        };
      };
      user_problem_stats: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          attempts: number;
          solved: boolean;
          best_execution_time_ms: number | null;
          best_memory_used_mb: number | null;
          points_earned: number;
          last_attempted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          problem_id: string;
          attempts?: number;
          solved?: boolean;
          best_execution_time_ms?: number | null;
          best_memory_used_mb?: number | null;
          points_earned?: number;
          last_attempted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          problem_id?: string;
          attempts?: number;
          solved?: boolean;
          best_execution_time_ms?: number | null;
          best_memory_used_mb?: number | null;
          points_earned?: number;
          last_attempted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_problems: {
        Row: {
          id: string;
          problem_id: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          problem_id?: string;
          date?: string;
          created_at?: string;
        };
      };
      coding_challenge_leaderboards: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          total_points: number;
          problems_solved: number;
          problems_attempted: number;
          rank: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          total_points?: number;
          problems_solved?: number;
          problems_attempted?: number;
          rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          total_points?: number;
          problems_solved?: number;
          problems_attempted?: number;
          rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      problem_imports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_size: number;
          problems_count: number;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_size: number;
          problems_count?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_size?: number;
          problems_count?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
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

// Problem and Challenge helper types
export type ProblemWithUser = Database['public']['Tables']['problems']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  test_cases?: Database['public']['Tables']['problem_test_cases']['Row'][];
  user_stats?: Database['public']['Tables']['user_problem_stats']['Row'];
};

export type CodingChallengeWithUser = Database['public']['Tables']['coding_challenges']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  problems_count?: number;
  participants_count?: number;
};

export type CodingChallengeWithProblems = Database['public']['Tables']['coding_challenges']['Row'] & {
  problems: (Database['public']['Tables']['problems']['Row'] & {
    order_index: number;
    points_multiplier: number;
  })[];
};

export type ProblemSubmissionWithUser = Database['public']['Tables']['problem_submissions']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  problems: Database['public']['Tables']['problems']['Row'];
};

export type CodingChallengeLeaderboardWithUser = Database['public']['Tables']['coding_challenge_leaderboards']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export type DailyProblemWithProblem = Database['public']['Tables']['daily_problems']['Row'] & {
  problems: Database['public']['Tables']['problems']['Row'];
};

export type ProblemImportWithUser = Database['public']['Tables']['problem_imports']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

// Add SQL function for incrementing topic replies
export const createIncrementTopicRepliesFunction = async () => {
  const { error } = await supabase.rpc('create_increment_topic_replies_function');
  if (error) {
    console.log('Function may already exist:', error.message);
  }
};