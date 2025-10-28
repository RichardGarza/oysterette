-- CreateEnum
CREATE TYPE "ReviewRating" AS ENUM ('LOVED_IT', 'LIKED_IT', 'MEH', 'HATED_IT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "preferences" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oysters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "standoutNotes" TEXT,
    "size" INTEGER NOT NULL DEFAULT 5,
    "body" INTEGER NOT NULL DEFAULT 5,
    "sweetBrininess" INTEGER NOT NULL DEFAULT 5,
    "flavorfulness" INTEGER NOT NULL DEFAULT 5,
    "creaminess" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oysters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oysterId" TEXT NOT NULL,
    "rating" "ReviewRating" NOT NULL,
    "size" INTEGER,
    "body" INTEGER,
    "sweetBrininess" INTEGER,
    "flavorfulness" INTEGER,
    "creaminess" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_top_oysters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oysterId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_top_oysters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "oysters_name_key" ON "oysters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_oysterId_key" ON "reviews"("userId", "oysterId");

-- CreateIndex
CREATE UNIQUE INDEX "user_top_oysters_userId_oysterId_key" ON "user_top_oysters"("userId", "oysterId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_oysterId_fkey" FOREIGN KEY ("oysterId") REFERENCES "oysters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_top_oysters" ADD CONSTRAINT "user_top_oysters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_top_oysters" ADD CONSTRAINT "user_top_oysters_oysterId_fkey" FOREIGN KEY ("oysterId") REFERENCES "oysters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
