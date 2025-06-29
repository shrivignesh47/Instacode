/*
  # Fix Foreign Key Constraint for Profiles Table

  1. Changes
     - Drops the existing foreign key constraint if it exists
     - Adds a new foreign key constraint that correctly references auth.users(id)
     - Notifies PostgREST to reload schema

  2. Security
     - No security changes
*/

-- Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';