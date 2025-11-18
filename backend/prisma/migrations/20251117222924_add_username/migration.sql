-- Add username field to User table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
