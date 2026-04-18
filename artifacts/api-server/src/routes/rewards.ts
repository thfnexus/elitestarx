import { Router, type IRouter } from "express";
import { db, rewardsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../lib/auth";
import { REWARD_MILESTONES } from "../lib/rewardService";

const router: IRouter = Router();

router.get("/rewards", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const existingRewards = await db.select().from(rewardsTable).where(eq(rewardsTable.userId, user.id));
  const claimedMilestones = new Set(existingRewards.map(r => r.milestoneReferrals));

  const milestones = REWARD_MILESTONES.map(m => ({
    referrals: m.referrals,
    amount: m.amount,
    claimed: claimedMilestones.has(m.referrals),
  }));

  const totalRewardsClaimed = existingRewards.reduce((sum, r) => sum + Number(r.amount), 0);

  res.json({
    totalReferrals: user.referralCount,
    milestones,
    totalRewardsClaimed,
  });
});

export default router;
