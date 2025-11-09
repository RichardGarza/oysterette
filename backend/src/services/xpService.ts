/**
 * XP Service
 *
 * Handles experience points, leveling, achievements, and streaks.
 */

import prisma from '../lib/prisma';
import logger from '../utils/logger';

// XP rewards for different actions
export const XP_REWARDS = {
  FIRST_REVIEW: 20,
  REVIEW_OYSTER: 10,
  VOTE: 2,
  ADD_FAVORITE: 1,
  NEW_REGION: 15,
  RARE_OYSTER: 20,  // Oyster with < 5 reviews
  DAILY_LOGIN: 3,
  WEEKLY_STREAK: 50,
} as const;

// Level progression (XP required for each level)
export function getXPForLevel(level: number): number {
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 282 XP, Level 10: 2700 XP
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (getXPForLevel(level + 1) <= xp) {
    level++;
  }
  return Math.min(level, 100); // Cap at level 100
}

/**
 * Award XP to a user and check for level up
 */
export async function awardXP(userId: string, amount: number, reason: string): Promise<{
  xp: number;
  level: number;
  leveledUp: boolean;
  newAchievements: any[];
}> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const oldXP = user.xp;
    const oldLevel = user.level;
    const newXP = oldXP + amount;
    const newLevel = getLevelFromXP(newXP);
    const leveledUp = newLevel > oldLevel;

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXP, level: newLevel },
    });

    logger.info(`Awarded ${amount} XP to user ${userId} (${reason}). Total: ${newXP}`);

    // Check for new achievements
    const newAchievements = await checkAchievements(userId);

    return { xp: newXP, level: newLevel, leveledUp, newAchievements };
  } catch (error) {
    logger.error('Error awarding XP:', error);
    throw error;
  }
}

/**
 * Update streak (called after review submission)
 */
export async function updateStreak(userId: string): Promise<{ currentStreak: number; isNewRecord: boolean }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastReview = user.lastReviewDate
    ? new Date(user.lastReviewDate.getFullYear(), user.lastReviewDate.getMonth(), user.lastReviewDate.getDate())
    : null;

  let currentStreak = user.currentStreak;
  let isNewRecord = false;

  if (!lastReview) {
    // First review ever
    currentStreak = 1;
  } else {
    const daysSince = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) {
      // Already reviewed today, no change
      return { currentStreak, isNewRecord: false };
    } else if (daysSince === 1) {
      // Consecutive day
      currentStreak++;
    } else {
      // Streak broken
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(currentStreak, user.longestStreak);
  isNewRecord = longestStreak > user.longestStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak,
      lastReviewDate: now,
    },
  });

  // Award streak bonus XP
  if (currentStreak % 7 === 0) {
    await awardXP(userId, XP_REWARDS.WEEKLY_STREAK, `${currentStreak}-day streak`);
  }

  return { currentStreak, isNewRecord };
}

/**
 * Check and unlock achievements
 */
export async function checkAchievements(userId: string): Promise<any[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviews: true,
      achievements: { include: { achievement: true } },
    },
  });

  if (!user) return [];

  const unlockedKeys = user.achievements.map((ua) => ua.achievement.key);
  const newAchievements: any[] = [];

  // Define achievement criteria
  const criteria = [
    { key: 'first_review', name: 'First Taste', description: 'Reviewed your first oyster', icon: '🦪', xpReward: 25, check: () => user.reviews.length >= 1 },
    { key: '10_reviews', name: 'Taste Explorer', description: 'Reviewed 10 oysters', icon: '🌊', xpReward: 100, check: () => user.reviews.length >= 10 },
    { key: '50_reviews', name: 'Oyster Connoisseur', description: 'Reviewed 50 oysters', icon: '👑', xpReward: 500, check: () => user.reviews.length >= 50 },
    { key: '7_day_streak', name: 'Dedicated Taster', description: 'Reviewed for 7 days in a row', icon: '🔥', xpReward: 150, check: () => user.currentStreak >= 7 },
    { key: '30_day_streak', name: 'Iron Shell', description: 'Reviewed for 30 days in a row', icon: '💎', xpReward: 1000, check: () => user.currentStreak >= 30 },
  ];

  for (const criterion of criteria) {
    if (!unlockedKeys.includes(criterion.key) && criterion.check()) {
      // Create achievement if it doesn't exist
      let achievement = await prisma.achievement.findUnique({ where: { key: criterion.key } });
      if (!achievement) {
        achievement = await prisma.achievement.create({
          data: {
            key: criterion.key,
            name: criterion.name,
            description: criterion.description,
            icon: criterion.icon,
            xpReward: criterion.xpReward,
          },
        });
      }

      // Unlock for user
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });

      // Award XP
      await awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`);

      newAchievements.push(achievement);
      logger.info(`User ${userId} unlocked achievement: ${achievement.name}`);
    }
  }

  return newAchievements;
}

/**
 * Get user XP stats
 */
export async function getUserXPStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      },
    },
  });

  if (!user) throw new Error('User not found');

  const currentLevelXP = getXPForLevel(user.level);
  const nextLevelXP = getXPForLevel(user.level + 1);
  const xpProgress = user.xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.round((xpProgress / xpNeeded) * 100);

  return {
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    xpProgress,
    xpNeeded,
    progressPercent,
    achievements: user.achievements.map((ua) => ({
      ...ua.achievement,
      unlockedAt: ua.unlockedAt,
    })),
  };
}
