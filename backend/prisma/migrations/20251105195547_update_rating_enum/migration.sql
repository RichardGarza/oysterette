-- Custom migration to update ReviewRating enum values
-- This safely migrates existing data from old values to new values

-- Create new enum type with the desired values
CREATE TYPE "ReviewRating_new" AS ENUM ('LOVE_IT', 'LIKE_IT', 'MEH', 'WHATEVER');

-- Migrate existing data using CASE to map old values to new ones
ALTER TABLE reviews
  ALTER COLUMN rating TYPE "ReviewRating_new"
  USING (
    CASE rating::text
      WHEN 'LOVED_IT' THEN 'LOVE_IT'
      WHEN 'LIKED_IT' THEN 'LIKE_IT'
      WHEN 'MEH' THEN 'MEH'
      WHEN 'HATED_IT' THEN 'WHATEVER'
      ELSE 'MEH' -- Default fallback
    END
  )::"ReviewRating_new";

-- Drop old enum and rename new one
DROP TYPE "ReviewRating";
ALTER TYPE "ReviewRating_new" RENAME TO "ReviewRating";
