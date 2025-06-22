/*
  # Fix Foreign Key Relationships

  1. Add missing foreign key constraints
    - daily_problems.problem_id -> problems.id
    - user_problem_stats.problem_id -> problems.id
    - problem_test_cases.problem_id -> problems.id
    - problem_submissions.problem_id -> problems.id
    - coding_challenge_problems.problem_id -> problems.id

  2. Ensure all relationships are properly defined for PostgREST to recognize them
*/

-- Add foreign key constraint for daily_problems.problem_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'daily_problems_problem_id_fkey' 
    AND table_name = 'daily_problems'
  ) THEN
    ALTER TABLE daily_problems 
    ADD CONSTRAINT daily_problems_problem_id_fkey 
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for user_problem_stats.problem_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_problem_stats_problem_id_fkey' 
    AND table_name = 'user_problem_stats'
  ) THEN
    ALTER TABLE user_problem_stats 
    ADD CONSTRAINT user_problem_stats_problem_id_fkey 
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for problem_test_cases.problem_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'problem_test_cases_problem_id_fkey' 
    AND table_name = 'problem_test_cases'
  ) THEN
    ALTER TABLE problem_test_cases 
    ADD CONSTRAINT problem_test_cases_problem_id_fkey 
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for problem_submissions.problem_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'problem_submissions_problem_id_fkey' 
    AND table_name = 'problem_submissions'
  ) THEN
    ALTER TABLE problem_submissions 
    ADD CONSTRAINT problem_submissions_problem_id_fkey 
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for coding_challenge_problems.problem_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coding_challenge_problems_problem_id_fkey' 
    AND table_name = 'coding_challenge_problems'
  ) THEN
    ALTER TABLE coding_challenge_problems 
    ADD CONSTRAINT coding_challenge_problems_problem_id_fkey 
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for user_problem_stats.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_problem_stats_user_id_fkey' 
    AND table_name = 'user_problem_stats'
  ) THEN
    ALTER TABLE user_problem_stats 
    ADD CONSTRAINT user_problem_stats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for problem_submissions.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'problem_submissions_user_id_fkey' 
    AND table_name = 'problem_submissions'
  ) THEN
    ALTER TABLE problem_submissions 
    ADD CONSTRAINT problem_submissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Refresh the schema cache by updating a system table (this forces PostgREST to reload)
-- This is a workaround to refresh the schema cache programmatically
NOTIFY pgrst, 'reload schema';