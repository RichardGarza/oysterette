-- Reconcile schema drift introduced via `prisma db push` (Phases 20-23:
-- gamification, social, baseline flavor profile, OAuth, privacy settings).
--
-- These objects already exist on production (Neon), where they were applied
-- via `db push` without a corresponding migration. This migration is written
-- to be IDEMPOTENT so it:
--   * fully builds the objects on a fresh database (CI, new environments), and
--   * no-ops safely on databases where they already exist (production).
-- Every statement guards for pre-existence; running it against Neon on the
-- next `prisma migrate deploy` therefore makes no destructive changes.

-- AlterEnum: ReviewRating gained OKAY (renamed from WHATEVER) and reordered.
-- Only perform the swap when the enum is still in the old shape (has WHATEVER).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'ReviewRating' AND e.enumlabel = 'WHATEVER'
  ) THEN
    DROP TYPE IF EXISTS "ReviewRating_new";
    CREATE TYPE "ReviewRating_new" AS ENUM ('LOVE_IT', 'LIKE_IT', 'OKAY', 'MEH');
    ALTER TABLE "reviews"
      ALTER COLUMN "rating" TYPE "ReviewRating_new"
      USING (
        CASE "rating"::text
          WHEN 'WHATEVER' THEN 'OKAY'
          ELSE "rating"::text
        END
      )::"ReviewRating_new";
    ALTER TYPE "ReviewRating" RENAME TO "ReviewRating_old";
    ALTER TYPE "ReviewRating_new" RENAME TO "ReviewRating";
    DROP TYPE "public"."ReviewRating_old";
  END IF;
END
$$;

-- AlterTable: reviews
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "reviews" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable: users (baseline flavor profile, ranges, gamification, privacy, OAuth)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baselineBody" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baselineCreaminess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baselineFlavorfulness" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baselineSize" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baselineSweetBrininess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastReviewDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileVisibility" TEXT NOT NULL DEFAULT 'public';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMaxBody" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMaxCreaminess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMaxFlavorfulness" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMaxSize" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMaxSweetBrininess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMedianBody" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMedianCreaminess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMedianFlavorfulness" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMedianSize" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMedianSweetBrininess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMinBody" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMinCreaminess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMinFlavorfulness" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMinSize" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rangeMinSweetBrininess" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showFavorites" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showReviewHistory" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "showStatistics" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable: friendships
CREATE TABLE IF NOT EXISTS "friendships" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable: achievements
CREATE TABLE IF NOT EXISTS "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_achievements
CREATE TABLE IF NOT EXISTS "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "friendships_senderId_receiverId_key" ON "friendships"("senderId", "receiverId");
CREATE UNIQUE INDEX IF NOT EXISTS "achievements_key_key" ON "achievements"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_appleId_key" ON "users"("appleId");

-- AddForeignKey (guarded: ADD CONSTRAINT has no IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_senderId_fkey') THEN
    ALTER TABLE "friendships" ADD CONSTRAINT "friendships_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'friendships_receiverId_fkey') THEN
    ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_userId_fkey') THEN
    ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_achievements_achievementId_fkey') THEN
    ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
