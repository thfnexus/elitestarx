import { db, usersTable, rewardsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

export const REWARD_MILESTONES = [
  { referrals: 15, amount: 3.0 },
  { referrals: 30, amount: 3.57 },
  { referrals: 50, amount: 6.0 },
  { referrals: 100, amount: 15.0 },
  { referrals: 200, amount: 30.0 },
  { referrals: 300, amount: 35.0 },
  { referrals: 400, amount: 40.0 },
  { referrals: 550, amount: 50.0 },
  { referrals: 800, amount: 80.0 },
  { referrals: 1000, amount: 107.14 },
];

export async function checkAndGrantRewards(userId: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const existingRewards = await db.select().from(rewardsTable).where(eq(rewardsTable.userId, userId));
  const claimedMilestones = new Set(existingRewards.map((r) => r.milestoneReferrals));

  for (const milestone of REWARD_MILESTONES) {
    if (user.referralCount >= milestone.referrals && !claimedMilestones.has(milestone.referrals)) {
      await db.insert(rewardsTable).values({
        userId,
        milestoneReferrals: milestone.referrals,
        amount: String(milestone.amount),
        claimed: true,
        claimedAt: new Date(),
      });

      await db.update(usersTable).set({
        balance: String(Number(user.balance) + milestone.amount),
        totalEarnings: String(Number(user.totalEarnings) + milestone.amount),
      }).where(eq(usersTable.id, userId));

      await db.insert(transactionsTable).values({
        userId,
        type: "reward",
        amount: String(milestone.amount),
        description: `Milestone reward: ${milestone.referrals} referrals`,
        status: "completed",
      });

      logger.info({ userId, milestone: milestone.referrals, amount: milestone.amount }, "Reward granted");
    }
  }
}
