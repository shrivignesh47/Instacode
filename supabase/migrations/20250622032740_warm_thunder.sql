/*
  # Create Coding Challenges System

  1. New Tables
    - `challenges` - Stores coding challenges with details
    - `test_cases` - Stores test cases for challenges
    - `submissions` - Stores user submissions for challenges
    - `user_challenge_stats` - Tracks user progress and stats
    - `daily_challenges` - Tracks daily featured challenges

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Functions
    - Update user stats on submission
    - Create user stats for new profiles
*/

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  starter_code TEXT, 
  solution_code TEXT,
  time_limit_ms INTEGER DEFAULT 1000,
  memory_limit_mb INTEGER DEFAULT 128,
  points INTEGER DEFAULT 100,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error')),
  execution_time_ms FLOAT,
  memory_used_mb FLOAT,
  test_cases_passed INTEGER DEFAULT 0,
  test_cases_total INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_challenge_stats table
CREATE TABLE IF NOT EXISTS user_challenge_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  attempts INTEGER DEFAULT 0,
  solved BOOLEAN DEFAULT false,
  best_execution_time_ms FLOAT,
  best_memory_used_mb FLOAT,
  points_earned INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create daily_challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- Policies for challenges table
CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create challenges" ON challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own challenges" ON challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own challenges" ON challenges FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Policies for test_cases table
CREATE POLICY "Anyone can view test cases" ON test_cases FOR SELECT TO public USING (true);
CREATE POLICY "Users can manage test cases for their challenges" ON test_cases FOR ALL TO authenticated USING (auth.uid() = (SELECT created_by FROM challenges WHERE id = challenge_id));

-- Policies for submissions table
CREATE POLICY "Users can view their own submissions" ON submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create submissions" ON submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policies for user_challenge_stats table
CREATE POLICY "Users can view their own challenge stats" ON user_challenge_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenge stats" ON user_challenge_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own challenge stats" ON user_challenge_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view challenge stats" ON user_challenge_stats FOR SELECT TO public USING (true);

-- Policies for daily_challenges table
CREATE POLICY "Anyone can view daily challenges" ON daily_challenges FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can create daily challenges" ON daily_challenges FOR INSERT TO authenticated WITH CHECK (true);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_challenge_stats_updated_at
  BEFORE UPDATE ON user_challenge_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_created_by ON challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_test_cases_challenge_id ON test_cases(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_stats_user_id ON user_challenge_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_stats_challenge_id ON user_challenge_stats(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);

-- Add real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE test_cases;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_challenge_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_challenges;