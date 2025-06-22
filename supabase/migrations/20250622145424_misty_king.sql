/*
  # Revamp Coding Challenges System

  1. New Structure
    - `problems` table - Individual coding problems (replaces old challenges)
    - `coding_challenges` table - Collections of problems
    - `coding_challenge_problems` table - Junction table linking problems to challenges
    - Updated test_cases, submissions, and stats tables

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Functions
    - Update user stats on submission
    - Track leaderboards for challenges
*/

-- Create problems table (replaces old challenges table)
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
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

-- Create coding_challenges table (collections of problems)
CREATE TABLE IF NOT EXISTS coding_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create junction table for problems in challenges
CREATE TABLE IF NOT EXISTS coding_challenge_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES coding_challenges(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  points_multiplier FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, problem_id)
);

-- Create test_cases table linked to problems
CREATE TABLE IF NOT EXISTS problem_test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create submissions table linked to problems
CREATE TABLE IF NOT EXISTS problem_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES coding_challenges(id) ON DELETE SET NULL,
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

-- Create user_problem_stats table
CREATE TABLE IF NOT EXISTS user_problem_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  attempts INTEGER DEFAULT 0,
  solved BOOLEAN DEFAULT false,
  best_execution_time_ms FLOAT,
  best_memory_used_mb FLOAT,
  points_earned INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

-- Create daily_problems table
CREATE TABLE IF NOT EXISTS daily_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create coding_challenge_leaderboards table
CREATE TABLE IF NOT EXISTS coding_challenge_leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES coding_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_points INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create problem_imports table to track Excel/CSV imports
CREATE TABLE IF NOT EXISTS problem_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  problems_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_challenge_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_problem_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_challenge_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_imports ENABLE ROW LEVEL SECURITY;

-- Policies for problems table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problems' AND policyname = 'Anyone can view problems') THEN
    CREATE POLICY "Anyone can view problems" ON problems FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problems' AND policyname = 'Authenticated users can create problems') THEN
    CREATE POLICY "Authenticated users can create problems" ON problems FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problems' AND policyname = 'Users can update their own problems') THEN
    CREATE POLICY "Users can update their own problems" ON problems FOR UPDATE TO authenticated USING (auth.uid() = created_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problems' AND policyname = 'Users can delete their own problems') THEN
    CREATE POLICY "Users can delete their own problems" ON problems FOR DELETE TO authenticated USING (auth.uid() = created_by);
  END IF;
END $$;

-- Policies for coding_challenges table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenges' AND policyname = 'Anyone can view coding challenges') THEN
    CREATE POLICY "Anyone can view coding challenges" ON coding_challenges FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenges' AND policyname = 'Authenticated users can create coding challenges') THEN
    CREATE POLICY "Authenticated users can create coding challenges" ON coding_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenges' AND policyname = 'Users can update their own coding challenges') THEN
    CREATE POLICY "Users can update their own coding challenges" ON coding_challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenges' AND policyname = 'Users can delete their own coding challenges') THEN
    CREATE POLICY "Users can delete their own coding challenges" ON coding_challenges FOR DELETE TO authenticated USING (auth.uid() = created_by);
  END IF;
END $$;

-- Policies for coding_challenge_problems table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenge_problems' AND policyname = 'Anyone can view challenge problems') THEN
    CREATE POLICY "Anyone can view challenge problems" ON coding_challenge_problems FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenge_problems' AND policyname = 'Challenge creators can manage problems') THEN
    CREATE POLICY "Challenge creators can manage problems" ON coding_challenge_problems FOR ALL TO authenticated USING (
      auth.uid() = (SELECT created_by FROM coding_challenges WHERE id = challenge_id)
    );
  END IF;
END $$;

-- Policies for problem_test_cases table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_test_cases' AND policyname = 'Anyone can view sample test cases') THEN
    CREATE POLICY "Anyone can view sample test cases" ON problem_test_cases FOR SELECT TO public USING (is_sample = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_test_cases' AND policyname = 'Problem creators can view all test cases') THEN
    CREATE POLICY "Problem creators can view all test cases" ON problem_test_cases FOR SELECT TO authenticated USING (
      auth.uid() = (SELECT created_by FROM problems WHERE id = problem_id)
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_test_cases' AND policyname = 'Problem creators can manage test cases') THEN
    CREATE POLICY "Problem creators can manage test cases" ON problem_test_cases FOR ALL TO authenticated USING (
      auth.uid() = (SELECT created_by FROM problems WHERE id = problem_id)
    );
  END IF;
END $$;

-- Policies for problem_submissions table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_submissions' AND policyname = 'Users can view their own submissions') THEN
    CREATE POLICY "Users can view their own submissions" ON problem_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_submissions' AND policyname = 'Users can create submissions') THEN
    CREATE POLICY "Users can create submissions" ON problem_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policies for user_problem_stats table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_problem_stats' AND policyname = 'Users can view their own problem stats') THEN
    CREATE POLICY "Users can view their own problem stats" ON user_problem_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_problem_stats' AND policyname = 'Users can update their own problem stats') THEN
    CREATE POLICY "Users can update their own problem stats" ON user_problem_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_problem_stats' AND policyname = 'Users can create their own problem stats') THEN
    CREATE POLICY "Users can create their own problem stats" ON user_problem_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_problem_stats' AND policyname = 'Anyone can view problem stats') THEN
    CREATE POLICY "Anyone can view problem stats" ON user_problem_stats FOR SELECT TO public USING (true);
  END IF;
END $$;

-- Policies for daily_problems table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_problems' AND policyname = 'Anyone can view daily problems') THEN
    CREATE POLICY "Anyone can view daily problems" ON daily_problems FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_problems' AND policyname = 'Authenticated users can create daily problems') THEN
    CREATE POLICY "Authenticated users can create daily problems" ON daily_problems FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Policies for coding_challenge_leaderboards table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenge_leaderboards' AND policyname = 'Anyone can view challenge leaderboards') THEN
    CREATE POLICY "Anyone can view challenge leaderboards" ON coding_challenge_leaderboards FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coding_challenge_leaderboards' AND policyname = 'System can update leaderboards') THEN
    CREATE POLICY "System can update leaderboards" ON coding_challenge_leaderboards FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Policies for problem_imports table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_imports' AND policyname = 'Users can view their own imports') THEN
    CREATE POLICY "Users can view their own imports" ON problem_imports FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_imports' AND policyname = 'Users can create imports') THEN
    CREATE POLICY "Users can create imports" ON problem_imports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problem_imports' AND policyname = 'Users can update their own imports') THEN
    CREATE POLICY "Users can update their own imports" ON problem_imports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_problems_updated_at ON problems;
CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coding_challenges_updated_at ON coding_challenges;
CREATE TRIGGER update_coding_challenges_updated_at
  BEFORE UPDATE ON coding_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_problem_stats_updated_at ON user_problem_stats;
CREATE TRIGGER update_user_problem_stats_updated_at
  BEFORE UPDATE ON user_problem_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coding_challenge_leaderboards_updated_at ON coding_challenge_leaderboards;
CREATE TRIGGER update_coding_challenge_leaderboards_updated_at
  BEFORE UPDATE ON coding_challenge_leaderboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_problem_imports_updated_at ON problem_imports;
CREATE TRIGGER update_problem_imports_updated_at
  BEFORE UPDATE ON problem_imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase
  slug := lower(title);
  -- Replace spaces with hyphens
  slug := regexp_replace(slug, '\s+', '-', 'g');
  -- Remove special characters
  slug := regexp_replace(slug, '[^a-z0-9\-]', '', 'g');
  -- Remove multiple hyphens
  slug := regexp_replace(slug, '\-+', '-', 'g');
  -- Trim hyphens from start and end
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate slug from title for problems
CREATE OR REPLACE FUNCTION set_problem_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base slug from title
  base_slug := generate_slug(NEW.title);
  new_slug := base_slug;
  
  -- Check if slug exists and append counter if needed
  WHILE EXISTS (SELECT 1 FROM problems WHERE slug = new_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_problem_slug_trigger ON problems;
CREATE TRIGGER set_problem_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON problems
  FOR EACH ROW EXECUTE FUNCTION set_problem_slug();

-- Function to update user stats when a submission is made
CREATE OR REPLACE FUNCTION update_user_problem_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stats exist for this user and problem
  IF EXISTS (SELECT 1 FROM user_problem_stats WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id) THEN
    -- Update existing stats
    UPDATE user_problem_stats
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
        THEN (SELECT points FROM problems WHERE id = NEW.problem_id)
        ELSE points_earned
      END,
      last_attempted_at = now(),
      updated_at = now()
    WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id;
  ELSE
    -- Create new stats
    INSERT INTO user_problem_stats (
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
      CASE WHEN NEW.status = 'accepted' THEN (SELECT points FROM problems WHERE id = NEW.problem_id) ELSE 0 END,
      now()
    );
  END IF;

  -- If submission is part of a challenge, update challenge leaderboard
  IF NEW.challenge_id IS NOT NULL AND NEW.status = 'accepted' THEN
    -- Check if leaderboard entry exists
    IF EXISTS (SELECT 1 FROM coding_challenge_leaderboards WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id) THEN
      -- Update existing leaderboard entry
      UPDATE coding_challenge_leaderboards
      SET 
        total_points = (
          SELECT SUM(ups.points_earned * COALESCE(ccp.points_multiplier, 1.0))
          FROM user_problem_stats ups
          JOIN coding_challenge_problems ccp ON ups.problem_id = ccp.problem_id
          WHERE ups.user_id = NEW.user_id
            AND ccp.challenge_id = NEW.challenge_id
            AND ups.solved = true
        ),
        problems_solved = (
          SELECT COUNT(*)
          FROM user_problem_stats ups
          JOIN coding_challenge_problems ccp ON ups.problem_id = ccp.problem_id
          WHERE ups.user_id = NEW.user_id
            AND ccp.challenge_id = NEW.challenge_id
            AND ups.solved = true
        ),
        problems_attempted = (
          SELECT COUNT(DISTINCT problem_id)
          FROM problem_submissions
          WHERE user_id = NEW.user_id
            AND challenge_id = NEW.challenge_id
        ),
        updated_at = now()
      WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
    ELSE
      -- Create new leaderboard entry
      INSERT INTO coding_challenge_leaderboards (
        challenge_id,
        user_id,
        total_points,
        problems_solved,
        problems_attempted
      ) VALUES (
        NEW.challenge_id,
        NEW.user_id,
        (
          SELECT COALESCE(SUM(ups.points_earned * COALESCE(ccp.points_multiplier, 1.0)), 0)
          FROM user_problem_stats ups
          JOIN coding_challenge_problems ccp ON ups.problem_id = ccp.problem_id
          WHERE ups.user_id = NEW.user_id
            AND ccp.challenge_id = NEW.challenge_id
            AND ups.solved = true
        ),
        (
          SELECT COUNT(*)
          FROM user_problem_stats ups
          JOIN coding_challenge_problems ccp ON ups.problem_id = ccp.problem_id
          WHERE ups.user_id = NEW.user_id
            AND ccp.challenge_id = NEW.challenge_id
            AND ups.solved = true
        ),
        (
          SELECT COUNT(DISTINCT problem_id)
          FROM problem_submissions
          WHERE user_id = NEW.user_id
            AND challenge_id = NEW.challenge_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_problem_stats_trigger ON problem_submissions;
CREATE TRIGGER update_user_problem_stats_trigger
  AFTER INSERT ON problem_submissions
  FOR EACH ROW EXECUTE FUNCTION update_user_problem_stats();

-- Function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_challenge_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ranks for the affected challenge
  UPDATE coding_challenge_leaderboards
  SET rank = ranks.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY challenge_id 
      ORDER BY total_points DESC, problems_solved DESC, problems_attempted ASC
    ) as rank
    FROM coding_challenge_leaderboards
    WHERE challenge_id = NEW.challenge_id
  ) ranks
  WHERE coding_challenge_leaderboards.id = ranks.id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_challenge_leaderboard_ranks_trigger ON coding_challenge_leaderboards;
CREATE TRIGGER update_challenge_leaderboard_ranks_trigger
  AFTER INSERT OR UPDATE ON coding_challenge_leaderboards
  FOR EACH ROW EXECUTE FUNCTION update_challenge_leaderboard_ranks();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_problems_created_by ON problems(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);
CREATE INDEX IF NOT EXISTS idx_coding_challenges_created_by ON coding_challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_coding_challenge_problems_challenge_id ON coding_challenge_problems(challenge_id);
CREATE INDEX IF NOT EXISTS idx_coding_challenge_problems_problem_id ON coding_challenge_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_test_cases_problem_id ON problem_test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_submissions_user_id ON problem_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_submissions_problem_id ON problem_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_submissions_challenge_id ON problem_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_problem_stats_user_id ON user_problem_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_problem_stats_problem_id ON user_problem_stats(problem_id);
CREATE INDEX IF NOT EXISTS idx_daily_problems_date ON daily_problems(date);
CREATE INDEX IF NOT EXISTS idx_coding_challenge_leaderboards_challenge_id ON coding_challenge_leaderboards(challenge_id);
CREATE INDEX IF NOT EXISTS idx_coding_challenge_leaderboards_user_id ON coding_challenge_leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_imports_user_id ON problem_imports(user_id);

-- Add real-time for new tables
DO $$
BEGIN
  -- Check if tables are already in the publication before adding them
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'problems'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE problems;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coding_challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE coding_challenges;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coding_challenge_problems'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE coding_challenge_problems;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'problem_test_cases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE problem_test_cases;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'problem_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE problem_submissions;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_problem_stats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_problem_stats;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_problems'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_problems;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'coding_challenge_leaderboards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE coding_challenge_leaderboards;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'problem_imports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE problem_imports;
  END IF;
END $$;