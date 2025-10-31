-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "agreeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "disagreeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "netVoteScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAgrees" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDisagrees" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "review_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "isAgree" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_votes_userId_reviewId_key" ON "review_votes"("userId", "reviewId");

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
