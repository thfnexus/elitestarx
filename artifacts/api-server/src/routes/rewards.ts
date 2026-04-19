import { Router, type IRouter } from "express";
import { db, rewardsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

router.post("/rewards/claim", async (req, res): Promise<void> => {
  const user = await getAuthUser(req as any);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { referrals: milestoneReferrals } = req.body;
  
  if (typeof milestoneReferrals !== 'number') {
    res.status(400).json({ error: "milestoneReferrals is required" });
    return;
  }

  const milestone = REWARD_MILESTONES.find(m => m.referrals === milestoneReferrals);
  if (!milestone) {
    res.status(400).json({ error: "Invalid milestone" });
    return;
  }

  if (user.referralCount < milestone.referrals) {
    res.status(400).json({ error: "You haven't reached this milestone yet" });
    return;
  }

  const existingReward = await db.select().from(rewardsTable).where(
    and(
      eq(rewardsTable.userId, user.id),
      eq(rewardsTable.milestoneReferrals, milestone.referrals)
    )
  );

  if (existingReward.length > 0) {
    res.status(400).json({ error: "Milestone already claimed" });
    return;
  }

  try {
    const rewardAmount = milestone.amount;

    await db.insert(rewardsTable).values({
      userId: user.id,
      milestoneReferrals: milestone.referrals,
      amount: String(rewardAmount),
    });

    await db.update(usersTable).set({
      balance: String((Number(user.balance) + rewardAmount).toFixed(4)),
      totalEarnings: String((Number(user.totalEarnings) + rewardAmount).toFixed(4)),
    }).where(eq(usersTable.id, user.id));

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "reward",
      amount: String(rewardAmount),
      description: `Claimed ${milestone.referrals} referrals milestone bonus`,
      status: "completed",
    });

    res.json({ success: true, message: "Reward claimed successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to claim reward" });
  }
});

export default router;
